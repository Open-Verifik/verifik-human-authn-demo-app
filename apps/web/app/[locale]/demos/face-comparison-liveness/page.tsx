"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
	compareWithLiveness,
	DEFAULT_COMPARE_WITH_LIVENESS_LIVENESS_FLOOR,
	DEFAULT_FACE_COMPARE_MIN_SCORE,
	fileToBase64,
	parseCompareWithLivenessResult,
	type CompareWithLivenessParsed,
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

import { Checkbox } from "@/components/ui/checkbox";

type Step = 1 | 2 | 3;
interface FaceSlot {
	preview: string | null;
	b64: string | null;
}
const emptySlot = (): FaceSlot => ({ preview: null, b64: null });
type SlotKind = "source" | "target";

export default function FaceComparisonPage() {
	const t = useTranslations("demos.faceComparisonLiveness");
	const tCommon = useTranslations("demos.common");
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
			setError(t("mustSignIn"));
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
					const friendly = raw === "No faces found in the image" ? t("cropErrorNoFace") : raw || t("cropErrorGeneric");
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

	const steps = useMemo(
		() =>
			[
				{ label: t("stepSource"), sub: t("stepSourceSub") },
				{ label: t("stepTarget"), sub: t("stepTargetSub") },
				{ label: t("stepAnalyze"), sub: null },
			] as const,
		[t],
	);
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
						aria-label={tCommon("backAria")}
					>
						<span className="material-symbols-outlined">arrow_back</span>
					</button>
					<h1 className="font-bold tracking-tight text-lg text-primary">{t("headerTitle")}</h1>
				</div>
				<span className="label-meta text-primary text-[0.6875rem]">{t("stepProgress", { step, total: 3 })}</span>
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
						{step === 1 ? t("headlineSource") : step === 2 ? t("headlineTarget") : t("headlineAnalysis")}
					</h2>
					{step === 1 ? (
						<div className="mx-auto mt-4 max-w-xl space-y-3 px-3 text-pretty">
							<p className="text-sm leading-relaxed text-on-surface-variant">{t("sourcePara1")}</p>
							<div className="border-t border-outline-variant/25 pt-3">
								<p className="text-sm leading-relaxed text-on-surface-variant">{t("sourcePara2")}</p>
							</div>
						</div>
					) : step === 2 ? (
						<div className="mx-auto mt-4 max-w-xl space-y-3 px-3 text-pretty">
							<p className="text-sm leading-relaxed text-on-surface-variant">{t("targetPara1")}</p>
							<div className="border-t border-outline-variant/25 pt-3">
								<p className="text-sm leading-relaxed text-on-surface-variant">{t("targetPara2")}</p>
							</div>
						</div>
					) : (
						<p className="mt-4 text-on-surface-variant text-sm leading-relaxed">
							{isLoading ? t("subLoading") : result ? t("subResult") : t("subProcessing")}
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
									{ slot: source, label: t("slotSource"), key: "source" as const },
									{ slot: target, label: t("slotTarget"), key: "target" as const },
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
							{canUseDemo ? <DemoChooseOneCallout description={t("chooseOneDescription")} /> : null}
							<section aria-labelledby={canUseDemo ? `capture-camera-heading-${currentSlot}` : undefined}>
								{canUseDemo ? (
									<DemoCaptureOptionHeading
										label="A"
										id={`capture-camera-heading-${currentSlot}`}
										title={t("cameraTitle")}
										subtitle={step === 1 ? t("cameraSubtitleSource") : t("cameraSubtitleTarget")}
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
											title={t("uploadTitle")}
											subtitle={t("uploadSubtitle")}
										/>
										<DemoUploadImageButton
											id={`btn-upload-${currentSlot}`}
											onClick={() => (step === 1 ? sourceFileRef.current?.click() : targetFileRef.current?.click())}
											primaryText={t("uploadPrimary")}
											secondaryText={t("uploadSecondary")}
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
										{t("compareMinScoreLabel")}
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
										{t("livenessMinScoreLabel")}
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
										<span className="block text-on-surface font-medium leading-snug">{t("cropCheckboxTitle")}</span>
										<span className="block text-xs text-on-surface-variant leading-relaxed">{t("cropCheckboxBody")}</span>
									</span>
								</label>
							</div>
						)}

						<details className="mt-10 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 text-left max-w-3xl mx-auto w-full px-4 py-3 group">
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
									{t("apiRefOfficialLead")}{" "}
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
									<p className="font-mono text-xs text-on-surface mb-1">{t("apiRefEndpoint")}</p>
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
								<p className="text-xs text-on-surface-variant">{t("apiRefProbeGallery")}</p>
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
												<td className="py-2 font-mono text-primary">probe</td>
												<td>string</td>
												<td>{tCommon("yes")}</td>
												<td>{t("paramProbeDesc")}</td>
											</tr>
											<tr className="border-b border-outline-variant/10 align-top">
												<td className="py-2 font-mono text-primary">gallery</td>
												<td>string[]</td>
												<td>{tCommon("yes")}</td>
												<td>{t("paramGalleryDesc")}</td>
											</tr>
											<tr className="border-b border-outline-variant/10 align-top">
												<td className="py-2 font-mono text-primary">liveness_min_score</td>
												<td>number</td>
												<td>{tCommon("no")}</td>
												<td>{t("paramLivenessMinDesc")}</td>
											</tr>
											<tr className="align-top">
												<td className="py-2 font-mono text-primary">compare_min_score</td>
												<td>number</td>
												<td>{tCommon("no")}</td>
												<td>{t("paramCompareMinDesc")}</td>
											</tr>
										</tbody>
									</table>
								</div>
								<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface">
									{`// 200 OK, example response shape\n{\n  "data": {\n    "comparison": { "score": 0.88 },\n    "liveness": {\n      "liveness_score": 0.91,\n      "min_score": 0.6,\n      "passed": true\n    }\n  }\n}`}
								</pre>
								<ul className="list-disc pl-5 space-y-1 text-xs">
									<li>{t("bulletSeq")}</li>
									<li>{t("bulletLivenessDefault")}</li>
									<li>{t("bulletGalleryUrl")}</li>
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
									<span className="label-meta text-[10px] text-on-surface-variant">{i === 0 ? t("slotSource") : t("slotTarget")}</span>
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
								<p className="text-on-surface-variant">{t("analyzing")}</p>
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
										? t("titleVerified")
										: !result.match
											? t("titleFaceMismatch")
											: result.livenessSkipped
												? t("titleLivenessNotRun")
												: t("titleLivenessBelow")}
								</h2>
								<p className="text-on-surface-variant mb-6 text-sm leading-relaxed">
									{result.message ||
										(verified(result)
											? t("msgVerified")
											: !result.match && result.livenessSkipped
												? t("msgBelowSkip")
												: !result.match
													? t("msgBelowMatch")
													: result.livenessSkipped
														? t("msgLivenessSkipped")
														: t("msgLivenessLow"))}
								</p>
								<div className="grid grid-cols-2 gap-4 mb-6">
									<div className="bg-surface-container rounded-lg p-4">
										<p className="text-2xl font-black text-primary">{(result.score * 100).toFixed(1)}%</p>
										<p className="label-meta text-on-surface-variant text-[10px] mt-1">
											{t("similarityMin", { score: compareMinScore.toFixed(2) })}
										</p>
										<p className="text-[10px] font-mono mt-1 text-on-surface-variant">
											{result.match ? t("pass") : t("fail")}
										</p>
									</div>
									<div className="bg-surface-container rounded-lg p-4">
										<p className="text-2xl font-black text-on-surface">
											{result.livenessSkipped
												? t("na")
												: result.livenessScore != null
													? `${(result.livenessScore * 100).toFixed(1)}%`
													: t("na")}
										</p>
										<p className="label-meta text-on-surface-variant text-[10px] mt-1">
											{t("livenessMin", { score: result.livenessMinScore.toFixed(2) })}
										</p>
										<p
											className={`text-[10px] font-mono mt-1 ${result.livenessSkipped ? "text-on-surface-variant/80" : result.livenessPassed ? "text-primary" : "text-error"}`}
										>
											{result.livenessSkipped
												? t("skipped")
												: result.livenessScore != null
													? result.livenessPassed
														? t("pass")
														: t("fail")
													: t("na")}
										</p>
									</div>
								</div>
								<div className="flex gap-3">
									<button
										onClick={reset}
										id="btn-retry-comparison"
										className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg hover:bg-surface-container-high ghost-border active:scale-95 transition-all"
									>
										{t("tryAgain")}
									</button>
									<button
										onClick={() => router.push("/home")}
										id="btn-back-to-home"
										className="flex-1 py-3 bg-primary-cta text-on-primary-container font-semibold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all"
									>
										{tCommon("backToDemos")}
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
					<span className="label-meta text-[0.625rem] text-on-surface-variant/45">{t("metaVerifik")}</span>
				</div>
				<div className="fixed bottom-24 left-8 hidden lg:block">
					<div className="space-y-3">
						<div className="h-10 w-px bg-outline-variant/20 ml-2" />
						<p className="text-[0.625rem] font-mono text-primary/40 leading-tight whitespace-pre-line">{t("engineBlock")}</p>
					</div>
				</div>
			</main>

			{/* Mobile bottom nav */}
			<nav className="fixed bottom-0 left-0 w-full z-50 glass-panel-dark backdrop-blur-xl flex justify-around items-center py-3 px-8 border-t border-outline-variant/10 md:hidden">
				<div className="flex flex-col items-center gap-1 cursor-pointer text-on-surface-variant/80 hover:text-primary transition-colors p-2">
					<span className="material-symbols-outlined">help_outline</span>
					<span className="text-[0.625rem]">{t("support")}</span>
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
