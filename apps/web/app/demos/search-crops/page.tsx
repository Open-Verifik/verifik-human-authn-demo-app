"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchCrops, fileToBase64 } from "@humanauthn/api-client";
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
import ElectronAwareAppHeader from "../../components/layout/ElectronAwareAppHeader";


const DOCS_BASE = "https://docs.verifik.co";

const RELATED_DOCS: DemoRelatedDocItem[] = [
	{
		href: `${DOCS_BASE}/biometrics/search`,
		title: "Face Search (1:N)",
		description: "Standard gallery search with full face images; lower min_score floor (0.2–1).",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/biometrics/search-live-face`,
		title: "Face Search 1:N (Live)",
		description: "Liveness on the probe image, then 1:N search.",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/biometrics/search-active-user`,
		title: "Face Search 1:N (Active User)",
		description: "1:N search for active-session flows without liveness on the probe.",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/biometrics/verify-face`,
		title: "Verify Face (1:1)",
		description: "Match probe images against a known enrolled person id.",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/verifik-biometrics-apis/liveness/face-detection`,
		title: "Face Detection",
		description: "Detect faces in an image to obtain crops before searching.",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/resources/list-all-persons`,
		title: "List All Persons",
		description: "Inspect enrolled persons for your client.",
		badge: "GET",
	},
];

export default function SearchCropsPage() {
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();

	const [images, setImages] = useState<string[]>([]);
	const [previews, setPreviews] = useState<string[]>([]);
	const [minScore, setMinScore] = useState(0.75);
	const [searchMode, setSearchMode] = useState<"FAST" | "ACCURATE">("FAST");
	const [collectionId, setCollectionId] = useState("");
	const [maxResults, setMaxResults] = useState("");
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

	const handleSearch = async () => {
		const token = useAuthStore.getState().token;
		if (!token || !images.length) return;
		setLoading(true);
		setError(null);
		setResult(null);
		const maxParsed = maxResults.trim() === "" ? undefined : Number.parseInt(maxResults, 10);
		const res = await searchCrops(
			{
				images,
				min_score: minScore,
				search_mode: searchMode,
				collection_id: collectionId || undefined,
				...(maxParsed !== undefined && !Number.isNaN(maxParsed) ? { max_results: maxParsed } : {}),
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
		setImages([]);
		setPreviews([]);
		setCollectionId("");
		setMaxResults("");
		setResult(null);
		setError(null);
	};

	return (
		<div className="min-h-screen bg-surface flex flex-col">
			<ElectronAwareAppHeader>
				<button
					onClick={() => router.back()}
					className="hover:bg-surface-container transition-colors p-1.5 rounded-lg text-primary mr-3"
					aria-label="Back"
				>
					<span className="material-symbols-outlined">arrow_back</span>
				</button>
				<h1 className="font-bold tracking-tight text-lg text-primary">Search Crops</h1>
			</ElectronAwareAppHeader>
			<main className="flex-1 mt-20 mb-10 px-4 md:px-8 max-w-4xl mx-auto w-full">
				<div className="mb-8">
					<h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">
						{result ? "Search complete" : "Search Crops"}
					</h2>
					<p className="text-on-surface-variant">
						{result
							? "Matches are shown below. Reset to run another search."
							: "1:N search using face crops (small regions). min_score must be between 0.5 and 1."}
					</p>
				</div>

				{!hasHydrated ? (
					<div className="h-40 rounded-xl bg-surface-container-high animate-pulse" />
				) : !canUseDemo ? (
					<DemoSignInPrompt />
				) : (
					<div className="space-y-5">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:border-primary/60"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5">Max results</label>
								<input
									type="text"
									inputMode="numeric"
									value={maxResults}
									onChange={(e) => setMaxResults(e.target.value.replace(/\D/g, ""))}
									placeholder="Optional"
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:border-primary/60"
								/>
							</div>
						</div>
						<div className="space-y-5">
							<DemoChooseOneCallout description="Scan with your camera or upload photos. Each capture is added as a face crop for 1:N search." />
							<section aria-labelledby="search-crops-camera-heading">
								<DemoCaptureOptionHeading
									label="A"
									id="search-crops-camera-heading"
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
							<section aria-labelledby="search-crops-upload-heading">
								<DemoCaptureOptionHeading
									label="B"
									id="search-crops-upload-heading"
									title="Photo from gallery"
									subtitle="Select one or more crop images from your device"
								/>
								<DemoUploadImageButton
									onClick={() => fileRef.current?.click()}
									primaryText={images.length ? `${images.length} crop(s), add more` : "Upload face crops"}
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
								onClick={handleSearch}
								disabled={!images.length || loading}
								className="flex-1 py-3 bg-primary-cta text-on-primary-container font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
							>
								{loading ? "Searching…" : "Search"}
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
									<p className="font-bold text-on-surface">Search results</p>
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
								API reference: Face Search 1:N (Crops)
							</span>
							<span className="material-symbols-outlined text-on-surface-variant/70 group-open:rotate-180 transition-transform">
								expand_more
							</span>
						</summary>
						<div className="mt-4 space-y-4 text-sm text-on-surface-variant border-t border-outline-variant/15 pt-4">
							<p>
								Official docs:{" "}
								<a
									href={`${DOCS_BASE}/biometrics/search-crops`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									docs.verifik.co/biometrics/search-crops
								</a>{" "}
								(1:N search for face crops; <code className="text-primary">min_score</code> is <strong>0.5–1</strong>, unlike standard Face
								Search).
							</p>
							<p className="text-xs leading-relaxed">
								Base URL <code className="text-primary">https://api.verifik.co</code>. Send one or more entries in{" "}
								<code className="text-primary">images</code> as raw base64 or HTTPS URLs to images (the API may fetch URLs server-side).
								Optionally set <code className="text-primary">collection_id</code> and <code className="text-primary">max_results</code>.
							</p>
							<div>
								<p className="font-mono text-xs text-on-surface mb-1">POST /v2/face-recognition/search/crops</p>
								<p className="text-xs leading-relaxed">
									Returns ranked candidate persons in <code className="text-primary">data</code>, same general shape as{" "}
									<code className="text-primary">/face-recognition/search</code>.
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
											<td className="py-2 font-mono text-primary">images</td>
											<td>Yes</td>
											<td>Face crops (base64 and/or HTTPS URLs), same subject</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">min_score</td>
											<td>Yes</td>
											<td>0.5–1</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">search_mode</td>
											<td>Yes</td>
											<td>FAST or ACCURATE</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">collection_id</td>
											<td>No</td>
											<td>Limit search to one collection</td>
										</tr>
										<tr className="align-top">
											<td className="py-2 font-mono text-primary">max_results</td>
											<td>No</td>
											<td>Cap on returned matches</td>
										</tr>
									</tbody>
								</table>
							</div>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{`await searchCrops(
  {
    images: ["<base64>", "<base64>"],
    min_score: 0.75,
    search_mode: "FAST",
    collection_id: "<optionalCollectionMongoId>",
    max_results: 10,
  },
  accessToken,
);`}
							</pre>
							<ul className="list-disc pl-5 space-y-1 text-xs">
								<li>
									This demo uses <code className="text-primary">searchCrops</code> from{" "}
									<code className="text-primary">@humanauthn/api-client</code> with your session token.
								</li>
								<li>
									Responses typically include ranked matches and may include a <code className="text-primary">signature</code> block
									depending on environment.
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
