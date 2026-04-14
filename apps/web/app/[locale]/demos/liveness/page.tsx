"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
	DEFAULT_LIVENESS_STANDALONE_MIN_SCORE,
	detectLiveness,
	fileToBase64,
	imageUrlToRawBase64,
	parseLivenessResult,
} from "@humanauthn/api-client";
import { useAuthHydration } from "../../../hooks/useAuthHydration";
import { useAuthStore } from "../../../store/authStore";
import DemoCaptureOptionHeading from "../../../components/demos/DemoCaptureOptionHeading";
import DemoChooseOneCallout from "../../../components/demos/DemoChooseOneCallout";
import DemoOrDivider from "../../../components/demos/DemoOrDivider";
import DemoScannerShell from "../../../components/demos/DemoScannerShell";
import DemoUploadImageButton from "../../../components/demos/DemoUploadImageButton";
import FaceGuidedCamera from "../../../components/demos/FaceGuidedCameraLoader";
import DemoSignInPrompt from "../DemoSignInPrompt";
import ElectronAwareAppHeader from "../../../components/layout/ElectronAwareAppHeader";

type Step = "capture" | "processing" | "result";
type NumericStep = 1 | 2;

const LIVENESS_SAMPLE_IMAGES = [
	"/assets/ppic1.jpg",
	"/assets/ppic2.jpg",
	"/assets/ppic3.jpg",
	"/assets/ppic4.jpg",
	"/assets/ppic5.jpg",
	"/assets/ppic6.jpg",
] as const;

/** confidence: 0–1 liveness score for display; message optional from API */
type LivenessResult = { isLive: boolean; confidence: number; message: string } | null;

export default function LivenessPage() {
	const t = useTranslations("demos.liveness");
	const tCommon = useTranslations("demos.common");
	const livenessStepper = useMemo(() => [{ label: t("stepCapture") }, { label: t("stepResult") }], [t]);
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();
	const [step, setStep] = useState<Step>("capture");
	const [result, setResult] = useState<LivenessResult>(null);
	const [error, setError] = useState<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const canUseDemo = hasHydrated && isAuthenticated;

	useEffect(() => {
		if (!hasHydrated || isAuthenticated) return;
		setStep("capture");
		setResult(null);
		setError(null);
		setPreviewUrl(null);
	}, [hasHydrated, isAuthenticated]);

	// ── Upload ────────────────────────────────────────────────
	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const b64 = await fileToBase64(file);
		setPreviewUrl(URL.createObjectURL(file));
		runLiveness(b64);
	};

	const runSampleImage = async (src: string) => {
		if (!canUseDemo) return;
		try {
			const b64 = await imageUrlToRawBase64(src);
			setPreviewUrl(src);
			runLiveness(b64);
		} catch {
			setError(t("sampleLoadError"));
		}
	};

	// ── API Call ──────────────────────────────────────────────
	const runLiveness = async (base64Image: string) => {
		const token = useAuthStore.getState().token;

		if (!token) {
			setError(tCommon("mustBeSignedIn"));
			return;
		}

		setStep("processing");

		setError(null);
		
		const res = await detectLiveness({ os: "DESKTOP", image: base64Image }, token);

		if (res.error) {
			setError(res.error);
			setStep("capture");
			return;
		}

		const parsed = parseLivenessResult(res.data);
		const score01 = parsed.livenessScore ?? 0;

		setResult({
			isLive: parsed.passed,
			confidence: score01,
			message: parsed.message || (parsed.passed ? t("defaultPass") : t("defaultFail")),
		});
        
		setStep("result");
	};

	const reset = () => {
		setStep("capture");
		setResult(null);
		setError(null);
		setPreviewUrl(null);
	};

	const numericStep: NumericStep = step === "capture" ? 1 : 2;

	// ── Render ────────────────────────────────────────────────
	return (
		<div className="min-h-screen bg-surface flex flex-col">
			{/* Top bar */}
			<ElectronAwareAppHeader>
				<div className="flex items-center gap-3">
					<button
						onClick={() => router.back()}
						className="hover:bg-surface-container transition-colors p-1.5 rounded-lg text-primary"
						aria-label={tCommon("backAria")}
					>
						<span className="material-symbols-outlined">arrow_back</span>
					</button>
					<h1 className="font-bold tracking-tight text-lg text-primary">{t("headerTitle")}</h1>
				</div>
			</ElectronAwareAppHeader>

			<main className="flex-1 mt-20 mb-10 px-4 md:px-8 max-w-5xl mx-auto w-full">
				{/* Progress stepper (matches face-comparison demos) */}
				<div className="flex items-center justify-center mb-10 pt-4 gap-2 animate-fade-in">
					{livenessStepper.map((s, i) => {
						const n = i + 1;
						const isActive = numericStep === n;
						const isDone = numericStep > n;
						return (
							<div key={s.label} className="flex items-center">
								<div className="flex flex-col items-center">
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
										className={`text-[0.6875rem] font-bold uppercase tracking-wider mt-2 ${isActive ? "text-primary" : "text-on-surface-variant/50"}`}
									>
										{s.label}
									</span>
								</div>
								{i < 1 && (
									<div className={`w-12 h-0.5 mx-2 mb-5 ${numericStep > n ? "bg-primary" : "bg-outline-variant/30"}`} />
								)}
							</div>
						);
					})}
				</div>

				<details className="mb-8 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 text-left max-w-3xl mx-auto w-full px-4 py-3 group">
					<summary className="cursor-pointer list-none font-bold text-sm text-primary flex items-center justify-between gap-2">
						<span className="flex items-center gap-2">
							<span className="material-symbols-outlined text-lg">menu_book</span>
							{t("apiRefSummary")}
						</span>
						<span className="material-symbols-outlined text-on-surface-variant/70 group-open:rotate-180 transition-transform">
							expand_more
						</span>
					</summary>
					<div className="mt-4 space-y-4 text-sm text-on-surface-variant border-t border-outline-variant/15 pt-4">
						<p>
							{tCommon("officialDocsLead")}{" "}
							<a
								href="https://docs.verifik.co/biometrics/liveness/"
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary underline underline-offset-2"
							>
								docs.verifik.co/biometrics/liveness
							</a>
						</p>
						<p className="text-xs leading-relaxed">
							{t("apiRefBody", { defaultMin: String(DEFAULT_LIVENESS_STANDALONE_MIN_SCORE) })}
						</p>
						<div>
							<p className="font-mono text-xs text-on-surface mb-1">POST /v2/face-recognition/liveness</p>
							<p className="text-xs leading-relaxed">{t("apiRefEndpointDesc")}</p>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full text-xs border-collapse">
								<thead>
									<tr className="border-b border-outline-variant/20">
										<th className="text-left py-2 pr-2 font-semibold text-on-surface">{tCommon("tableHeader")}</th>
										<th className="text-left py-2 font-semibold text-on-surface">{tCommon("tableValue")}</th>
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
						<div className="overflow-x-auto">
							<table className="w-full text-xs border-collapse">
								<thead>
									<tr className="border-b border-outline-variant/20">
										<th className="text-left py-2 pr-1">{tCommon("tableParam")}</th>
										<th className="text-left py-2 pr-1">{t("tableType")}</th>
										<th className="text-left py-2 pr-1">{tCommon("tableReq")}</th>
										<th className="text-left py-2">{tCommon("tableDescription")}</th>
									</tr>
								</thead>
								<tbody className="text-on-surface-variant">
									<tr className="border-b border-outline-variant/10 align-top">
										<td className="py-2 font-mono text-primary">os</td>
										<td>string</td>
										<td>{tCommon("yes")}</td>
										<td>{t("paramOsDesc")}</td>
									</tr>
									<tr className="border-b border-outline-variant/10 align-top">
										<td className="py-2 font-mono text-primary">image</td>
										<td>string</td>
										<td>{tCommon("yes")}</td>
										<td>{t("paramImageDesc")}</td>
									</tr>
									<tr className="border-b border-outline-variant/10 align-top">
										<td className="py-2 font-mono text-primary">collection_id</td>
										<td>string</td>
										<td>{tCommon("no")}</td>
										<td>{t("paramCollectionDesc")}</td>
									</tr>
									<tr className="align-top">
										<td className="py-2 font-mono text-primary">liveness_min_score</td>
										<td>number</td>
										<td>{tCommon("no")}</td>
										<td>{t("paramLivenessMinDesc", { defaultMin: String(DEFAULT_LIVENESS_STANDALONE_MIN_SCORE) })}</td>
									</tr>
								</tbody>
							</table>
						</div>
						<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
							{`await fetch("https://api.verifik.co/v2/face-recognition/liveness", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({
    os: "DESKTOP",
    image: "<base64>",
    liveness_min_score: ${DEFAULT_LIVENESS_STANDALONE_MIN_SCORE},
  }),
});`}
						</pre>
						<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface">
							{`// 200 OK, example shape
{
  "id": "…",
  "data": {
    "passed": true,
    "min_score": 0.6,
    "liveness_score": 0.98
  },
  "signature": {
    "message": "Certified by Verifik.co",
    "dateTime": "…"
  }
}`}
						</pre>
						<ul className="list-disc pl-5 space-y-1 text-xs">
							<li>{t("bulletSignature")}</li>
							<li>{t("bulletOs")}</li>
						</ul>
					</div>
				</details>

				{/* Headline */}
				<div className="mb-10">
					<h2 className="text-4xl md:text-5xl font-black tracking-editorial text-on-surface mb-2">
						{step === "result" ? t("heroAnalysisComplete") : t("heroLivenessDefault")}
					</h2>
					<p className="text-on-surface-variant font-medium">
						{step === "capture" && t("heroCapture")}
						{step === "processing" && t("heroProcessing")}
						{step === "result" && t("heroResultComplete")}
					</p>
				</div>

				{/* ── CAPTURE step ──────────────────────────────────── */}
				{step === "capture" && (
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
						{/* Camera / viewfinder */}
						<div className="lg:col-span-7 bg-surface-container-low rounded-xl p-6 relative overflow-hidden">
							{/* Blueprint texture */}
							<div className="absolute inset-0 opacity-[0.025] blueprint-grid pointer-events-none" aria-hidden="true" />

							{canUseDemo ? <DemoChooseOneCallout className="relative z-10 mb-4" description={t("chooseOneDescription")} /> : null}

							<section aria-labelledby="liveness-camera-heading" className="relative z-10">
								{canUseDemo ? (
									<DemoCaptureOptionHeading
										label="A"
										id="liveness-camera-heading"
										title={t("cameraTitle")}
										subtitle={t("cameraSubtitle")}
									/>
								) : null}
								<DemoScannerShell className="min-h-[360px] h-[min(70vh,620px)]" innerClassName="justify-center">
									{!hasHydrated ? (
										<div className="h-48 rounded-lg bg-surface-container-high animate-pulse" aria-hidden />
									) : !canUseDemo ? (
										<DemoSignInPrompt />
									) : (
										<FaceGuidedCamera
											fillFrame
											disabled={step !== "capture"}
											captureSuccessFeedbackMs={750}
											onError={(msg) => setError(msg)}
											onCapture={({ dataUrl, base64 }) => {
												setPreviewUrl(dataUrl);
												runLiveness(base64);
											}}
										/>
									)}
								</DemoScannerShell>
							</section>

							{/* Action buttons / auth gate */}
							<div className="mt-6 grid grid-cols-1 gap-3">
								{!hasHydrated ? (
									<div className="h-24 rounded-lg bg-surface-container-high animate-pulse" aria-hidden />
								) : !canUseDemo ? null : (
									<>
										<DemoOrDivider />
										<section aria-labelledby="liveness-upload-heading">
											<DemoCaptureOptionHeading
												label="B"
												id="liveness-upload-heading"
												title={t("uploadTitle")}
												subtitle={t("uploadSubtitle")}
											/>
											<DemoUploadImageButton
												id="btn-upload-image"
												onClick={() => fileInputRef.current?.click()}
												primaryText={t("uploadPrimary")}
												secondaryText={t("uploadSecondary")}
											/>
										</section>
									</>
								)}
							</div>
							{canUseDemo && <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />}
						</div>

						{/* Right: samples */}
						<div className="lg:col-span-5 space-y-6">
							<div className="bg-surface-container rounded-xl p-5">
								<h3 className="text-sm font-bold tracking-widest text-on-surface-variant uppercase mb-2 flex items-center gap-2">
									<span className="w-1.5 h-1.5 bg-primary rounded-full" /> {t("samplesTitle")}
								</h3>
								<p className="text-xs text-on-surface-variant mb-4">{t("samplesDescription")}</p>
								<div className="grid grid-cols-3 gap-2">
									{LIVENESS_SAMPLE_IMAGES.map((src, i) => (
										<button
											key={src}
											type="button"
											disabled={!canUseDemo}
											onClick={() => void runSampleImage(src)}
											aria-label={t("samplePortraitAria", { n: i + 1 })}
											className={`aspect-square rounded-lg overflow-hidden border transition-all text-left p-0
												${
													canUseDemo
														? "cursor-pointer border-transparent hover:border-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
														: "cursor-not-allowed opacity-50 border-outline-variant/20"
												}`}
										>
											<img src={src} alt="" className="w-full h-full object-cover" />
										</button>
									))}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* ── PROCESSING step ───────────────────────────────── */}
				{step === "processing" && (
					<div className="flex flex-col items-center justify-center py-24 animate-fade-in">
						<div className="relative mb-8">
							<div className="auth-pulse w-40 h-40 absolute inset-0" />
							<div className="relative w-32 h-32 rounded-full bg-surface-container-high flex items-center justify-center ghost-border">
								{previewUrl && (
									<img src={previewUrl} alt={t("previewAlt")} className="w-full h-full object-cover rounded-full grayscale opacity-70" />
								)}
							</div>
							<div className="absolute -inset-3 border-2 border-primary/40 rounded-full animate-pulse-slow scanning-ring" />
						</div>
						<p className="text-lg font-semibold text-on-surface mb-2">{t("analyzingTitle")}</p>
						<p className="text-on-surface-variant text-sm font-mono">{t("engineLine")}</p>
					</div>
				)}

				{/* ── RESULT step ───────────────────────────────────── */}
				{step === "result" && result && (
					<div className="max-w-lg mx-auto animate-slide-up">
						<div
							className={`rounded-2xl p-8 text-center ${result.isLive ? "bg-surface-container-low border border-primary/20" : "bg-error-container/10 border border-error/20"}`}
						>
							<div
								className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${result.isLive ? "bg-primary/10" : "bg-error/10"}`}
							>
								<span
									className={`material-symbols-outlined text-4xl ${result.isLive ? "text-primary" : "text-error"}`}
									style={{ fontVariationSettings: "'FILL' 1" }}
								>
									{result.isLive ? "verified_user" : "gpp_bad"}
								</span>
							</div>
							<h2 className="text-3xl font-black tracking-tight mb-2">{result.isLive ? t("liveTitle") : t("spoofTitle")}</h2>
							<p className="text-on-surface-variant mb-8">{result.message}</p>

							<div className="grid grid-cols-2 gap-4 mb-8">
								<div className="bg-surface-container rounded-lg p-4">
									<p className="text-2xl font-black text-primary">{(result.confidence * 100).toFixed(1)}%</p>
									<p className="label-meta text-on-surface-variant text-[10px] mt-1">{t("confidence")}</p>
								</div>
								<div className="bg-surface-container rounded-lg p-4">
									<p className="text-2xl font-black text-on-surface">{result.isLive ? t("pass") : t("fail")}</p>
									<p className="label-meta text-on-surface-variant text-[10px] mt-1">{t("verdict")}</p>
								</div>
							</div>

							<div className="flex gap-3">
								<button
									onClick={reset}
									id="btn-retry-liveness"
									className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg hover:bg-surface-container-high transition-all active:scale-95 ghost-border"
								>
									{t("tryAgain")}
								</button>
								<button
									onClick={() => router.push("/home")}
									id="btn-back-to-demos"
									className="flex-1 py-3 bg-primary-cta text-on-primary-container font-semibold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all"
								>
									{tCommon("backToDemos")}
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Error */}
				{error && (
					<div className="mt-6 px-4 py-3 bg-error-container/20 border border-error/20 rounded-lg flex items-center gap-3 max-w-lg mx-auto">
						<span className="material-symbols-outlined text-error text-sm">error_outline</span>
						<span className="text-sm text-on-error-container">{error}</span>
					</div>
				)}
			</main>

			{/* Mobile bottom nav */}
			<nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center py-3 px-4 glass-panel-dark border-t border-outline-variant/10">
				{[
					{ icon: "lock", label: t("navVault"), active: false },
					{ icon: "fingerprint", label: t("navIdentity"), active: true },
					{ icon: "verified_user", label: t("navSecurity"), active: false },
					{ icon: "terminal", label: t("navLogs"), active: false },
				].map(({ icon, label, active }) => (
					<div
						key={label}
						className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg transition-all ${active ? "text-primary bg-surface-container" : "text-on-surface-variant/80 hover:text-primary"}`}
					>
						<span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
							{icon}
						</span>
						<span className="text-[10px] uppercase tracking-widest font-medium mt-1">{label}</span>
					</div>
				))}
			</nav>
		</div>
	);
}
