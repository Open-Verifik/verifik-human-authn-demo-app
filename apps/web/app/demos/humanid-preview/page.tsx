"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { fileToBase64, previewHumanId, previewZelfIdQr } from "@humanauthn/api-client";
import { useAuthHydration } from "../../hooks/useAuthHydration";
import { useAuthStore } from "../../store/authStore";
import DemoUploadImageButton from "../../components/demos/DemoUploadImageButton";
import DemoSignInPrompt from "../DemoSignInPrompt";
import HumanIdPreviewResult from "../../components/demos/HumanIdPreviewResult";
import DemoRelatedDocsSection, { type DemoRelatedDocItem } from "../../components/demos/DemoRelatedDocsSection";

const DOCS_BASE = "https://docs.verifik.co";

const RELATED_DOCS: DemoRelatedDocItem[] = [
	{
		href: `${DOCS_BASE}/api/tags/preview-zelfproof`,
		title: "Preview ZelfProof",
		description: "Reference for inspecting public metadata from a proof before you decrypt or use it elsewhere.",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/functions/create-zelfproof`,
		title: "Create a ZelfProof",
		description: "Encrypt your public fields and face capture into a new HumanID string you can store or share.",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/functions/decrypt-zelfproof`,
		title: "Decrypt a ZelfProof",
		description: "Unlock the identity payload inside a proof by matching it to a live face.",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/functions/create-qr-zelfproof`,
		title: "Create QR ZelfProof",
		description: "Generate a QR that embeds a HumanID so people can scan it from a screen or wallet.",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/biometrics/liveness`,
		title: "Liveness detection",
		description: "Run a dedicated check that a face image looks live rather than spoofed. Separate from HumanID preview.",
		badge: "POST",
	},
];

type Step = "form" | "processing" | "result";
type ProofMode = "paste" | "qr";

export default function HumanIdPreviewPage() {
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();

	const [step, setStep] = useState<Step>("form");
	const [proofMode, setProofMode] = useState<ProofMode>("paste");
	const [zelfProof, setZelfProof] = useState("");
	const [verifierKey, setVerifierKey] = useState("");
	const [result, setResult] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [qrPreview, setQrPreview] = useState<string | null>(null);
	const [qrExtracting, setQrExtracting] = useState(false);
	const [qrExtractMessage, setQrExtractMessage] = useState<string | null>(null);
	const qrFileRef = useRef<HTMLInputElement>(null);

	const canUseDemo = hasHydrated && isAuthenticated;
	const showApiReference = step !== "result";
	const canPreview = Boolean(zelfProof.trim() && !qrExtracting);

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
			setError("Not signed in.");
			return;
		}
		try {
			const rawB64 = await fileToBase64(file);
			const mime = file.type && file.type.startsWith("image/") ? file.type : "image/png";
			const zelfProofQRCode = `data:${mime};base64,${rawB64}`;
			const res = await previewZelfIdQr({ zelfProofQRCode, verifierKey: verifierKey.trim() || undefined }, token);
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
				setError("Could not read HumanID from QR preview response.");
				setQrExtractMessage(null);
				return;
			}
			setZelfProof(extracted);
			setQrExtractMessage("HumanID extracted from QR. Add a verifier key if needed, then preview.");
		} finally {
			setQrExtracting(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const token = useAuthStore.getState().token;
		if (!token || !zelfProof.trim()) return;
		setStep("processing");
		setError(null);
		const res = await previewHumanId({ zelfProof: zelfProof.trim(), verifierKey: verifierKey || undefined }, token);
		if (res.error) {
			setError(res.error);
			setStep("form");
			return;
		}
		setResult(res.data as Record<string, unknown>);
		setStep("result");
	};

	const reset = () => {
		setStep("form");
		setZelfProof("");
		setVerifierKey("");
		setResult(null);
		setError(null);
		setQrExtractMessage(null);
		if (qrPreview) URL.revokeObjectURL(qrPreview);
		setQrPreview(null);
		setProofMode("paste");
	};

	return (
		<div className="min-h-screen bg-surface flex flex-col">
			<header className="fixed top-0 left-0 w-full z-50 glass-panel-dark flex items-center px-6 py-4">
				<button
					type="button"
					onClick={() => router.back()}
					className="hover:bg-surface-container transition-colors p-1.5 rounded-lg text-primary mr-3"
					aria-label="Back"
				>
					<span className="material-symbols-outlined">arrow_back</span>
				</button>
				<h1 className="font-bold tracking-tight text-lg text-primary">Preview HumanID</h1>
			</header>
			<main
				className={`flex-1 mt-20 mb-10 px-4 md:px-8 mx-auto w-full ${step === "result" ? "max-w-3xl" : "max-w-4xl"}`}
			>
				<div className="mb-8 mt-6">
					<h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">
						{step === "result" ? "Preview Ready" : "Preview HumanID"}
					</h2>
					<p className="text-on-surface-variant">Inspect public metadata from a ZelfProof. No face or credentials needed.</p>
				</div>
				{!hasHydrated ? (
					<div className="h-40 rounded-xl bg-surface-container-high animate-pulse" />
				) : !canUseDemo ? (
					<DemoSignInPrompt />
				) : step === "form" ? (
					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<p className="block text-sm font-semibold text-on-surface mb-2">HumanID</p>
							<div className="flex rounded-lg border border-outline-variant/30 p-1 bg-surface-container-low gap-1">
								<button
									type="button"
									onClick={() => setProofModeAndReset("paste")}
									className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
										proofMode === "paste" ? "bg-primary text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
									}`}
								>
									Paste string
								</button>
								<button
									type="button"
									onClick={() => setProofModeAndReset("qr")}
									className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
										proofMode === "qr" ? "bg-primary text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
									}`}
								>
									Upload QR image
								</button>
							</div>
						</div>

						{proofMode === "paste" ? (
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="prev-proof">
									ZelfProof string <span className="text-error">*</span>
								</label>
								<textarea
									id="prev-proof"
									required
									rows={5}
									value={zelfProof}
									onChange={(e) => {
										setZelfProof(e.target.value);
										setQrExtractMessage(null);
									}}
									placeholder="Paste the ZelfProof string here…"
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-outline text-xs font-mono focus:outline-none focus:border-primary/60 transition-colors resize-none"
								/>
							</div>
						) : (
							<div className="space-y-3">
								<p className="text-xs text-on-surface-variant">
									Upload a PNG or JPEG of the HumanID QR. We decode the QR and fill the proof string for preview.
								</p>
								<div className="flex flex-wrap items-center gap-3">
									<DemoUploadImageButton
										id="btn-upload-humanid-preview-qr"
										onClick={() => qrFileRef.current?.click()}
										primaryText={qrExtracting ? "Reading QR…" : "Choose QR image"}
										secondaryText="PNG or JPEG"
									/>
									{qrExtracting ? (
										<span
											className="inline-flex h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"
											aria-hidden
										/>
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
									<img
										src={qrPreview}
										alt="QR preview"
										className="max-h-40 rounded-lg border border-outline-variant/30 object-contain bg-white p-2"
									/>
								) : null}
								{zelfProof && proofMode === "qr" ? (
									<div className="rounded-lg border border-primary/30 bg-surface-container-high/40 px-3 py-2">
										<p className="text-xs font-semibold text-primary mb-1">Extracted HumanID (read-only)</p>
										<p className="text-[0.65rem] font-mono text-on-surface break-all line-clamp-6">{zelfProof}</p>
									</div>
								) : null}
								{qrExtractMessage ? <p className="text-sm text-primary font-medium">{qrExtractMessage}</p> : null}
							</div>
						)}

						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="prev-vk">
								Verifier key (optional)
							</label>
							<input
								id="prev-vk"
								type="text"
								value={verifierKey}
								onChange={(e) => setVerifierKey(e.target.value)}
								placeholder="Unlocks additional fields if set during creation"
								className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-outline text-sm focus:outline-none focus:border-primary/60"
							/>
						</div>
						{error && (
							<div className="px-4 py-3 bg-error-container/20 border border-error/20 rounded-lg text-sm text-error">{error}</div>
						)}
						<button
							type="submit"
							disabled={!canPreview}
							className="w-full py-3 bg-primary-cta text-on-primary-container font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
						>
							Preview
						</button>
					</form>
				) : step === "processing" ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<p className="text-on-surface font-semibold">Fetching preview…</p>
					</div>
				) : (
					<HumanIdPreviewResult result={result} onPreviewAnother={reset} onBackToDemos={() => router.push("/home")} />
				)}

				{showApiReference ? (
					<details className="mt-10 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 text-left max-w-3xl mx-auto w-full px-4 py-3 group">
						<summary className="cursor-pointer list-none font-bold text-sm text-primary flex items-center justify-between gap-2">
							<span className="flex items-center gap-2">
								<span className="material-symbols-outlined text-lg">menu_book</span>
								API reference: Preview HumanID
							</span>
							<span className="material-symbols-outlined text-outline-variant group-open:rotate-180 transition-transform">
								expand_more
							</span>
						</summary>
						<div className="mt-4 space-y-4 text-sm text-on-surface-variant border-t border-outline-variant/15 pt-4">
							<p>
								Official documentation:{" "}
								<a
									href={`${DOCS_BASE}/api/tags/preview-zelfproof`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									docs.verifik.co/api/tags/preview-zelfproof
								</a>{" "}
								(parameters, responses, and examples). This demo calls{" "}
								<code className="text-primary">POST /v2/human-id/preview</code> via{" "}
								<code className="text-primary">previewHumanId</code>, which matches that workflow on the current API. Related:{" "}
								<a
									href={`${DOCS_BASE}/functions/create-zelfproof`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									Create a ZelfProof
								</a>
								,{" "}
								<a
									href={`${DOCS_BASE}/functions/decrypt-zelfproof`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									Decrypt a ZelfProof
								</a>
								.
							</p>
							<p className="text-xs leading-relaxed">
								Base URL <code className="text-primary">https://api.verifik.co</code>. Send JSON with{" "}
								<code className="text-primary">Content-Type: application/json</code> and{" "}
								<code className="text-primary">Authorization: Bearer &lt;access token&gt;</code> (same JWT as this demo after sign
								in).
							</p>

							<div>
								<p className="font-mono text-xs text-on-surface mb-1">POST /v2/human-id/preview</p>
								<p className="text-xs leading-relaxed">
									Returns non-sensitive preview fields for a proof (for example whether a password is required) inside the usual
									signed <code className="text-primary">data</code> envelope.
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
							<div className="overflow-x-auto">
								<table className="w-full text-xs border-collapse">
									<thead>
										<tr className="border-b border-outline-variant/20">
											<th className="text-left py-2 pr-1">Param</th>
											<th className="text-left py-2 pr-1">Req</th>
											<th className="text-left py-2">Description</th>
										</tr>
									</thead>
									<tbody className="text-on-surface-variant">
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">zelfProof</td>
											<td>Yes</td>
											<td>HumanID string from paste, or from QR extraction in this form</td>
										</tr>
										<tr className="align-top">
											<td className="py-2 font-mono text-primary">verifierKey</td>
											<td>No</td>
											<td>If the proof was created with a verifier key</td>
										</tr>
									</tbody>
								</table>
							</div>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{`await fetch("https://api.verifik.co/v2/human-id/preview", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({
    zelfProof: "<human id string>",
  }),
});`}
							</pre>

							<div>
								<p className="font-mono text-xs text-on-surface mb-1">POST /v2/human-id/preview-zelf-id-qr</p>
								<p className="text-xs leading-relaxed mb-2">
									Use when the user provides a PNG or JPEG of the HumanID QR. The API decodes the payload and returns a{" "}
									<code className="text-primary">zelfProof</code> you can send to the preview call above. Same JSON headers as
									preview. Optional <code className="text-primary">verifierKey</code> when the proof uses one.
								</p>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full text-xs border-collapse">
									<thead>
										<tr className="border-b border-outline-variant/20">
											<th className="text-left py-2 pr-1">Param</th>
											<th className="text-left py-2 pr-1">Req</th>
											<th className="text-left py-2">Description</th>
										</tr>
									</thead>
									<tbody className="text-on-surface-variant">
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">zelfProofQRCode</td>
											<td>Yes</td>
											<td>
												Image as a data URL (<code className="text-primary">data:image/png;base64,...</code>) or another
												form accepted by the API (this demo builds a data URL from the file)
											</td>
										</tr>
										<tr className="align-top">
											<td className="py-2 font-mono text-primary">verifierKey</td>
											<td>No</td>
											<td>Same semantics as on preview when the proof uses a verifier key</td>
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
								<li>
									This demo uses <code className="text-primary">previewHumanId</code> and, for QR images,{" "}
									<code className="text-primary">previewZelfIdQr</code> from <code className="text-primary">@humanauthn/api-client</code>{" "}
									with your session token.
								</li>
								<li>
									Success responses follow the Verifik pattern: a <code className="text-primary">data</code> object (and often a{" "}
									<code className="text-primary">signature</code> when signing is enabled for your project).
								</li>
							</ul>
						</div>
					</details>
				) : null}

				<DemoRelatedDocsSection items={RELATED_DOCS} />
			</main>
		</div>
	);
}
