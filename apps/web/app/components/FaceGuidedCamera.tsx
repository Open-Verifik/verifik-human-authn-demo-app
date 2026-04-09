"use client";

import * as faceapi from "@vladmandic/face-api";
import { useCallback, useEffect, useRef, useState } from "react";
import { ensureTfReady, loadFaceModels } from "@/lib/faceCrop";
import {
	DEFAULT_FACE_GUIDE,
	DEFAULT_GUIDE_ASPECT_RATIO,
	evaluateGuidedFrame,
	getCenterAndRadius,
	type FaceGuideError,
} from "@/lib/faceGuidedCaptureLogic";

export type FaceGuidedCapturePayload = {
	dataUrl: string;
	base64: string;
};

type StatusHintPlacement = "below" | "hidden";

type Props = {
	onCapture: (payload: FaceGuidedCapturePayload) => void | Promise<void>;
	onError?: (message: string) => void;
	className?: string;
	disabled?: boolean;
	mirror?: boolean;
	successFrames?: number;
	tickMs?: number;
	/** Omit the long idle explainer; parent supplies context (e.g. face-comparison). */
	hideIdleExplainer?: boolean;
	/** Hide status line under the viewfinder when the page already has a headline. */
	statusHint?: StatusHintPlacement;
	/**
	 * Expand the preview to fill a tall parent (e.g. scanner frame) instead of a fixed 16:9 cap.
	 * Parent should be a flex column with a defined height (e.g. `flex-1 min-h-0 h-full`).
	 */
	fillFrame?: boolean;
	captureSuccessFeedbackMs?: number;
};

const DIRECTION_LABEL: Record<string, string> = {
	"←": "left",
	"→": "right",
	"↑": "up",
	"↓": "down",
};

const describeDirections = (raw: string) => {
	if (!raw) return "";
	const parts = [...raw].map((ch) => DIRECTION_LABEL[ch] ?? ch).filter(Boolean);
	return parts.length ? `Move slightly ${parts.join(" and ")}` : "";
};

/**
 * Maps intrinsic frame coords to the view box when video uses CSS object-cover.
 */
const coverLayout = (containerW: number, containerH: number, intrinsicW: number, intrinsicH: number) => {
	const scale = Math.max(containerW / intrinsicW, containerH / intrinsicH);
	const ox = (containerW - intrinsicW * scale) / 2;
	const oy = (containerH - intrinsicH * scale) / 2;
	return { scale, ox, oy };
};

export function FaceGuidedCamera({
	onCapture,
	onError,
	className = "",
	disabled = false,
	mirror = true,
	successFrames = DEFAULT_FACE_GUIDE.successFramesRequired,
	tickMs = 160,
	hideIdleExplainer = false,
	statusHint = "below",
	fillFrame = false,
	captureSuccessFeedbackMs = 700,
}: Props) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const maskRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const streakRef = useRef(0);
	const capturingRef = useRef(false);
	const overlayStrokeOkRef = useRef(false);
	const rafRetryRef = useRef<number | null>(null);
	const overlayRetryRef = useRef<number | null>(null);
	const captureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const dimRetryCountRef = useRef(0);
	const overlayRetryCountRef = useRef(0);
	const detectionErrorShownRef = useRef(false);
	const MAX_DIM_RETRIES = 90;
	const MAX_OVERLAY_RETRIES = 30;

	const [modelsReady, setModelsReady] = useState(false);
	const [modelsError, setModelsError] = useState<string | null>(null);
	const [cameraStarting, setCameraStarting] = useState(false);
	const [streamActive, setStreamActive] = useState(false);
	const [guideError, setGuideError] = useState<FaceGuideError | null>(null);
	const [statusOk, setStatusOk] = useState(false);
	const [captureSuccess, setCaptureSuccess] = useState(false);

	const stopStream = useCallback(() => {
		if (tickRef.current) {
			clearInterval(tickRef.current);
			tickRef.current = null;
		}
		if (rafRetryRef.current != null) {
			cancelAnimationFrame(rafRetryRef.current);
			rafRetryRef.current = null;
		}
		if (overlayRetryRef.current != null) {
			cancelAnimationFrame(overlayRetryRef.current);
			overlayRetryRef.current = null;
		}
		if (captureTimeoutRef.current) {
			clearTimeout(captureTimeoutRef.current);
			captureTimeoutRef.current = null;
		}
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
		if (videoRef.current) videoRef.current.srcObject = null;
		setStreamActive(false);
		streakRef.current = 0;
		capturingRef.current = false;
		overlayStrokeOkRef.current = false;
		dimRetryCountRef.current = 0;
		overlayRetryCountRef.current = 0;
		detectionErrorShownRef.current = false;
		setCaptureSuccess(false);
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				await loadFaceModels();
				if (!cancelled) setModelsReady(true);
			} catch (e) {
				const msg = e instanceof Error ? e.message : "Failed to load face models";
				if (!cancelled) {
					setModelsError(msg);
					onError?.(msg);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [onError]);

	useEffect(() => () => stopStream(), [stopStream]);

	const drawOverlay = useCallback(
		function drawOverlay(intrinsicW: number, intrinsicH: number, oval: ReturnType<typeof getCenterAndRadius>, ok: boolean) {
			const canvas = maskRef.current;
			const container = containerRef.current;
			if (!canvas || !container) return;

			overlayStrokeOkRef.current = ok;

			const cw = container.clientWidth;
			const ch = container.clientHeight;
			if (cw === 0 || ch === 0) {
				if (overlayRetryRef.current == null && overlayRetryCountRef.current < MAX_OVERLAY_RETRIES) {
					overlayRetryCountRef.current += 1;
					overlayRetryRef.current = requestAnimationFrame(() => {
						overlayRetryRef.current = null;
						drawOverlay(intrinsicW, intrinsicH, oval, ok);
					});
				}
				return;
			}
			overlayRetryCountRef.current = 0;

			canvas.width = cw;
			canvas.height = ch;

			const { scale, ox, oy } = coverLayout(cw, ch, intrinsicW, intrinsicH);

			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const { center, radius } = oval;
			const cx = ox + center.x * scale;
			const cy = oy + center.y * scale;
			const rx = radius.x * scale;
			const ry = radius.y * scale;

			ctx.clearRect(0, 0, cw, ch);
			ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
			ctx.fillRect(0, 0, cw, ch);
			ctx.globalCompositeOperation = "destination-out";
			ctx.fillStyle = "#fff";
			ctx.beginPath();
			ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.globalCompositeOperation = "source-over";

			ctx.beginPath();
			ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
			ctx.lineWidth = 4;
			ctx.strokeStyle = ok ? "#22c55e" : "#ef4444";
			ctx.stroke();
		},
		[],
	);

	const drawPlaceholderFromVideo = useCallback(() => {
		const video = videoRef.current;
		if (!video) return;
		const w = video.videoWidth;
		const h = video.videoHeight;
		if (!w || !h) return;
		const oval = getCenterAndRadius(h, w, DEFAULT_GUIDE_ASPECT_RATIO);
		drawOverlay(w, h, oval, false);
	}, [drawOverlay]);

	const runTick = useCallback(async () => {
		const video = videoRef.current;
		if (!video || capturingRef.current || disabled) return;
		const w = video.videoWidth;
		const h = video.videoHeight;
		if (!w || !h) {
			if (dimRetryCountRef.current < MAX_DIM_RETRIES) {
				dimRetryCountRef.current += 1;
				rafRetryRef.current = requestAnimationFrame(() => {
					rafRetryRef.current = null;
					void runTick();
				});
			}
			return;
		}
		dimRetryCountRef.current = 0;
		const oval = getCenterAndRadius(h, w, DEFAULT_GUIDE_ASPECT_RATIO);
		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.drawImage(video, 0, 0, w, h);

		if (h < DEFAULT_FACE_GUIDE.minImageHeight) {
			setGuideError({
				kind: "no_face",
				title: "Resolution too low",
				subtitle: "Use a better camera or better lighting",
			});
			setStatusOk(false);
			streakRef.current = 0;
			drawOverlay(w, h, oval, false);
			return;
		}
		try {
			await ensureTfReady();
			const detections = await faceapi
				.detectAllFaces(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: DEFAULT_FACE_GUIDE.ssdMinConfidence }))
				.withFaceLandmarks();

			detectionErrorShownRef.current = false;

			if (detections.length === 0) {
				streakRef.current = 0;
				setGuideError({
					kind: "no_face",
					title: "No face detected",
					subtitle: "Position your face in the frame",
				});
				setStatusOk(false);
				drawOverlay(w, h, oval, false);
				return;
			}

			const det = detections[0];
			const box = det.detection.box;
			const nose = det.landmarks.getNose()[3];

			const ev = evaluateGuidedFrame({
				imageWidth: w,
				imageHeight: h,
				oval,
				noseX: nose.x,
				noseY: nose.y,
				faceBoxWidth: box.width,
				faceBoxHeight: box.height,
			});

			if (ev.error) {
				streakRef.current = 0;
				setGuideError(ev.error);
				setStatusOk(false);
				drawOverlay(w, h, oval, false);
				return;
			}

			streakRef.current += 1;
			setGuideError(null);
			setStatusOk(true);
			drawOverlay(w, h, oval, true);

			if (streakRef.current >= successFrames) {
				capturingRef.current = true;
				if (tickRef.current) {
					clearInterval(tickRef.current);
					tickRef.current = null;
				}
				setCaptureSuccess(true);

				const finalizeCapture = () => {
					const out = document.createElement("canvas");
					out.width = w;
					out.height = h;
					out.getContext("2d")?.drawImage(video, 0, 0, w, h);
					const dataUrl = out.toDataURL("image/jpeg", 0.92);
					const comma = dataUrl.indexOf(",");
					const base64 = comma === -1 ? "" : dataUrl.slice(comma + 1);

					stopStream();
					void Promise.resolve(onCapture({ dataUrl, base64 }));
				};

				if (captureSuccessFeedbackMs > 0) {
					captureTimeoutRef.current = setTimeout(() => {
						captureTimeoutRef.current = null;
						finalizeCapture();
					}, captureSuccessFeedbackMs);
				} else {
					finalizeCapture();
				}
			}
		} catch (error) {
			streakRef.current = 0;
			setStatusOk(false);
			setGuideError({
				kind: "no_face",
				title: "Face detection unavailable",
				subtitle: "Reload the page or upload from gallery",
			});
			drawOverlay(w, h, oval, false);
			if (!detectionErrorShownRef.current) {
				detectionErrorShownRef.current = true;
				const msg = error instanceof Error ? error.message : "Face detection unavailable";
				console.error("Face detection failed", error);
				onError?.(msg);
			}
		}
	}, [captureSuccessFeedbackMs, disabled, drawOverlay, onCapture, onError, stopStream, successFrames]);

	const startCamera = async () => {
		if (disabled || !modelsReady || capturingRef.current) return;
		setCameraStarting(true);
		setCaptureSuccess(false);
		setGuideError(null);
		detectionErrorShownRef.current = false;
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
				audio: false,
			});
			streamRef.current = stream;
			const v = videoRef.current;
			if (!v) throw new Error("Camera preview unavailable");
			v.srcObject = stream;
			v.setAttribute("playsinline", "true");
			await v.play();
			setStreamActive(true);
			streakRef.current = 0;

			const startLoop = () => {
				drawPlaceholderFromVideo();
				if (tickRef.current) clearInterval(tickRef.current);
				tickRef.current = setInterval(() => {
					void runTick();
				}, tickMs);
			};

			let started = false;
			const onReady = () => {
				if (started) return;
				started = true;
				startLoop();
			};
			if (v.videoWidth > 0 && v.videoHeight > 0) {
				onReady();
			} else {
				v.addEventListener("loadedmetadata", onReady, { once: true });
				v.addEventListener("playing", onReady, { once: true });
			}
		} catch {
			const msg = "Camera access denied or unavailable";
			onError?.(msg);
			setGuideError({ kind: "no_face", title: "Camera blocked", subtitle: "Allow camera access or use file upload" });
		} finally {
			setCameraStarting(false);
		}
	};

	useEffect(() => {
		if (!streamActive) return;
		const el = containerRef.current;
		if (!el || typeof ResizeObserver === "undefined") return;
		const ro = new ResizeObserver(() => {
			const video = videoRef.current;
			if (!video?.videoWidth || !video.videoHeight) return;
			const w = video.videoWidth;
			const h = video.videoHeight;
			const oval = getCenterAndRadius(h, w, DEFAULT_GUIDE_ASPECT_RATIO);
			drawOverlay(w, h, oval, overlayStrokeOkRef.current);
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, [streamActive, drawOverlay]);

	const statusLine = () => {
		if (captureSuccess) {
			return (
				<>
					<p className="font-semibold text-green-600 dark:text-green-400">Photo captured</p>
					<p className="text-sm text-on-surface-variant">Using this frame for the next step</p>
				</>
			);
		}
		if (guideError?.kind === "center") {
			return (
				<>
					<p className="font-semibold text-on-surface">{guideError.title}</p>
					<p className="text-sm text-on-surface-variant">{guideError.subtitle}</p>
					{guideError.directions ? (
						<p className="text-xs text-primary mt-1">{describeDirections(guideError.directions)}</p>
					) : null}
				</>
			);
		}
		if (guideError?.kind === "close") {
			return (
				<>
					<p className="font-semibold text-on-surface">{guideError.title}</p>
					<p className="text-sm text-on-surface-variant">{guideError.subtitle}</p>
				</>
			);
		}
		if (guideError?.kind === "no_face") {
			return (
				<>
					<p className="font-semibold text-on-surface">{guideError.title}</p>
					<p className="text-sm text-on-surface-variant">{guideError.subtitle}</p>
				</>
			);
		}
		if (statusOk) {
			return <p className="text-sm font-medium text-green-600 dark:text-green-400">Hold still…</p>;
		}
		return <p className="text-sm text-on-surface-variant">Align your face in the frame</p>;
	};

	if (modelsError) {
		return (
			<div className={`rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 text-sm text-on-surface ${className}`}>
				{modelsError}
			</div>
		);
	}

	if (!modelsReady) {
		return (
			<div
				className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low p-8 ${className}`}
			>
				<span className="material-symbols-outlined text-4xl text-primary animate-pulse">face_retouching_natural</span>
				<p className="text-sm text-on-surface-variant">Loading face detection…</p>
			</div>
		);
	}

	const viewfinderClass = fillFrame
		? "relative w-full min-h-[260px] flex-1 overflow-hidden rounded-xl bg-black"
		: "relative w-full overflow-hidden rounded-xl bg-black aspect-video max-h-[min(78vh,640px)]";

	return (
		<div className={`${fillFrame ? "flex h-full min-h-0 flex-1 flex-col gap-3" : "space-y-3"} ${className}`}>
			<div ref={containerRef} className={viewfinderClass}>
				<div className={`absolute inset-0 ${mirror ? "scale-x-[-1]" : ""}`}>
					<video ref={videoRef} className="absolute inset-0 h-full w-full object-cover bg-black" autoPlay playsInline muted />
					<canvas ref={maskRef} className="pointer-events-none absolute inset-0 z-[1] h-full w-full" aria-hidden />
				</div>
				{captureSuccess ? (
					<div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-emerald-950/45 px-4 text-center backdrop-blur-[2px]">
						<div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/20">
							<span className="material-symbols-outlined text-4xl text-emerald-200">check_circle</span>
						</div>
						<div>
							<p className="text-base font-semibold text-white">Photo captured</p>
							<p className="text-sm text-emerald-100/90">Preparing your face for the next step</p>
						</div>
					</div>
				) : null}
				{!streamActive ? (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-container-high/80 z-10 px-4 text-center backdrop-blur-sm">
						{!hideIdleExplainer ? (
							<p className="text-sm text-on-surface-variant">Use the guided camera for automatic capture when your face is aligned.</p>
						) : null}
						<button
							type="button"
							disabled={disabled || cameraStarting}
							onClick={() => void startCamera()}
							className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary-cta text-on-primary-container font-bold text-sm shadow-primary disabled:opacity-50"
						>
							<span className="material-symbols-outlined text-lg">photo_camera</span>
							{cameraStarting ? "Starting…" : "Open camera"}
						</button>
					</div>
				) : null}
			</div>

			{statusHint === "below" ? <div className="min-h-[4.5rem] text-center text-sm">{statusLine()}</div> : null}
		</div>
	);
}
