"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	compareWithLiveness,
	DEFAULT_COMPARE_WITH_LIVENESS_LIVENESS_FLOOR,
	DEFAULT_FACE_COMPARE_MIN_SCORE,
	fileToBase64,
	parseCompareWithLivenessResult,
	type CompareWithLivenessParsed,
} from "@humanauthn/api-client";
import { useAuthHydration } from "../../hooks/useAuthHydration";
import { useAuthStore } from "../../store/authStore";
import DemoCaptureOptionHeading from "../../components/demos/DemoCaptureOptionHeading";
import DemoChooseOneCallout from "../../components/demos/DemoChooseOneCallout";
import DemoOrDivider from "../../components/demos/DemoOrDivider";
import DemoScannerShell from "../../components/demos/DemoScannerShell";
import DemoUploadImageButton from "../../components/demos/DemoUploadImageButton";
import FaceGuidedCamera from "../../components/demos/FaceGuidedCameraLoader";
import DemoSignInPrompt from "../DemoSignInPrompt";
import ElectronAwareAppHeader from "../../components/layout/ElectronAwareAppHeader";

import { Checkbox } from "@/components/ui/checkbox";

type Step = 1 | 2 | 3;
interface FaceSlot {
	preview: string | null;
	b64: string | null;
}
const emptySlot = (): FaceSlot => ({ preview: null, b64: null });
type SlotKind = "source" | "target";

export default function FaceComparisonPage() {
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();
	const [step, setStep] = useState<Step>(1);
	const [source, setSource] = useState<FaceSlot>(emptySlot());
	const [target, setTarget] = useState<FaceSlot>(emptySlot());
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<CompareWithLivenessParsed | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [livenessMinScore, setLivenessMinScore] = useState(DEFAULT_COMPARE_WITH_LIVENESS_LIVENESS_FLOOR);
	const [compareMinScore, setCompareMinScore] = useState(DEFAULT_FACE_COMPARE_MIN_SCORE);
	const [cropFace, setCropFace] = useState(false);
	const [highlightSlot, setHighlightSlot] = useState<SlotKind | null>(null);
	const sourceFileRef = useRef<HTMLInputElement>(null);
	const targetFileRef = useRef<HTMLInputElement>(null);
	const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!hasHydrated || isAuthenticated) return;
		setStep(1);
		setSource(emptySlot());
		setTarget(emptySlot());
		setResult(null);
		setError(null);
		setLivenessMinScore(DEFAULT_COMPARE_WITH_LIVENESS_LIVENESS_FLOOR);
		setCompareMinScore(DEFAULT_FACE_COMPARE_MIN_SCORE);
	}, [hasHydrated, isAuthenticated]);

	useEffect(() => {
		return () => {
			if (highlightTimeoutRef.current) {
				clearTimeout(highlightTimeoutRef.current);
			}
		};
	}, []);

	const canUseDemo = hasHydrated && isAuthenticated;

	const pulseSlot = (slot: SlotKind) => {
		if (highlightTimeoutRef.current) {
			clearTimeout(highlightTimeoutRef.current);
		}
		setHighlightSlot(slot);
		highlightTimeoutRef.current = setTimeout(() => {
			setHighlightSlot(null);
			highlightTimeoutRef.current = null;
		}, 2200);
	};

	const applyCapturedSlot = (which: SlotKind, slot: FaceSlot) => {
		pulseSlot(which);
		if (which === "source") {
			setSource(slot);
			setStep(2);
			return;
		}
		setTarget(slot);
		runComparison(source.b64!, slot.b64!);
	};

	// ── Upload helpers ────────────────────────────────────────
	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, which: SlotKind) => {
		const file = e.target.files?.[0];

		if (!file) return;

		const b64 = await fileToBase64(file);

		const preview = URL.createObjectURL(file);

		const slot: FaceSlot = { preview, b64 };
		applyCapturedSlot(which, slot);
	};

	// ── API call ─────────────────────────────────────────────
	const runComparison = async (srcB64: string, tgtB64: string) => {
		const token = useAuthStore.getState().token;

		if (!token) {
			setError("You must be signed in to run this demo.");
			return;
		}

		setStep(3);
		setIsLoading(true);
		setError(null);
		try {
			let galleryB64 = srcB64;
			if (cropFace) {
				try {
					const { cropLargestFaceBase64 } = await import("@/lib/faceCrop");
					galleryB64 = await cropLargestFaceBase64(srcB64);
				} catch (cropErr) {
					const raw = cropErr instanceof Error ? cropErr.message : "";
					const friendly =
						raw === "No faces found in the image"
							? "We couldn’t detect a face to crop in your Source photo (step 1). Try a clearer picture, or turn off Source face crop and try again."
							: raw || "We couldn’t crop your Source photo. Try another image, or turn off Source face crop.";
					setError(friendly);
					setStep(2);
					return;
				}
			}

			const res = await compareWithLiveness(
				{
					gallery: [galleryB64],
					probe: tgtB64,
					liveness_min_score: livenessMinScore,
					compare_min_score: compareMinScore,
				},
				token,
			);

			if (res.error) {
				setError(res.error);
				return;
			}

			setResult(parseCompareWithLivenessResult(res.data));
		} finally {
			setIsLoading(false);
		}
	};

	const reset = () => {
		if (highlightTimeoutRef.current) {
			clearTimeout(highlightTimeoutRef.current);
			highlightTimeoutRef.current = null;
		}
		setStep(1);
		setSource(emptySlot());
		setTarget(emptySlot());
		setResult(null);
		setError(null);
		setHighlightSlot(null);
		setLivenessMinScore(DEFAULT_COMPARE_WITH_LIVENESS_LIVENESS_FLOOR);
		setCompareMinScore(DEFAULT_FACE_COMPARE_MIN_SCORE);
	};

	const steps = [
		{ label: "Source", sub: "Reference only" },
		{ label: "Target", sub: "Liveness here" },
		{ label: "Analyze", sub: null },
	] as const;
	const currentSlot = step === 1 ? "source" : "target";

	const verified = (r: CompareWithLivenessParsed) =>
		r.match && !r.livenessSkipped && r.livenessPassed;

	// ── Render ────────────────────────────────────────────────
	return (
		<div className="min-h-screen bg-surface flex flex-col">
			{/* Top bar */}
			<ElectronAwareAppHeader className="justify-between">
				<div className="flex items-center gap-3">
					<button
						onClick={() => router.back()}
						className="hover:bg-surface-container transition-colors p-1.5 rounded-lg text-primary"
						aria-label="Back"
					>
						<span className="material-symbols-outlined">arrow_back</span>
					</button>
					<h1 className="font-bold tracking-tight text-lg text-primary">Compare with liveness</h1>
				</div>
				<span className="label-meta text-primary text-[0.6875rem]">Step {step} of 3</span>
			</ElectronAwareAppHeader>

			<main className="flex-1 pt-24 pb-32 px-6 max-w-4xl mx-auto w-full">
				{/* Progress stepper */}
				<div className="flex items-center justify-center mb-12 gap-2 animate-fade-in">
					{steps.map((s, i) => {
						const n = i + 1;
						const isActive = step === n;
						const isDone = step > n;
						return (
							<div key={`${s.label}-${i}`} className="flex items-center">
								<div className="flex flex-col items-center max-w-[5.5rem]">
									<div
										className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all
                    ${
						isDone
							? "bg-primary text-on-primary"
							: isActive
								? "bg-primary-container text-on-primary-container ring-4 ring-primary-container/20"
								: "bg-surface-container-high border border-outline-variant text-on-surface-variant/50"
					}`}
									>
										{isDone ? <span className="material-symbols-outlined text-sm">check</span> : n}
									</div>
									<span
										className={`text-[0.6875rem] font-bold uppercase tracking-wider mt-2 text-center leading-tight ${isActive ? "text-primary" : "text-on-surface-variant/50"}`}
									>
										{s.label}
									</span>
									{s.sub != null && (
										<span
											className={`text-[0.5625rem] font-semibold normal-case tracking-normal mt-0.5 text-center leading-snug ${isActive ? "text-primary/90" : "text-on-surface-variant/65"}`}
										>
											{s.sub}
										</span>
									)}
								</div>
								{i < 2 && <div className={`w-12 h-0.5 mx-2 mb-5 ${step > n ? "bg-primary" : "bg-outline-variant/30"}`} />}
							</div>
						);
					})}
				</div>

				{/* Headline */}
				<div className="text-center mb-10">
					<h2 className="text-4xl md:text-5xl font-black tracking-editorial text-on-surface mb-2">
						{step === 1
							? "Source · Reference only"
							: step === 2
								? "Target · Liveness here"
								: "Analysis"}
					</h2>
					{step === 1 ? (
						<div className="mx-auto mt-4 max-w-xl space-y-3 px-3 text-pretty">
							<p className="text-sm leading-relaxed text-on-surface-variant">
								<span className="font-semibold text-on-surface">Source</span> is sent as{" "}
								<code className="rounded-md bg-surface-container-high px-1.5 py-0.5 text-[0.8125rem] font-mono text-primary">
									gallery
								</code>{" "}
								for face comparison.
							</p>
							<div className="border-t border-outline-variant/25 pt-3">
								<p className="text-sm leading-relaxed text-on-surface-variant">
									<span className="font-semibold text-on-surface">Liveness</span> does not use Source. It runs on{" "}
									<span className="font-semibold text-on-surface">Target</span> in the next step.
								</p>
							</div>
						</div>
					) : step === 2 ? (
						<div className="mx-auto mt-4 max-w-xl space-y-3 px-3 text-pretty">
							<p className="text-sm leading-relaxed text-on-surface-variant">
								This <span className="font-semibold text-on-surface">Target</span> image is the{" "}
								<code className="rounded-md bg-surface-container-high px-1.5 py-0.5 text-[0.8125rem] font-mono text-primary">
									probe
								</code>
								.
							</p>
							<div className="border-t border-outline-variant/25 pt-3">
								<p className="text-sm leading-relaxed text-on-surface-variant">
									If compare passes your threshold, <span className="font-semibold text-on-surface">liveness</span> runs on this
									image only. <span className="font-semibold text-on-surface">Source</span> is not used for liveness.
								</p>
							</div>
						</div>
					) : (
						<p className="mt-4 text-on-surface-variant text-sm leading-relaxed">
							{isLoading
								? "Running compare-with-liveness (sequential) via Verifik API…"
								: result
									? "Result from HumanAuthn."
									: "Processing…"}
						</p>
					)}
				</div>

				{/* ── Steps 1 & 2: Capture/Upload ─────────────────── */}
				{(step === 1 || step === 2) && (
					<div className="animate-fade-in">
						{/* Face preview thumbnails */}
						{(source.preview || target.preview) && (
							<div className="mb-8 flex justify-center gap-4">
								{[
									{ slot: source, label: "Source", key: "source" as const },
									{ slot: target, label: "Target", key: "target" as const },
								].map(({ slot, label, key }) => {
									const isHighlighted = highlightSlot === key;
									return (
										<div key={label} className="flex flex-col items-center gap-2">
											<div
												className={`relative h-16 w-16 overflow-hidden rounded-full bg-surface-container-high ghost-border transition-all duration-300 ${
													isHighlighted ? "scale-105 ring-4 ring-emerald-400/35 shadow-[0_0_0_6px_rgba(74,222,128,0.12)]" : ""
												}`}
											>
												{slot.preview ? (
													<img src={slot.preview} alt={label} className="h-full w-full object-cover" />
												) : (
													<div className="flex h-full w-full items-center justify-center">
														<span className="material-symbols-outlined text-on-surface-variant/55">face</span>
													</div>
												)}
												{isHighlighted ? (
													<div className="absolute inset-x-0 bottom-0 flex justify-center pb-0.5">
														<span className="material-symbols-outlined rounded-full bg-emerald-500 text-[16px] text-white shadow-md">
															check_circle
														</span>
													</div>
												) : null}
											</div>
											<span className={`label-meta text-[10px] ${isHighlighted ? "text-emerald-300" : "text-on-surface-variant"}`}>{label}</span>
										</div>
									);
								})}
							</div>
						)}

						<div className="mx-auto w-full max-w-4xl space-y-5">
							{canUseDemo ? <DemoChooseOneCallout description="Scan with your camera or upload a photo. Either option works for this step." /> : null}
							<section aria-labelledby={canUseDemo ? `capture-camera-heading-${currentSlot}` : undefined}>
								{canUseDemo ? (
									<DemoCaptureOptionHeading
										label="A"
										id={`capture-camera-heading-${currentSlot}`}
										title="Live camera"
										subtitle={step === 1 ? "Capture the source image first" : "Capture the target image with liveness"}
									/>
								) : null}
								<DemoScannerShell>
									{!hasHydrated ? (
										<div className="h-40 w-full rounded-lg bg-surface-container-high animate-pulse" aria-hidden />
									) : !canUseDemo ? (
										<DemoSignInPrompt />
									) : (
										<div className="flex min-h-0 flex-1 flex-col">
											<FaceGuidedCamera
												key={step}
												fillFrame
												hideIdleExplainer
												disabled={isLoading}
												captureSuccessFeedbackMs={750}
												onError={(msg) => setError(msg)}
												onCapture={({ dataUrl, base64 }) => {
													const slot: FaceSlot = { preview: dataUrl, b64: base64 };
													applyCapturedSlot(step === 1 ? "source" : "target", slot);
												}}
											/>
										</div>
									)}
								</DemoScannerShell>
							</section>

							{canUseDemo ? (
								<>
									<DemoOrDivider />
									<section aria-labelledby={`capture-upload-heading-${currentSlot}`}>
										<DemoCaptureOptionHeading
											label="B"
											id={`capture-upload-heading-${currentSlot}`}
											title="Photo from gallery"
											subtitle="Select an image file from your device instead"
										/>
										<DemoUploadImageButton
											id={`btn-upload-${currentSlot}`}
											onClick={() => (step === 1 ? sourceFileRef.current?.click() : targetFileRef.current?.click())}
											primaryText="Upload image"
											secondaryText="JPEG or PNG from your gallery"
										/>
									</section>
								</>
							) : null}
						</div>
						{canUseDemo && (
							<>
								<input
									ref={sourceFileRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={(e) => handleUpload(e, "source")}
								/>
								<input
									ref={targetFileRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={(e) => handleUpload(e, "target")}
								/>
							</>
						)}
						{canUseDemo && (step === 1 || step === 2) && (
							<div className="mt-6 max-w-md mx-auto w-full space-y-5">
								<div>
									<label
										htmlFor="compare-min-score"
										className="block text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant mb-2"
									>
										Compare minimum score
									</label>
									<div className="flex items-center gap-4">
										<input
											id="compare-min-score"
											type="range"
											min={0.67}
											max={0.95}
											step={0.01}
											value={compareMinScore}
											onChange={(e) => setCompareMinScore(Number(e.target.value))}
											className="flex-1 accent-primary h-2"
										/>
										<span className="text-sm font-mono text-primary w-14 shrink-0 tabular-nums">
											{compareMinScore.toFixed(2)}
										</span>
									</div>
								</div>
								<div>
									<label
										htmlFor="liveness-min-score"
										className="block text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant mb-2"
									>
										Liveness minimum score (Target image)
									</label>
									<div className="flex items-center gap-4">
										<input
											id="liveness-min-score"
											type="range"
											min={0.52}
											max={1}
											step={0.01}
											value={livenessMinScore}
											onChange={(e) => setLivenessMinScore(Number(e.target.value))}
											className="flex-1 accent-primary h-2"
										/>
										<span className="text-sm font-mono text-primary w-14 shrink-0 tabular-nums">
											{livenessMinScore.toFixed(2)}
										</span>
									</div>
								</div>
								<label
									htmlFor="crop-gallery-face"
									className="flex items-start gap-3 cursor-pointer text-sm text-on-surface-variant"
								>
									<Checkbox
										id="crop-gallery-face"
										checked={cropFace}
										onCheckedChange={(v) => setCropFace(v === true)}
										className="mt-0.5"
									/>
									<span className="space-y-1">
										<span className="block text-on-surface font-medium leading-snug">
											Crop my Source photo to the detected face
										</span>
										<span className="block text-xs text-on-surface-variant leading-relaxed">
											When on, we detect the largest face in your first image (Source, step 1) and replace it with a cropped
											region around that face before we send it as <code className="text-primary">gallery</code>. Your second
											image (Target, step 2) is sent as you captured it, with no crop in this demo. Use this for group shots,
											ID scans, or busy frames where the face is small or off center.
										</span>
									</span>
								</label>
							</div>
						)}

						<details className="mt-10 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 text-left max-w-3xl mx-auto w-full px-4 py-3 group">
							<summary className="cursor-pointer list-none font-bold text-sm text-primary flex items-center justify-between gap-2">
								<span className="flex items-center gap-2">
									<span className="material-symbols-outlined text-lg">menu_book</span>
									API reference: Compare with liveness
								</span>
								<span className="material-symbols-outlined text-on-surface-variant/70 group-open:rotate-180 transition-transform">
									expand_more
								</span>
							</summary>
							<div className="mt-4 space-y-4 text-sm text-on-surface-variant border-t border-outline-variant/15 pt-4">
								<p>
									Official docs:{" "}
									<a
										href="https://docs.verifik.co/biometrics/compare-with-liveness/"
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary underline underline-offset-2"
									>
										docs.verifik.co/biometrics/compare-with-liveness
									</a>
								</p>
								<div>
									<p className="font-mono text-xs text-on-surface mb-1">POST /v2/face-recognition/compare-with-liveness</p>
									<p className="text-xs leading-relaxed">
										Compare first; if the face score meets <code className="text-primary">compare_min_score</code> (or it is
										omitted), liveness runs on the <code className="text-primary">probe</code> image against{" "}
										<code className="text-primary">liveness_min_score</code>.
									</p>
								</div>
								<div className="overflow-x-auto">
									<table className="w-full text-xs border-collapse">
										<thead>
											<tr className="border-b border-outline-variant/20">
												<th className="text-left py-2 pr-2 font-semibold text-on-surface">Header</th>
												<th className="text-left py-2 font-semibold text-on-surface">Value</th>
											</tr>
										</thead>
										<tbody>
											<tr className="border-b border-outline-variant/10">
												<td className="py-2 pr-2 font-mono">Content-Type</td>
												<td className="font-mono">application/json</td>
											</tr>
											<tr>
												<td className="py-2 pr-2 font-mono">Authorization</td>
												<td className="font-mono">Bearer &lt;token&gt;</td>
											</tr>
										</tbody>
									</table>
								</div>
								<p className="text-xs text-on-surface-variant">
									In this demo, <strong className="text-on-surface">Source</strong> is the <code className="text-primary">gallery</code>{" "}
									image (step 1). <strong className="text-on-surface">Target</strong> is the <code className="text-primary">probe</code>{" "}
									(step 2). You can optionally detect the largest face in the Source and crop the image to that region in the browser
									before sending. The Target image is not cropped here. Server integrations may also support cropping via{" "}
									<code className="text-primary">cropFace</code>.
								</p>
								<div className="overflow-x-auto">
									<table className="w-full text-xs border-collapse">
										<thead>
											<tr className="border-b border-outline-variant/20">
												<th className="text-left py-2 pr-1">Param</th>
												<th className="text-left py-2 pr-1">Type</th>
												<th className="text-left py-2 pr-1">Req</th>
												<th className="text-left py-2">Description</th>
											</tr>
										</thead>
										<tbody className="text-on-surface-variant">
											<tr className="border-b border-outline-variant/10 align-top">
												<td className="py-2 font-mono text-primary">probe</td>
												<td>string</td>
												<td>Yes</td>
												<td>Base64 live capture</td>
											</tr>
											<tr className="border-b border-outline-variant/10 align-top">
												<td className="py-2 font-mono text-primary">gallery</td>
												<td>string[]</td>
												<td>Yes</td>
												<td>Reference images (base64; https URLs supported server-side)</td>
											</tr>
											<tr className="border-b border-outline-variant/10 align-top">
												<td className="py-2 font-mono text-primary">liveness_min_score</td>
												<td>number</td>
												<td>No</td>
												<td>Default 0.6 if omitted</td>
											</tr>
											<tr className="align-top">
												<td className="py-2 font-mono text-primary">compare_min_score</td>
												<td>number</td>
												<td>No</td>
												<td>0.67 to 0.95, optional threshold</td>
											</tr>
										</tbody>
									</table>
								</div>
								<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface">
									{`// 200 OK, example response shape\n{\n  "data": {\n    "comparison": { "score": 0.88 },\n    "liveness": {\n      "liveness_score": 0.91,\n      "min_score": 0.6,\n      "passed": true\n    }\n  }\n}`}
								</pre>
								<ul className="list-disc pl-5 space-y-1 text-xs">
									<li>Comparison runs first; liveness on probe only if compare passes your threshold (or threshold omitted).</li>
									<li>
										<code className="text-primary">liveness_min_score</code> defaults to 0.6 when not sent.
									</li>
									<li>Gallery may use https URLs; the service fetches and converts them.</li>
								</ul>
							</div>
						</details>
					</div>
				)}

				{/* ── Step 3: Result ───────────────────────────────── */}
				{step === 3 && (
					<div className="max-w-lg mx-auto animate-slide-up">
						{/* Face previews */}
						<div className="flex items-center gap-4 mb-8 justify-center">
							{[source.preview, target.preview].map((preview, i) => (
								<div key={i} className="flex flex-col items-center gap-2">
									<div className="w-24 h-24 rounded-full overflow-hidden bg-surface-container-high ghost-border">
										{preview && <img src={preview} alt="" className="w-full h-full object-cover" />}
									</div>
									<span className="label-meta text-[10px] text-on-surface-variant">{i === 0 ? "Source" : "Target"}</span>
								</div>
							))}
							{!isLoading && result && (
								<div
									className={`w-10 h-10 rounded-full flex items-center justify-center ${verified(result) ? "bg-primary/20" : "bg-error/20"}`}
								>
									<span
										className={`material-symbols-outlined text-xl ${verified(result) ? "text-primary" : "text-error"}`}
										style={{ fontVariationSettings: "'FILL' 1" }}
									>
										{verified(result) ? "verified" : "gpp_maybe"}
									</span>
								</div>
							)}
						</div>

						{isLoading ? (
							<div className="text-center py-12">
								<div className="w-16 h-16 rounded-full border-2 border-primary/40 border-t-primary animate-spin mx-auto mb-4" />
								<p className="text-on-surface-variant">Analyzing with Verifik…</p>
							</div>
						) : result ? (
							<div
								className={`rounded-2xl p-8 text-center ${verified(result) ? "bg-surface-container-low border border-primary/20" : "bg-error-container/10 border border-error/20"}`}
							>
								<div
									className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${verified(result) ? "bg-primary/10" : "bg-error/10"}`}
								>
									<span
										className={`material-symbols-outlined text-4xl ${verified(result) ? "text-primary" : "text-error"}`}
										style={{ fontVariationSettings: "'FILL' 1" }}
									>
										{verified(result)
											? "verified_user"
											: !result.match
												? "person_off"
												: result.livenessSkipped
													? "skip_next"
													: "shield_locked"}
									</span>
								</div>
								<h2 className="text-3xl font-black tracking-tight mb-2">
									{verified(result)
										? "Verified"
										: !result.match
											? "Face mismatch"
											: result.livenessSkipped
												? "Liveness not run"
												: "Liveness below minimum"}
								</h2>
								<p className="text-on-surface-variant mb-6 text-sm leading-relaxed">
									{result.message ||
										(verified(result)
											? "Compare passed your threshold and probe liveness passed."
											: !result.match && result.livenessSkipped
												? "Face similarity is below compare_min_score, so liveness was not executed."
												: !result.match
													? "Face similarity is below the compare threshold."
													: result.livenessSkipped
														? "Liveness step was skipped."
														: "Probe liveness score is below the configured minimum.")}
								</p>
								<div className="grid grid-cols-2 gap-4 mb-6">
									<div className="bg-surface-container rounded-lg p-4">
										<p className="text-2xl font-black text-primary">{(result.score * 100).toFixed(1)}%</p>
										<p className="label-meta text-on-surface-variant text-[10px] mt-1">
											Similarity (min {compareMinScore.toFixed(2)})
										</p>
										<p className="text-[10px] font-mono mt-1 text-on-surface-variant">
											{result.match ? "PASS" : "FAIL"}
										</p>
									</div>
									<div className="bg-surface-container rounded-lg p-4">
										<p className="text-2xl font-black text-on-surface">
											{result.livenessSkipped
												? "N/A"
												: result.livenessScore != null
													? `${(result.livenessScore * 100).toFixed(1)}%`
													: "N/A"}
										</p>
										<p className="label-meta text-on-surface-variant text-[10px] mt-1">
											Liveness (min {result.livenessMinScore.toFixed(2)})
										</p>
										<p
											className={`text-[10px] font-mono mt-1 ${result.livenessSkipped ? "text-on-surface-variant/80" : result.livenessPassed ? "text-primary" : "text-error"}`}
										>
											{result.livenessSkipped ? "SKIPPED" : result.livenessScore != null ? (result.livenessPassed ? "PASS" : "FAIL") : "N/A"}
										</p>
									</div>
								</div>
								<div className="flex gap-3">
									<button
										onClick={reset}
										id="btn-retry-comparison"
										className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg hover:bg-surface-container-high ghost-border active:scale-95 transition-all"
									>
										Try Again
									</button>
									<button
										onClick={() => router.push("/home")}
										id="btn-back-to-home"
										className="flex-1 py-3 bg-primary-cta text-on-primary-container font-semibold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all"
									>
										Back to Demos
									</button>
								</div>
							</div>
						) : error ? (
							<div className="px-4 py-3 bg-error-container/20 border border-error/20 rounded-lg flex items-center gap-3">
								<span className="material-symbols-outlined text-error text-sm">error_outline</span>
								<span className="text-sm text-on-error-container">{error}</span>
							</div>
						) : null}
					</div>
				)}

				{/* Desktop decorative meta */}
				<div className="fixed top-1/2 right-10 hidden lg:block transform -translate-y-1/2 rotate-90 origin-right">
					<span className="label-meta text-[0.625rem] text-on-surface-variant/45">Verifik · Secure Session Active</span>
				</div>
				<div className="fixed bottom-24 left-8 hidden lg:block">
					<div className="space-y-3">
						<div className="h-10 w-px bg-outline-variant/20 ml-2" />
						<p className="text-[0.625rem] font-mono text-primary/40 leading-tight">
							ENGINE: HumanAuthn
							<br />
							PROTO: CWL_SEQ
							<br />
							AUTH: PENDING
						</p>
					</div>
				</div>
			</main>

			{/* Mobile bottom nav */}
			<nav className="fixed bottom-0 left-0 w-full z-50 glass-panel-dark backdrop-blur-xl flex justify-around items-center py-3 px-8 border-t border-outline-variant/10 md:hidden">
				<div className="flex flex-col items-center gap-1 cursor-pointer text-on-surface-variant/80 hover:text-primary transition-colors p-2">
					<span className="material-symbols-outlined">help_outline</span>
					<span className="text-[0.625rem]">Support</span>
				</div>
				<button
					onClick={() => router.back()}
					className="flex flex-col items-center gap-1 cursor-pointer bg-surface-container text-primary rounded-full p-3 transition-all active:scale-95"
				>
					<span className="material-symbols-outlined">close</span>
				</button>
			</nav>
		</div>
	);
}
