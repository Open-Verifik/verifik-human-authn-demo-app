"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { decryptHumanId, fileToBase64 } from "@humanauthn/api-client";
import { useAuthHydration } from "../../hooks/useAuthHydration";
import { useAuthStore } from "../../store/authStore";
import DemoCaptureOptionHeading from "../../components/demos/DemoCaptureOptionHeading";
import DemoChooseOneCallout from "../../components/demos/DemoChooseOneCallout";
import DemoOrDivider from "../../components/demos/DemoOrDivider";
import DemoUploadImageButton from "../../components/demos/DemoUploadImageButton";
import FaceGuidedCamera from "../../components/demos/FaceGuidedCameraLoader";
import DemoSignInPrompt from "../DemoSignInPrompt";

type Step = "form" | "processing" | "result";

export default function HumanIdDecryptPage() {
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();

	const [step, setStep] = useState<Step>("form");
	const [zelfProof, setZelfProof] = useState("");
	const [password, setPassword] = useState("");
	const [facePreview, setFacePreview] = useState<string | null>(null);
	const [faceB64, setFaceB64] = useState<string | null>(null);
	const [result, setResult] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	const canUseDemo = hasHydrated && isAuthenticated;

	const handleFile = async (files: FileList | null) => {
		if (!files?.[0]) return;
		const b64 = await fileToBase64(files[0]);
		setFaceB64(b64);
		setFacePreview(URL.createObjectURL(files[0]));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const token = useAuthStore.getState().token;
		if (!token || !faceB64 || !zelfProof) return;
		setStep("processing");
		setError(null);
		const res = await decryptHumanId({ faceBase64: faceB64, os: "DESKTOP", zelfProof, password: password || undefined }, token);
		if (res.error) { setError(res.error); setStep("form"); return; }
		setResult(res.data as Record<string, unknown>);
		setStep("result");
	};

	const reset = () => { setStep("form"); setFaceB64(null); setFacePreview(null); setResult(null); setError(null); };

	return (
		<div className="min-h-screen bg-surface flex flex-col">
			<header className="fixed top-0 left-0 w-full z-50 glass-panel-dark flex items-center px-6 py-4">
				<button onClick={() => router.back()} className="hover:bg-surface-container transition-colors p-1.5 rounded-lg text-primary mr-3" aria-label="Back"><span className="material-symbols-outlined">arrow_back</span></button>
				<h1 className="font-bold tracking-tight text-lg text-primary">Decrypt HumanID</h1>
			</header>
			<main className="flex-1 mt-20 mb-10 px-4 md:px-8 max-w-2xl mx-auto w-full">
				<details className="mb-8 mt-6 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 text-left px-4 py-3 group">
					<summary className="cursor-pointer list-none font-bold text-sm text-primary flex items-center justify-between gap-2">
						<span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">menu_book</span>API reference: Decrypt HumanID</span>
						<span className="material-symbols-outlined text-outline-variant group-open:rotate-180 transition-transform">expand_more</span>
					</summary>
					<div className="mt-4 space-y-3 text-sm text-on-surface-variant border-t border-outline-variant/15 pt-4">
						<p className="font-mono text-xs text-on-surface">POST /v2/zelf-proof/decrypt</p>
						<p className="text-xs">Recover the identity data embedded in a ZelfProof by presenting the matching live face and the proof string. <code className="text-primary">faceBase64</code>, <code className="text-primary">os</code>, and <code className="text-primary">zelfProof</code> are required.</p>
					</div>
				</details>
				<div className="mb-8">
					<h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">{step === "result" ? "Decrypted" : "Decrypt HumanID"}</h2>
					<p className="text-on-surface-variant">Recover identity data by presenting the matching live face.</p>
				</div>
				{!hasHydrated ? <div className="h-60 rounded-xl bg-surface-container-high animate-pulse" /> : !canUseDemo ? <DemoSignInPrompt /> : step === "form" ? (
					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="dec-proof">ZelfProof string <span className="text-error">*</span></label>
							<textarea id="dec-proof" required rows={4} value={zelfProof} onChange={(e) => setZelfProof(e.target.value)} placeholder="Paste the ZelfProof string here…" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-outline text-xs font-mono focus:outline-none focus:border-primary/60 transition-colors resize-none" />
						</div>
						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="dec-pw">Password (optional)</label>
							<input id="dec-pw" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Only if the proof was created with a password" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-outline text-sm focus:outline-none focus:border-primary/60" />
						</div>
						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5">Face image <span className="text-error">*</span></label>
							{!faceB64 ? (
								<div className="space-y-5">
									<DemoChooseOneCallout description="Scan with your camera or upload a photo. Either option works for this step." />
									<section aria-labelledby="humanid-decrypt-camera-heading">
										<DemoCaptureOptionHeading
											label="A"
											id="humanid-decrypt-camera-heading"
											title="Live camera"
											subtitle="Open the camera and align your face in the frame"
										/>
										<FaceGuidedCamera
											disabled={step !== "form"}
											captureSuccessFeedbackMs={750}
											onCapture={({ dataUrl, base64 }) => {
												setFacePreview(dataUrl);
												setFaceB64(base64);
											}}
										/>
									</section>
									<DemoOrDivider />
									<section aria-labelledby="humanid-decrypt-upload-heading">
										<DemoCaptureOptionHeading
											label="B"
											id="humanid-decrypt-upload-heading"
											title="Photo from gallery"
											subtitle="Select an image file from your device instead"
										/>
										<DemoUploadImageButton
											id="btn-upload-humanid-decrypt"
											onClick={() => fileRef.current?.click()}
											primaryText="Upload image"
											secondaryText="JPEG or PNG from your gallery"
										/>
									</section>
								</div>
							) : null}
							{facePreview && faceB64 && <img src={facePreview} alt="Face" className="w-full aspect-video object-cover rounded-xl border border-frost mb-3" />}
							<div className="flex gap-3">
								{faceB64 ? (
									<button type="button" onClick={() => { setFaceB64(null); setFacePreview(null); }} className="text-sm text-primary underline">
										Change face image
									</button>
								) : null}
							</div>
							<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files)} />
						</div>
						{error && <div className="px-4 py-3 bg-error-container/20 border border-error/20 rounded-lg text-sm text-error">{error}</div>}
						<button type="submit" disabled={!faceB64 || !zelfProof} className="w-full py-3 bg-primary-cta text-on-primary-container font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">Decrypt</button>
					</form>
				) : step === "processing" ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<p className="text-on-surface font-semibold">Decrypting identity…</p>
					</div>
				) : (
					<div className="space-y-4">
						<div className="rounded-2xl bg-surface-container-low border border-primary/20 p-6">
							<div className="flex items-center gap-3 mb-4"><span className="material-symbols-outlined text-primary text-2xl">lock_open</span><p className="font-bold text-on-surface">HumanID decrypted</p></div>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
						</div>
						<div className="flex gap-3">
							<button onClick={reset} className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg ghost-border hover:bg-surface-container-high transition-all active:scale-95">Try Again</button>
							<button onClick={() => router.push("/home")} className="flex-1 py-3 bg-primary-cta text-on-primary-container font-semibold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all">Back to Demos</button>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
