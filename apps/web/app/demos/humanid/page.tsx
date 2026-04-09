"use client";

import { fileToBase64 } from "@humanauthn/api-client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthHydration } from "../../hooks/useAuthHydration";
import { useAuthStore } from "../../store/authStore";
import DemoCaptureOptionHeading from "../../components/demos/DemoCaptureOptionHeading";
import DemoChooseOneCallout from "../../components/demos/DemoChooseOneCallout";
import DemoOrDivider from "../../components/demos/DemoOrDivider";
import DemoUploadImageButton from "../../components/demos/DemoUploadImageButton";
import FaceGuidedCamera from "../../components/demos/FaceGuidedCameraLoader";
import DemoSignInPrompt from "../DemoSignInPrompt";

type ScanStep = "idle" | "success" | "failed";

export default function HumanIDPage() {
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();
	const [scanStep, setScanStep] = useState<ScanStep>("idle");
	const fileRef = useRef<HTMLInputElement>(null);

	const canUseDemo = hasHydrated && isAuthenticated;

	useEffect(() => {
		if (!hasHydrated || isAuthenticated) return;
		setScanStep("idle");
	}, [hasHydrated, isAuthenticated]);

	const reset = () => {
		setScanStep("idle");
	};

	const handleFile = async (files: FileList | null) => {
		if (!files?.[0]) return;
		await fileToBase64(files[0]);
		setScanStep("success");
	};

	return (
		<div className="min-h-screen bg-surface flex flex-col overflow-hidden">
			<header className="fixed top-0 w-full z-50 glass-panel-dark flex justify-between items-center px-6 py-4">
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-outline-variant hover:bg-surface-container transition-colors p-2 rounded-lg"
				>
					<span className="material-symbols-outlined">close</span>
					<span className="label-meta text-[10px]">Cancel</span>
				</button>
				<div className="flex items-center gap-2">
					<span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
						fingerprint
					</span>
					<span className="font-black tracking-wider text-primary text-lg">HumanID</span>
				</div>
				<div className="w-20" aria-hidden="true" />
			</header>

			<div className="auth-pulse fixed w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />

			<div className="fixed top-1/4 -left-12 opacity-[0.03] pointer-events-none select-none" aria-hidden="true">
				<span className="text-[12rem] font-black tracking-tighter text-on-surface">BIO</span>
			</div>

			<main className="relative flex flex-col items-center justify-center min-h-screen px-6 z-10 pt-20 pb-12">
				<section className="w-full max-w-md flex flex-col items-center">
					<div className="text-center mb-8">
						<p className="label-meta text-primary text-[0.6875rem] mb-2">HumanID · Verifik Authentication</p>
						<div className="h-px w-8 bg-primary/30 mx-auto" />
					</div>

					<div className="relative w-72 h-72 md:w-80 md:h-80 mb-8 flex items-center justify-center">
						<div className="absolute inset-0 border border-outline-variant/20 rounded-full" />
						<div
							className={`absolute -inset-1 border-2 rounded-full transition-all duration-500 ${
								scanStep === "success" ? "border-primary scanning-ring" : scanStep === "failed" ? "border-error" : "border-primary/40"
							}`}
						/>
					</div>

					<div className="text-center space-y-4 mb-8 w-full max-w-lg">
						{scanStep === "idle" && (
							<>
								<p className="text-on-surface text-lg font-medium tracking-tight">Center your face</p>
								<p className="text-outline text-sm font-light">Face detection will capture automatically when you are aligned.</p>
							</>
						)}
						{scanStep === "success" && (
							<>
								<p className="text-primary text-lg font-bold">Capture complete</p>
								<p className="text-on-surface-variant text-sm">In production this feed would call HumanID / ZelfProof APIs.</p>
							</>
						)}
						{scanStep === "failed" && (
							<>
								<p className="text-error text-lg font-bold">Something went wrong</p>
								<p className="text-on-surface-variant text-sm">Try again or use better lighting.</p>
							</>
						)}
					</div>

					{(scanStep === "idle" || scanStep === "failed") && (
						<div className="w-full space-y-4">
							{!hasHydrated ? (
								<div className="h-24 w-full rounded-lg bg-surface-container-high animate-pulse" aria-hidden />
							) : !canUseDemo ? (
								<DemoSignInPrompt />
							) : (
								<div className="space-y-5">
									<DemoChooseOneCallout description="Scan with your camera or upload a photo. Either option works for this demo." />
									<section aria-labelledby="humanid-camera-heading">
										<DemoCaptureOptionHeading
											label="A"
											id="humanid-camera-heading"
											title="Live camera"
											subtitle="Open the camera and align your face in the frame"
										/>
										<FaceGuidedCamera
											captureSuccessFeedbackMs={750}
											onError={() => setScanStep("failed")}
											onCapture={() => {
												setScanStep("success");
											}}
										/>
									</section>
									<DemoOrDivider />
									<section aria-labelledby="humanid-upload-heading">
										<DemoCaptureOptionHeading
											label="B"
											id="humanid-upload-heading"
											title="Photo from gallery"
											subtitle="Select an image file from your device instead"
										/>
										<DemoUploadImageButton
											id="btn-upload-humanid"
											onClick={() => fileRef.current?.click()}
											primaryText="Upload image"
											secondaryText="JPEG or PNG from your gallery"
										/>
									</section>
									<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleFile(e.target.files)} />
								</div>
							)}
							{canUseDemo && scanStep === "failed" && (
								<button
									type="button"
									id="btn-retry-humanid"
									onClick={reset}
									className="w-full py-3 text-sm font-semibold text-primary underline"
								>
									Try again
								</button>
							)}
						</div>
					)}

					{scanStep === "success" && (
						<button
							id="btn-continue-after-humanid"
							onClick={() => router.push("/home")}
							className="w-full py-4 bg-primary-cta text-on-primary-container font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-[0.98] transition-all mt-4"
						>
							Continue to Dashboard
						</button>
					)}
				</section>

				<aside className="absolute bottom-12 right-12 hidden lg:block">
					<div className="text-right space-y-1.5 border-r border-outline-variant/20 pr-4">
						<div className="text-[10px] text-outline/40 font-mono">ENGINE: HumanAuthn · Verifik</div>
						<div className="text-[10px] text-outline/40 font-mono">CAPTURE: Guided (@vladmandic/face-api)</div>
						<div className="text-[10px] text-outline/40 font-mono">PROTOCOL: HUMAN_ID_v1</div>
					</div>
				</aside>
			</main>
		</div>
	);
}
