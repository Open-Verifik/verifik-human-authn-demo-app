"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createHumanId, fileToBase64 } from "@humanauthn/api-client";
import { useAuthHydration } from "../../../hooks/useAuthHydration";
import { useAuthStore } from "../../../store/authStore";
import DemoCaptureOptionHeading from "../../../components/demos/DemoCaptureOptionHeading";
import DemoChooseOneCallout from "../../../components/demos/DemoChooseOneCallout";
import DemoOrDivider from "../../../components/demos/DemoOrDivider";
import DemoUploadImageButton from "../../../components/demos/DemoUploadImageButton";
import FaceGuidedCamera from "../../../components/demos/FaceGuidedCameraLoader";
import DemoSignInPrompt from "../DemoSignInPrompt";
import ElectronAwareAppHeader from "../../../components/layout/ElectronAwareAppHeader";
import HumanIdJsonKeyValueField, { type HumanIdJsonKeyValueFieldHandle } from "../../../components/demos/HumanIdJsonKeyValueField";
import HumanIdStructuredResult from "../../../components/demos/HumanIdStructuredResult";

type Step = "form" | "processing" | "result";

const ENCRYPT_PARAM_ROWS = [
	["publicData", true, "paramPublicData"],
	["faceBase64", true, "paramFaceBase64"],
	["livenessLevel", true, "paramLivenessLevel"],
	["metadata", true, "paramMetadata"],
	["os", true, "paramOs"],
	["identifier", true, "paramIdentifier"],
	["requireLiveness", true, "paramRequireLiveness"],
	["tolerance", false, "paramTolerance"],
	["password", false, "paramPassword"],
] as const;

export default function HumanIdCreatePage() {
	const t = useTranslations("demos.humanidCreate");
	const tCommon = useTranslations("demos.common");
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();

	const [step, setStep] = useState<Step>("form");
	const [identifier, setIdentifier] = useState("");
	const [livenessLevel, setLivenessLevel] = useState("1");
	const [requireLiveness, setRequireLiveness] = useState(true);
	const [tolerance, setTolerance] = useState<"REGULAR" | "SOFT" | "HARDENED">("REGULAR");
	const [facePreview, setFacePreview] = useState<string | null>(null);
	const [faceB64, setFaceB64] = useState<string | null>(null);
	const [publicData, setPublicData] = useState<Record<string, string>>({
		name: "Jane Doe",
		documentNumber: "12345678",
	});
	const [metadata, setMetadata] = useState<Record<string, string>>({
		createdBy: "demo",
	});
	const [password, setPassword] = useState("");
	const [result, setResult] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const publicDataFieldRef = useRef<HumanIdJsonKeyValueFieldHandle>(null);
	const metadataFieldRef = useRef<HumanIdJsonKeyValueFieldHandle>(null);

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
		if (!token || !faceB64) return;
		setError(null);
		const pub = publicDataFieldRef.current?.commitJsonIfNeeded();
		if (pub == null) {
			setError(t("errorPublicDataJson"));
			return;
		}
		const meta = metadataFieldRef.current?.commitJsonIfNeeded();
		if (meta == null) {
			setError(t("errorMetadataJson"));
			return;
		}
		if (Object.keys(pub).length === 0 || Object.keys(meta).length === 0) {
			setError(t("errorKeysRequired"));
			return;
		}
		setStep("processing");
		const res = await createHumanId({ publicData: pub, faceBase64: faceB64, livenessLevel, metadata: meta, os: "DESKTOP", identifier, requireLiveness, tolerance, password: password || undefined }, token);
		if (res.error) { setError(res.error); setStep("form"); return; }
		setResult(res.data as Record<string, unknown>);
		setStep("result");
	};

	const reset = () => {
		setStep("form");
		setFaceB64(null);
		setFacePreview(null);
		setResult(null);
		setError(null);
		setPublicData({ name: "Jane Doe", documentNumber: "12345678" });
		setMetadata({ createdBy: "demo" });
	};

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
			<main className={`flex-1 mt-20 mb-10 px-4 md:px-8 mx-auto w-full ${step === "result" ? "max-w-3xl" : "max-w-2xl"}`}>
				<details className="mb-8 mt-6 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 text-left px-4 py-3 group">
					<summary className="cursor-pointer list-none font-bold text-sm text-primary flex items-center justify-between gap-2">
						<span className="flex items-center gap-2">
							<span className="material-symbols-outlined text-lg">menu_book</span>
							{t("apiRefSummary")}
						</span>
						<span className="material-symbols-outlined text-on-surface-variant/70 group-open:rotate-180 transition-transform">expand_more</span>
					</summary>
					<div className="mt-4 space-y-3 text-sm text-on-surface-variant border-t border-outline-variant/15 pt-4">
						<p className="font-mono text-xs text-on-surface">POST /v2/human-id/encrypt</p>
						<p className="text-xs">{t("apiIntro")}</p>
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
									{ENCRYPT_PARAM_ROWS.map(([param, required, descKey]) => (
										<tr key={param} className="border-b border-outline-variant/10">
											<td className="py-2 font-mono text-primary">{param}</td>
											<td>{required ? tCommon("yes") : tCommon("no")}</td>
											<td>{t(descKey)}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</details>
				<div className="mb-8">
					<h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">
						{step === "result" ? t("heroTitleResult") : t("heroTitleForm")}
					</h2>
					<p className="text-on-surface-variant">{t("heroSubtitle")}</p>
				</div>
				{!hasHydrated ? <div className="h-60 rounded-xl bg-surface-container-high animate-pulse" /> : !canUseDemo ? <DemoSignInPrompt /> : step === "form" ? (
					<form onSubmit={handleSubmit} className="space-y-5">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="hid-identifier">
									{t("identifierLabel")} <span className="text-error">{tCommon("requiredStar")}</span>
								</label>
								<input
									id="hid-identifier"
									type="text"
									required
									value={identifier}
									onChange={(e) => setIdentifier(e.target.value)}
									placeholder={t("identifierPlaceholder")}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:border-primary/60 transition-colors"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5">{t("toleranceLabel")}</label>
								<select value={tolerance} onChange={(e) => setTolerance(e.target.value as "REGULAR" | "SOFT" | "HARDENED")} className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-primary/60">
									<option value="REGULAR">REGULAR</option>
									<option value="SOFT">SOFT</option>
									<option value="HARDENED">HARDENED</option>
								</select>
							</div>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="hid-liveness">
									{t("livenessLevelLabel")}
								</label>
								<input
									id="hid-liveness"
									type="text"
									value={livenessLevel}
									onChange={(e) => setLivenessLevel(e.target.value)}
									placeholder={t("livenessPlaceholder")}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:border-primary/60"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="hid-pw">
									{t("passwordOptionalLabel")}
								</label>
								<input
									id="hid-pw"
									type="text"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder={t("passwordPlaceholder")}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:border-primary/60"
								/>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<input id="hid-req-live" type="checkbox" checked={requireLiveness} onChange={(e) => setRequireLiveness(e.target.checked)} className="w-4 h-4 accent-primary" />
							<label htmlFor="hid-req-live" className="text-sm text-on-surface">
								{t("requireLivenessLabel")}
							</label>
						</div>
						<HumanIdJsonKeyValueField
							ref={publicDataFieldRef}
							label={t("publicDataLabel")}
							required
							hint={t("publicDataHint")}
							value={publicData}
							onChange={setPublicData}
						/>
						<HumanIdJsonKeyValueField
							ref={metadataFieldRef}
							label={t("metadataLabel")}
							required
							hint={t("metadataHint")}
							value={metadata}
							onChange={setMetadata}
						/>
						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5">
								{t("faceImageLabel")} <span className="text-error">{tCommon("requiredStar")}</span>
							</label>
							{!faceB64 ? (
								<div className="space-y-5">
									<DemoChooseOneCallout description={t("chooseOneDescription")} />
									<section aria-labelledby="humanid-create-camera-heading">
										<DemoCaptureOptionHeading
											label="A"
											id="humanid-create-camera-heading"
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
									<section aria-labelledby="humanid-create-upload-heading">
										<DemoCaptureOptionHeading
											label="B"
											id="humanid-create-upload-heading"
											title={t("uploadTitle")}
											subtitle={t("uploadSubtitle")}
										/>
										<DemoUploadImageButton
											id="btn-upload-humanid-create"
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
							<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files)} />
						</div>
						{error && <div className="px-4 py-3 bg-error-container/20 border border-error/20 rounded-lg text-sm text-error">{error}</div>}
						<button
							type="submit"
							disabled={!faceB64}
							className="w-full py-3 bg-primary-cta text-on-primary-container font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
						>
							{t("submitCta")}
						</button>
					</form>
				) : step === "processing" ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<p className="text-on-surface font-semibold">{t("processing")}</p>
					</div>
				) : (
					<HumanIdStructuredResult
						result={result}
						successTitle={t("resultSuccessTitle")}
						onCreateAnother={reset}
						onBackToDemos={() => router.push("/home")}
					/>
				)}
			</main>
		</div>
	);
}
