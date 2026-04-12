"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchLivePerson, fileToBase64 } from "@humanauthn/api-client";
import { useAuthHydration } from "../../hooks/useAuthHydration";
import { useAuthStore } from "../../store/authStore";
import DemoCaptureOptionHeading from "../../components/demos/DemoCaptureOptionHeading";
import DemoChooseOneCallout from "../../components/demos/DemoChooseOneCallout";
import DemoOrDivider from "../../components/demos/DemoOrDivider";
import DemoScannerShell from "../../components/demos/DemoScannerShell";
import DemoUploadImageButton from "../../components/demos/DemoUploadImageButton";
import FaceGuidedCamera from "../../components/demos/FaceGuidedCameraLoader";
import DemoRelatedDocsSection, { type DemoRelatedDocItem } from "../../components/demos/DemoRelatedDocsSection";
import SearchLivePersonResult from "../../components/demos/SearchLivePersonResult";
import DemoSignInPrompt from "../DemoSignInPrompt";
import ElectronAwareAppHeader from "../../components/layout/ElectronAwareAppHeader";


const DOCS_BASE = "https://docs.verifik.co";

const RELATED_DOCS: DemoRelatedDocItem[] = [
	{
		href: `${DOCS_BASE}/resources/the-person-object`,
		title: "The Person Object",
		description: "Fields and structure of a face recognition person record.",
		badge: "Object",
	},
	{
		href: `${DOCS_BASE}/resources/list-all-persons`,
		title: "List All Persons",
		description: "Persons for your client, with optional filters.",
		badge: "GET",
	},
	{
		href: `${DOCS_BASE}/resources/retrieve-a-person`,
		title: "Retrieve a Person",
		description: "A single person by id.",
		badge: "GET",
	},
	{
		href: `${DOCS_BASE}/resources/persons/update-a-person`,
		title: "Update a Person",
		description: "Profile, images, collections, and more.",
		badge: "PUT",
	},
	{
		href: `${DOCS_BASE}/resources/persons/delete-a-person`,
		title: "Delete a Person",
		description: "Remove a person record by id.",
		badge: "DELETE",
	},
	{
		href: `${DOCS_BASE}/biometrics/search-live-face`,
		title: "Face Search 1:N (Live)",
		description: "Liveness on the probe image, then 1:N search for matches.",
		badge: "POST",
	},
];

export default function SearchLivePersonPage() {
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();

	const [image, setImage] = useState<string | null>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [livenessMinScore, setLivenessMinScore] = useState(0.65);
	const [minScore, setMinScore] = useState(0.75);
	const [searchMode, setSearchMode] = useState<"FAST" | "ACCURATE">("FAST");
	const [collectionId, setCollectionId] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [previewHighlighted, setPreviewHighlighted] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);
	const previewHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const canUseDemo = hasHydrated && isAuthenticated;
	const showApiReference = result === null;

	const pulsePreview = () => {
		if (previewHighlightTimeoutRef.current) {
			clearTimeout(previewHighlightTimeoutRef.current);
		}
		setPreviewHighlighted(true);
		previewHighlightTimeoutRef.current = setTimeout(() => {
			setPreviewHighlighted(false);
			previewHighlightTimeoutRef.current = null;
		}, 2200);
	};

	const handleFile = async (files: FileList | null) => {
		if (!files?.[0]) return;
		const b64 = await fileToBase64(files[0]);
		setImage(b64);
		setPreview(URL.createObjectURL(files[0]));
		pulsePreview();
	};

	const handleSearch = async () => {
		const token = useAuthStore.getState().token;
		if (!token || !image) return;
		setLoading(true);
		setError(null);
		setResult(null);
		const res = await searchLivePerson(
			{
				image,
				os: "DESKTOP",
				liveness_min_score: livenessMinScore,
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
		if (previewHighlightTimeoutRef.current) {
			clearTimeout(previewHighlightTimeoutRef.current);
			previewHighlightTimeoutRef.current = null;
		}
		setImage(null);
		setPreview(null);
		setResult(null);
		setError(null);
		setPreviewHighlighted(false);
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
				<h1 className="font-bold tracking-tight text-lg text-primary">Search Live Person</h1>
			</ElectronAwareAppHeader>
			<main className="flex-1 mt-20 mb-10 px-4 md:px-8 max-w-4xl mx-auto w-full">
				<div className="mb-8">
					<h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">
						{result ? "Search complete" : "Search Live Person"}
					</h2>
					<p className="text-on-surface-variant">
						{result
							? "Results are shown below. Reset to run another live search."
							: "Liveness on one probe image, then 1:N face search (live)."}
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
									Liveness min {livenessMinScore.toFixed(2)}
								</label>
								<input
									type="range"
									min="0.5"
									max="1"
									step="0.01"
									value={livenessMinScore}
									onChange={(e) => setLivenessMinScore(Number(e.target.value))}
									className="w-full"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5">Min score {minScore.toFixed(2)}</label>
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
						</div>
						{!image ? (
							<div className="space-y-5">
								<DemoChooseOneCallout description="Scan with your camera or upload a photo. Either option works for this demo." />
								<section aria-labelledby="search-live-person-camera-heading">
									<DemoCaptureOptionHeading
										label="A"
										id="search-live-person-camera-heading"
										title="Live camera"
										subtitle="Open the camera and align your face in the frame"
									/>
									<DemoScannerShell>
										<div className="flex min-h-0 flex-1 flex-col">
											<FaceGuidedCamera
												fillFrame
												hideIdleExplainer
												disabled={loading}
												captureSuccessFeedbackMs={750}
												onCapture={({ dataUrl, base64 }) => {
													setPreview(dataUrl);
													setImage(base64);
													pulsePreview();
												}}
											/>
										</div>
									</DemoScannerShell>
								</section>
								<DemoOrDivider />
								<section aria-labelledby="search-live-person-upload-heading">
									<DemoCaptureOptionHeading
										label="B"
										id="search-live-person-upload-heading"
										title="Photo from gallery"
										subtitle="Select an image file from your device instead"
									/>
									<DemoUploadImageButton
										id="btn-upload-search-live-person"
										onClick={() => fileRef.current?.click()}
										primaryText="Upload image"
										secondaryText="JPEG or PNG from your gallery"
									/>
								</section>
							</div>
						) : null}
						{preview && image ? (
							<div
								className={`overflow-hidden rounded-xl border transition-all duration-300 ${
									previewHighlighted
										? "border-emerald-400/50 ring-4 ring-emerald-400/20 shadow-[0_0_0_6px_rgba(74,222,128,0.12)]"
										: "border-frost"
								}`}
							>
								<img src={preview} alt="Captured" className="w-full aspect-video object-cover" />
							</div>
						) : null}
						<div className="flex flex-wrap gap-3">
							{image && (
								<button
									type="button"
									onClick={handleSearch}
									disabled={loading}
									className="flex-1 py-3 bg-primary-cta text-on-primary-container font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
								>
									{loading ? "Searching…" : "Search Live"}
								</button>
							)}
						</div>
						<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files)} />
						{error && (
							<div className="px-4 py-3 bg-error-container/20 border border-error/20 rounded-lg flex items-center gap-2 text-sm text-error">
								<span className="material-symbols-outlined text-sm">error_outline</span>
								{error}
							</div>
						)}
						{result && (
							<SearchLivePersonResult result={result} onReset={reset} />
						)}
					</div>
				)}

				{showApiReference ? (
					<details className="mt-10 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 text-left max-w-3xl mx-auto w-full px-4 py-3 group">
						<summary className="cursor-pointer list-none font-bold text-sm text-primary flex items-center justify-between gap-2">
							<span className="flex items-center gap-2">
								<span className="material-symbols-outlined text-lg">menu_book</span>
								API reference: Face Search 1:N (Live)
							</span>
							<span className="material-symbols-outlined text-on-surface-variant/70 group-open:rotate-180 transition-transform">
								expand_more
							</span>
						</summary>
						<div className="mt-4 space-y-4 text-sm text-on-surface-variant border-t border-outline-variant/15 pt-4">
							<p>
								Official docs:{" "}
								<a
									href={`${DOCS_BASE}/biometrics/search-live-face`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									docs.verifik.co/biometrics/search-live-face
								</a>{" "}
								(liveness on the probe image, then 1:N search).
							</p>
							<p className="text-xs leading-relaxed">
								Base URL <code className="text-primary">https://api.verifik.co</code>. Send a single raw base64 probe in{" "}
								<code className="text-primary">image</code> (no data URL prefix), required <code className="text-primary">os</code>{" "}
								(<code className="text-primary">ANDROID</code>, <code className="text-primary">IOS</code>, or{" "}
								<code className="text-primary">DESKTOP</code>), liveness and match thresholds, and <code className="text-primary">search_mode</code>.
								This demo uses <code className="text-primary">DESKTOP</code>.
							</p>
							<div>
								<p className="font-mono text-xs text-on-surface mb-1">POST /v2/face-recognition/search-live-face</p>
								<p className="text-xs leading-relaxed">
									Runs anti-spoofing / liveness first; if it passes, performs similarity search against enrolled faces.
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
											<td className="py-2 font-mono text-primary">image</td>
											<td>Yes</td>
											<td>Single base64 probe image</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">os</td>
											<td>Yes</td>
											<td>ANDROID, IOS, or DESKTOP</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">liveness_min_score</td>
											<td>Yes</td>
											<td>Liveness threshold (0.5–1.0)</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">min_score</td>
											<td>Yes</td>
											<td>Match threshold (0.5–1.0 per docs)</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">search_mode</td>
											<td>Yes</td>
											<td>FAST or ACCURATE</td>
										</tr>
										<tr className="align-top">
											<td className="py-2 font-mono text-primary">collection_id</td>
											<td>No</td>
											<td>Scope search to one collection</td>
										</tr>
									</tbody>
								</table>
							</div>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{`await fetch("https://api.verifik.co/v2/face-recognition/search-live-face", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({
    image: "<base64>",
    os: "DESKTOP",
    liveness_min_score: 0.65,
    min_score: 0.75,
    search_mode: "FAST",
    collection_id: "<optionalCollectionMongoId>",
  }),
});`}
							</pre>
							<ul className="list-disc pl-5 space-y-1 text-xs">
								<li>
									This demo uses <code className="text-primary">searchLivePerson</code> from{" "}
									<code className="text-primary">@humanauthn/api-client</code> with your session token.
								</li>
								<li>
									Failures below the liveness threshold may return an error response (see API docs for error shapes).
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
