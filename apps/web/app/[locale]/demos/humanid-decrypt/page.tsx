"use client";

import { useState, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { decryptHumanId, fileToBase64, previewZelfIdQr } from "@humanauthn/api-client";
import { useAuthHydration } from "../../../hooks/useAuthHydration";
import { useAuthStore } from "../../../store/authStore";
import DemoCaptureOptionHeading from "../../../components/demos/DemoCaptureOptionHeading";
import DemoChooseOneCallout from "../../../components/demos/DemoChooseOneCallout";
import DemoOrDivider from "../../../components/demos/DemoOrDivider";
import DemoUploadImageButton from "../../../components/demos/DemoUploadImageButton";
import FaceGuidedCamera from "../../../components/demos/FaceGuidedCameraLoader";
import DemoSignInPrompt from "../DemoSignInPrompt";
import ElectronAwareAppHeader from "../../../components/layout/ElectronAwareAppHeader";

import HumanIdDecryptResult from "../../../components/demos/HumanIdDecryptResult";
import DemoRelatedDocsSection, { type DemoRelatedDocItem } from "../../../components/demos/DemoRelatedDocsSection";

const DOCS_BASE = "https://docs.verifik.co";

const RELATED_DOC_HREFS = [
	`${DOCS_BASE}/functions/decrypt-zelfproof`,
	`${DOCS_BASE}/functions/create-zelfproof`,
	`${DOCS_BASE}/api/tags/preview-zelfproof`,
	`${DOCS_BASE}/functions/create-qr-zelfproof`,
	`${DOCS_BASE}/biometrics/liveness`,
] as const;

const RELATED_DOC_BADGE_MUTED = [false, false, false, false, false] as const;

type Step = "form" | "processing" | "result";
type ProofMode = "paste" | "qr";

export default function HumanIdDecryptPage() {
	const t = useTranslations("demos.humanidDecrypt");
	const tCommon = useTranslations("demos.common");
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();

	const [step, setStep] = useState<Step>("form");
	const [proofMode, setProofMode] = useState<ProofMode>("paste");
	const [zelfProof, setZelfProof] = useState("");
	const [password, setPassword] = useState("");
	const [facePreview, setFacePreview] = useState<string | null>(null);
	const [faceB64, setFaceB64] = useState<string | null>(null);
	const [result, setResult] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [qrPreview, setQrPreview] = useState<string | null>(null);
	const [qrExtracting, setQrExtracting] = useState(false);
	const [qrExtractMessage, setQrExtractMessage] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const qrFileRef = useRef<HTMLInputElement>(null);

	const canUseDemo = hasHydrated && isAuthenticated;

	const relatedDocs = useMemo((): DemoRelatedDocItem[] => {
		return RELATED_DOC_HREFS.map((href, i) => ({
			href,
			title: t(`relatedDocs.${i}.title`),
			description: t(`relatedDocs.${i}.description`),
			badge: t(`relatedDocs.${i}.badge`),
			badgeMuted: RELATED_DOC_BADGE_MUTED[i],
		}));
	}, [t]);

	const handleFaceFile = async (files: FileList | null) => {
		if (!files?.[0]) return;
		const b64 = await fileToBase64(files[0]);
		setFaceB64(b64);
		setFacePreview(URL.createObjectURL(files[0]));
	};

	const setProofModeAndReset = (mode: ProofMode) => {
		setProofMode(mode);
		setError(null);
		setQrExtractMessage(null);
		if (mode === "paste") {
			if (qrPreview) URL.revokeObjectURL(qrPreview);
			setQrPreview(null);
			setZelfProof("");
		} else {
			setZelfProof("");
		}
	};

	const handleQrFile = async (files: FileList | null) => {
		const file = files?.[0];
		if (!file) return;
		setError(null);
		setQrExtractMessage(null);
		if (qrPreview) URL.revokeObjectURL(qrPreview);
		setQrPreview(URL.createObjectURL(file));
		setQrExtracting(true);
		const token = useAuthStore.getState().token;
		if (!token) {
			setQrExtracting(false);
			setError(tCommon("mustBeSignedIn"));
			return;
		}
		try {
			const rawB64 = await fileToBase64(file);
			const mime = file.type && file.type.startsWith("image/") ? file.type : "image/png";
			const zelfProofQRCode = `data:${mime};base64,${rawB64}`;
			const res = await previewZelfIdQr({ zelfProofQRCode }, token);
			if (res.error) {
				setZelfProof("");
				setError(res.error);
				setQrExtractMessage(null);
				return;
			}
			const envelope = res.data as { data?: { zelfProof?: string } } | undefined;
			const extracted = envelope?.data?.zelfProof;
			if (!extracted || typeof extracted !== "string") {
				setZelfProof("");
				setError(t("errorReadProof"));
				setQrExtractMessage(null);
				return;
			}
			setZelfProof(extracted);
			setQrExtractMessage(t("qrExtractSuccess"));
		} finally {
			setQrExtracting(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const token = useAuthStore.getState().token;
		if (!token || !faceB64 || !zelfProof.trim()) return;
		setStep("processing");
		setError(null);
		const res = await decryptHumanId(
			{ faceBase64: faceB64, os: "DESKTOP", zelfProof: zelfProof.trim(), password: password || undefined },
			token,
		);
		if (res.error) {
			setError(res.error);
			setStep("form");
			return;
		}
		setResult((res.data as Record<string, unknown>) ?? null);
		setStep("result");
	};

	const reset = () => {
		setStep("form");
		setFaceB64(null);
		setFacePreview(null);
		setResult(null);
		setError(null);
		setZelfProof("");
		setQrExtractMessage(null);
		if (qrPreview) URL.revokeObjectURL(qrPreview);
		setQrPreview(null);
		setProofMode("paste");
	};

	const canDecrypt = Boolean(faceB64 && zelfProof.trim() && !qrExtracting);
	const showApiReference = step !== "result";

	return (
		<div className="min-h-screen bg-surface flex flex-col">
			<ElectronAwareAppHeader>
				<button
					type="button"
					onClick={() => router.back()}
					className="hover:bg-surface-container transition-colors p-1.5 rounded-lg text-primary mr-3"
					aria-label={tCommon("backAria")}
				>
					<span className="material-symbols-outlined">arrow_back</span>
				</button>
				<h1 className="font-bold tracking-tight text-lg text-primary">{t("headerTitle")}</h1>
			</ElectronAwareAppHeader>
			<main
				className={`flex-1 mt-20 mb-10 px-4 md:px-8 mx-auto w-full ${step === "result" ? "max-w-3xl" : "max-w-4xl"}`}
			>
				<div className="mb-8 mt-6">
					<h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">
						{step === "result" ? t("heroTitleResult") : t("heroTitle")}
					</h2>
					<p className="text-on-surface-variant">{t("heroSubtitle")}</p>
				</div>
				{!hasHydrated ? (
					<div className="h-60 rounded-xl bg-surface-container-high animate-pulse" />
				) : !canUseDemo ? (
					<DemoSignInPrompt />
				) : step === "form" ? (
					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<p className="block text-sm font-semibold text-on-surface mb-2">{t("humanIdModeLabel")}</p>
							<div className="flex rounded-lg border border-outline-variant/30 p-1 bg-surface-container-low gap-1">
								<button
									type="button"
									onClick={() => setProofModeAndReset("paste")}
									className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
										proofMode === "paste" ? "bg-primary text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
									}`}
								>
									{t("pasteString")}
								</button>
								<button
									type="button"
									onClick={() => setProofModeAndReset("qr")}
									className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
										proofMode === "qr" ? "bg-primary text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
									}`}
								>
									{t("uploadQrImage")}
								</button>
							</div>
						</div>

						{proofMode === "paste" ? (
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="dec-proof">
									{t("proofLabel")} <span className="text-error">{tCommon("requiredStar")}</span>
								</label>
								<textarea
									id="dec-proof"
									required
									rows={4}
									value={zelfProof}
									onChange={(e) => {
										setZelfProof(e.target.value);
										setQrExtractMessage(null);
									}}
									placeholder={t("proofPlaceholder")}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-on-surface-variant/50 text-xs font-mono focus:outline-none focus:border-primary/60 transition-colors resize-none"
								/>
							</div>
						) : (
							<div className="space-y-3">
								<p className="text-xs text-on-surface-variant">{t("qrUploadHelp")}</p>
								<div className="flex flex-wrap items-center gap-3">
									<DemoUploadImageButton
										id="btn-upload-humanid-decrypt-qr"
										onClick={() => qrFileRef.current?.click()}
										primaryText={qrExtracting ? t("readingQr") : t("chooseQrImage")}
										secondaryText={t("secondaryPngJpeg")}
									/>
									{qrExtracting ? (
										<span className="inline-flex h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden />
									) : null}
								</div>
								<input
									ref={qrFileRef}
									type="file"
									accept="image/png,image/jpeg,image/jpg,image/*"
									className="hidden"
									onChange={(e) => handleQrFile(e.target.files)}
								/>
								{qrPreview ? (
									<img src={qrPreview} alt={t("qrPreviewAlt")} className="max-h-40 rounded-lg border border-outline-variant/30 object-contain bg-white p-2" />
								) : null}
								{zelfProof && proofMode === "qr" ? (
									<div className="rounded-lg border border-primary/30 bg-surface-container-high/40 px-3 py-2">
										<p className="text-xs font-semibold text-primary mb-1">{t("extractedHeading")}</p>
										<p className="text-[0.65rem] font-mono text-on-surface break-all line-clamp-4">{zelfProof}</p>
									</div>
								) : null}
								{qrExtractMessage ? <p className="text-sm text-primary font-medium">{qrExtractMessage}</p> : null}
							</div>
						)}

						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="dec-pw">
								{t("passwordOptional")}
							</label>
							<input
								id="dec-pw"
								type="text"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder={t("passwordPlaceholder")}
								className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:border-primary/60"
							/>
						</div>
						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5">
								{t("faceImageLabel")} <span className="text-error">{tCommon("requiredStar")}</span>
							</label>
							{!faceB64 ? (
								<div className="space-y-5">
									<DemoChooseOneCallout description={t("chooseOneDescription")} />
									<section aria-labelledby="humanid-decrypt-camera-heading">
										<DemoCaptureOptionHeading
											label="A"
											id="humanid-decrypt-camera-heading"
											title={t("cameraTitle")}
											subtitle={t("cameraSubtitle")}
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
											title={t("uploadTitle")}
											subtitle={t("uploadSubtitle")}
										/>
										<DemoUploadImageButton
											id="btn-upload-humanid-decrypt"
											onClick={() => fileRef.current?.click()}
											primaryText={t("uploadPrimary")}
											secondaryText={tCommon("jpegPngGallery")}
										/>
									</section>
								</div>
							) : null}
							{facePreview && faceB64 && (
								<img src={facePreview} alt={t("facePreviewAlt")} className="w-full aspect-video object-cover rounded-xl border border-frost mb-3" />
							)}
							<div className="flex gap-3">
								{faceB64 ? (
									<button
										type="button"
										onClick={() => {
											setFaceB64(null);
											setFacePreview(null);
										}}
										className="text-sm text-primary underline"
									>
										{t("changeFaceImage")}
									</button>
								) : null}
							</div>
							<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFaceFile(e.target.files)} />
						</div>
						{error && <div className="px-4 py-3 bg-error-container/20 border border-error/20 rounded-lg text-sm text-error">{error}</div>}
						<button
							type="submit"
							disabled={!canDecrypt}
							className="w-full py-3 bg-primary-cta text-on-primary-container font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
						>
							{t("decryptCta")}
						</button>
					</form>
				) : step === "processing" ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<p className="text-on-surface font-semibold">{t("processing")}</p>
					</div>
				) : (
					<HumanIdDecryptResult result={result} onTryAgain={reset} onBackToDemos={() => router.push("/home")} />
				)}

				{showApiReference ? (
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
								{t("apiOfficialGuide")}{" "}
								<a
									href={`${DOCS_BASE}/functions/decrypt-zelfproof`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									{t("apiDecryptLinkText")}
								</a>{" "}
								{t("apiOfficialParen")} {t("apiRelated")}{" "}
								<a
									href={`${DOCS_BASE}/functions/create-zelfproof`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									{t("relatedDocs.1.title")}
								</a>
								,{" "}
								<a
									href={`${DOCS_BASE}/functions/create-qr-zelfproof`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									{t("relatedDocs.3.title")}
								</a>
								,{" "}
								<a
									href={`${DOCS_BASE}/api/tags/preview-zelfproof`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									{t("relatedDocs.2.title")}
								</a>
								.
							</p>
							<p className="text-xs leading-relaxed">{t("apiBaseUrlNote")}</p>

							<div>
								<p className="font-mono text-xs text-on-surface mb-1">POST /v2/human-id/decrypt</p>
								<p className="text-xs leading-relaxed">{t("apiDecryptEndpointDesc")}</p>
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
											<th className="text-left py-2 pr-1">{tCommon("tableReq")}</th>
											<th className="text-left py-2">{tCommon("tableDescription")}</th>
										</tr>
									</thead>
									<tbody className="text-on-surface-variant">
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">faceBase64</td>
											<td>{tCommon("yes")}</td>
											<td>{t("paramFaceBase64Desc")}</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">os</td>
											<td>{tCommon("yes")}</td>
											<td>
												<code className="text-primary">DESKTOP</code>, <code className="text-primary">IOS</code>, or{" "}
												<code className="text-primary">ANDROID</code> — {t("paramOsDesc")}
											</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">zelfProof</td>
											<td>{tCommon("yes")}</td>
											<td>{t("paramZelfProofDesc")}</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">password</td>
											<td>{tCommon("no")}</td>
											<td>{t("paramPasswordDesc")}</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">livenessLevel</td>
											<td>{tCommon("no")}</td>
											<td>{t("paramLivenessLevelDesc")}</td>
										</tr>
										<tr className="align-top">
											<td className="py-2 font-mono text-primary">verifierKey</td>
											<td>{tCommon("no")}</td>
											<td>{t("paramVerifierKeyDesc")}</td>
										</tr>
									</tbody>
								</table>
							</div>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{`await fetch("https://api.verifik.co/v2/human-id/decrypt", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({
    faceBase64: "<base64>",
    os: "DESKTOP",
    zelfProof: "<human id string>",
  }),
});`}
							</pre>

							<div>
								<p className="font-mono text-xs text-on-surface mb-1">POST /v2/human-id/preview-zelf-id-qr</p>
								<p className="text-xs leading-relaxed mb-2">{t("apiPreviewQrEndpointDesc")}</p>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full text-xs border-collapse">
									<thead>
										<tr className="border-b border-outline-variant/20">
											<th className="text-left py-2 pr-1">{tCommon("tableParam")}</th>
											<th className="text-left py-2 pr-1">{tCommon("tableReq")}</th>
											<th className="text-left py-2">{tCommon("tableDescription")}</th>
										</tr>
									</thead>
									<tbody className="text-on-surface-variant">
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">zelfProofQRCode</td>
											<td>{tCommon("yes")}</td>
											<td>{t("paramQrCodeDesc")}</td>
										</tr>
										<tr className="align-top">
											<td className="py-2 font-mono text-primary">verifierKey</td>
											<td>{tCommon("no")}</td>
											<td>{t("paramVerifierKeyQrDesc")}</td>
										</tr>
									</tbody>
								</table>
							</div>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{`await fetch("https://api.verifik.co/v2/human-id/preview-zelf-id-qr", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({
    zelfProofQRCode: "data:image/png;base64,<...>",
  }),
});`}
							</pre>

							<ul className="list-disc pl-5 space-y-1 text-xs">
								<li>{t("apiBullet1")}</li>
								<li>{t("apiBullet2")}</li>
								<li>{t("apiBullet3")}</li>
							</ul>
						</div>
					</details>
				) : null}

				<DemoRelatedDocsSection items={relatedDocs} />
			</main>
		</div>
	);
}
