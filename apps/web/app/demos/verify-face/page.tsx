"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { verifyFace, fileToBase64 } from "@humanauthn/api-client";
import { useAuthHydration } from "../../hooks/useAuthHydration";
import { useAuthStore } from "../../store/authStore";
import DemoCaptureOptionHeading from "../../components/demos/DemoCaptureOptionHeading";
import DemoChooseOneCallout from "../../components/demos/DemoChooseOneCallout";
import DemoOrDivider from "../../components/demos/DemoOrDivider";
import DemoScannerShell from "../../components/demos/DemoScannerShell";
import DemoUploadImageButton from "../../components/demos/DemoUploadImageButton";
import FaceGuidedCamera from "../../components/demos/FaceGuidedCameraLoader";
import DemoRelatedDocsSection, { type DemoRelatedDocItem } from "../../components/demos/DemoRelatedDocsSection";
import DemoSignInPrompt from "../DemoSignInPrompt";

const DOCS_BASE = "https://docs.verifik.co";
const DOCS_ES_BASE = "https://docs.verifik.co/verifik-es";

const RELATED_DOCS: DemoRelatedDocItem[] = [
	{
		href: `${DOCS_BASE}/biometrics/compare`,
		title: "Face Comparison",
		description: "1:1 face comparison between two image sets without an enrolled person id.",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/biometrics/compare-live`,
		title: "Face Comparison (Live)",
		description: "1:1 comparison with liveness on the probe image.",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/biometrics/compare-with-liveness`,
		title: "Compare with Liveness",
		description: "1:1 comparison plus configurable liveness thresholds.",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/biometrics/search`,
		title: "Face Search (1:N)",
		description: "Search by face image against enrolled persons in your collections.",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/biometrics/liveness`,
		title: "Liveness Detection",
		description: "Determine if a face is live vs spoof; liveness score.",
		badge: "POST",
	},
];

export default function VerifyFacePage() {
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();

	const [personId, setPersonId] = useState("");
	const [images, setImages] = useState<string[]>([]);
	const [previews, setPreviews] = useState<string[]>([]);
	const [minScore, setMinScore] = useState(0.75);
	const [searchMode, setSearchMode] = useState<"FAST" | "ACCURATE">("FAST");
	const [collectionId, setCollectionId] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	const canUseDemo = hasHydrated && isAuthenticated;
	const showApiReference = result === null;

	const appendCapturedImage = (preview: string, b64: string) => {
		setImages((p) => [...p, b64]);
		setPreviews((p) => [...p, preview]);
	};

	const handleFiles = async (files: FileList | null) => {
		if (!files?.length) return;
		const b64s = await Promise.all(Array.from(files).map(fileToBase64));
		setImages((p) => [...p, ...b64s]);
		setPreviews((p) => [...p, ...Array.from(files).map((f) => URL.createObjectURL(f))]);
	};

	const handleVerify = async () => {
		const token = useAuthStore.getState().token;
		if (!token || !personId || !images.length) return;
		setLoading(true);
		setError(null);
		setResult(null);
		const res = await verifyFace(
			{
				id: personId,
				images,
				min_score: minScore,
				search_mode: searchMode,
				collection_id: collectionId || undefined,
			},
			token,
		);
		setLoading(false);
		if (res.error) {
			setError(res.error);
			return;
		}
		setResult(res.data as Record<string, unknown>);
	};

	const reset = () => {
		setPersonId("");
		setCollectionId("");
		setImages([]);
		setPreviews([]);
		setResult(null);
		setError(null);
	};

	return (
		<div className="min-h-screen bg-surface flex flex-col">
			<header className="fixed top-0 left-0 w-full z-50 glass-panel-dark flex items-center px-6 py-4">
				<button
					onClick={() => router.back()}
					className="hover:bg-surface-container transition-colors p-1.5 rounded-lg text-primary mr-3"
					aria-label="Back"
				>
					<span className="material-symbols-outlined">arrow_back</span>
				</button>
				<h1 className="font-bold tracking-tight text-lg text-primary">Verify Face</h1>
			</header>
			<main className="flex-1 mt-20 mb-10 px-4 md:px-8 max-w-4xl mx-auto w-full">
				<div className="mb-8">
					<h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">
						{result ? "Verification complete" : "Verify Face"}
					</h2>
					<p className="text-on-surface-variant">
						{result
							? "Result is shown below. Reset to verify again."
							: "1:1 verification against an enrolled person by ID."}
					</p>
				</div>

				{!hasHydrated ? (
					<div className="h-40 rounded-xl bg-surface-container-high animate-pulse" />
				) : !canUseDemo ? (
					<DemoSignInPrompt />
				) : (
					<div className="space-y-5">
						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="vf-id">
								Person ID <span className="text-error">*</span>
							</label>
							<input
								id="vf-id"
								type="text"
								required
								value={personId}
								onChange={(e) => setPersonId(e.target.value)}
								placeholder="Enrolled person ID"
								className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-outline text-sm focus:outline-none focus:border-primary/60 transition-colors"
							/>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5">
									Min score {minScore.toFixed(2)}
								</label>
								<input
									type="range"
									min="0.5"
									max="1"
									step="0.01"
									value={minScore}
									onChange={(e) => setMinScore(Number(e.target.value))}
									className="w-full"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5">Search mode</label>
								<select
									value={searchMode}
									onChange={(e) => setSearchMode(e.target.value as "FAST" | "ACCURATE")}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-primary/60"
								>
									<option value="FAST">FAST</option>
									<option value="ACCURATE">ACCURATE</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5">Collection ID</label>
								<input
									type="text"
									value={collectionId}
									onChange={(e) => setCollectionId(e.target.value)}
									placeholder="Optional"
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface placeholder-outline text-sm focus:outline-none focus:border-primary/60"
								/>
							</div>
						</div>
						<div className="space-y-5">
							<DemoChooseOneCallout description="Scan with your camera or upload a photo. Each capture is added to the images for verification." />
							<section aria-labelledby="verify-face-camera-heading">
								<DemoCaptureOptionHeading
									label="A"
									id="verify-face-camera-heading"
									title="Live camera"
									subtitle="Open the camera and capture one face image"
								/>
								<DemoScannerShell>
									<div className="flex min-h-0 flex-1 flex-col">
										<FaceGuidedCamera
											fillFrame
											hideIdleExplainer
											captureSuccessFeedbackMs={750}
											onCapture={({ dataUrl, base64 }) => {
												appendCapturedImage(dataUrl, base64);
											}}
										/>
									</div>
								</DemoScannerShell>
							</section>
							<DemoOrDivider />
							<section aria-labelledby="verify-face-upload-heading">
								<DemoCaptureOptionHeading
									label="B"
									id="verify-face-upload-heading"
									title="Photo from gallery"
									subtitle="Select one or more image files from your device"
								/>
								<DemoUploadImageButton
									onClick={() => fileRef.current?.click()}
									primaryText={images.length ? `${images.length} image(s), add more` : "Upload face images"}
									secondaryText="JPEG or PNG files from your gallery"
									icon="add_photo_alternate"
								/>
							</section>
						</div>
						{previews.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{previews.map((u, i) => (
									<img key={i} src={u} alt="" className="w-20 h-20 object-cover rounded-lg border border-frost" />
								))}
							</div>
						)}
						<div className="flex gap-3">
							<button
								onClick={handleVerify}
								disabled={!personId || !images.length || loading}
								className="flex-1 py-3 bg-primary-cta text-on-primary-container font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
							>
								{loading ? "Verifying…" : "Verify"}
							</button>
						</div>
						<input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
						{error && (
							<div className="px-4 py-3 bg-error-container/20 border border-error/20 rounded-lg flex items-center gap-2 text-sm text-error">
								<span className="material-symbols-outlined text-sm">error_outline</span>
								{error}
							</div>
						)}
						{result && (
							<div className="rounded-2xl bg-surface-container-low border border-primary/20 p-6 space-y-3">
								<div className="flex items-center justify-between">
									<p className="font-bold text-on-surface">Verification result</p>
									<button type="button" onClick={reset} className="text-xs text-primary underline">
										Reset
									</button>
								</div>
								<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
									{JSON.stringify(result, null, 2)}
								</pre>
							</div>
						)}
					</div>
				)}

				{showApiReference ? (
					<details className="mt-10 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 text-left max-w-3xl mx-auto w-full px-4 py-3 group">
						<summary className="cursor-pointer list-none font-bold text-sm text-primary flex items-center justify-between gap-2">
							<span className="flex items-center gap-2">
								<span className="material-symbols-outlined text-lg">menu_book</span>
								API reference: Verify Face (1:1)
							</span>
							<span className="material-symbols-outlined text-outline-variant group-open:rotate-180 transition-transform">
								expand_more
							</span>
						</summary>
						<div className="mt-4 space-y-4 text-sm text-on-surface-variant border-t border-outline-variant/15 pt-4">
							<p>
								Official docs (EN):{" "}
								<a
									href={`${DOCS_BASE}/biometrics/verify-face`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									docs.verifik.co/biometrics/verify-face
								</a>
								. Spanish:{" "}
								<a
									href={`${DOCS_ES_BASE}/verificar-cara`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									docs.verifik.co/verifik-es/verificar-cara
								</a>
								.
							</p>
							<p className="text-xs leading-relaxed">
								Base URL <code className="text-primary">https://api.verifik.co</code>. Send the enrolled person&apos;s MongoDB id in{" "}
								<code className="text-primary">id</code> and one or more raw base64 face images in <code className="text-primary">images</code>{" "}
								(no data URL prefix). Optional <code className="text-primary">collection_id</code> scopes the check.
							</p>
							<div>
								<p className="font-mono text-xs text-on-surface mb-1">POST /v2/face-recognition/verify</p>
								<p className="text-xs leading-relaxed">
									1:1 against a known enrolled person: returns a <code className="text-primary">data.match</code> with score when the
									threshold is met.
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
											<td className="py-2 font-mono text-primary">id</td>
											<td>Yes</td>
											<td>Enrolled person MongoDB id</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">images</td>
											<td>Yes</td>
											<td>Array of base64 face images (same subject)</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">min_score</td>
											<td>Yes</td>
											<td>Match threshold (0.5–1)</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">search_mode</td>
											<td>Yes</td>
											<td>FAST or ACCURATE</td>
										</tr>
										<tr className="align-top">
											<td className="py-2 font-mono text-primary">collection_id</td>
											<td>No</td>
											<td>Optional collection scope</td>
										</tr>
									</tbody>
								</table>
							</div>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{`await verifyFace(
  {
    id: "<personMongoId>",
    images: ["<base64>", "<base64>"],
    min_score: 0.75,
    search_mode: "FAST",
    collection_id: "<optionalCollectionMongoId>",
  },
  accessToken,
);`}
							</pre>
							<ul className="list-disc pl-5 space-y-1 text-xs">
								<li>
									This demo uses <code className="text-primary">verifyFace</code> from{" "}
									<code className="text-primary">@humanauthn/api-client</code> with your session token.
								</li>
								<li>
									Responses include <code className="text-primary">data.match</code> and a <code className="text-primary">signature</code>{" "}
									block when enabled.
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
