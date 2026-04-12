"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchPersons, fileToBase64 } from "@humanauthn/api-client";
import { useAuthHydration } from "../../hooks/useAuthHydration";
import { useAuthStore } from "../../store/authStore";
import DemoCaptureOptionHeading from "../../components/demos/DemoCaptureOptionHeading";
import DemoChooseOneCallout from "../../components/demos/DemoChooseOneCallout";
import DemoOrDivider from "../../components/demos/DemoOrDivider";
import DemoScannerShell from "../../components/demos/DemoScannerShell";
import DemoUploadImageButton from "../../components/demos/DemoUploadImageButton";
import FaceGuidedCamera from "../../components/demos/FaceGuidedCameraLoader";
import DemoRelatedDocsSection, { type DemoRelatedDocItem } from "../../components/demos/DemoRelatedDocsSection";
import SearchPersonResult from "../../components/demos/SearchPersonResult";
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
		href: `${DOCS_BASE}/biometrics/search`,
		title: "Face Search (1:N)",
		description: "Search by face image against your collections; ranked by similarity.",
		badge: "POST",
	},
];

export default function SearchPersonPage() {
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();

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

	const handleSearch = async () => {
		const token = useAuthStore.getState().token;
		if (!token || !images.length) return;
		setLoading(true);
		setError(null);
		setResult(null);
		const res = await searchPersons(
			{ images, min_score: minScore, search_mode: searchMode, collection_id: collectionId || undefined },
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
				<h1 className="font-bold tracking-tight text-lg text-primary">Search Person</h1>
			</ElectronAwareAppHeader>
			<main className="flex-1 mt-20 mb-10 px-4 md:px-8 max-w-4xl mx-auto w-full">
				<div className="mb-8">
					<h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">
						{result ? "Search complete" : "Search Person"}
					</h2>
					<p className="text-on-surface-variant">
						{result
							? "Matches are shown below. Reset to run another search."
							: "Upload face images to search enrolled persons by similarity (1:N)."}
					</p>
				</div>

				{!hasHydrated ? (
					<div className="h-40 rounded-xl bg-surface-container-high animate-pulse" />
				) : !canUseDemo ? (
					<DemoSignInPrompt />
				) : (
					<div className="space-y-5">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5">
									Min score {minScore.toFixed(2)}
								</label>
								<input
									type="range"
									min="0.2"
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
						<div className="space-y-5">
							<DemoChooseOneCallout description="Scan with your camera or upload a photo. Each capture is added to the images for search." />
							<section aria-labelledby="search-person-camera-heading">
								<DemoCaptureOptionHeading
									label="A"
									id="search-person-camera-heading"
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
							<section aria-labelledby="search-person-upload-heading">
								<DemoCaptureOptionHeading
									label="B"
									id="search-person-upload-heading"
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
							<SearchPersonResult result={result} onReset={reset} />
						)}
					</div>
				)}

				{showApiReference ? (
					<details className="mt-10 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 text-left max-w-3xl mx-auto w-full px-4 py-3 group">
						<summary className="cursor-pointer list-none font-bold text-sm text-primary flex items-center justify-between gap-2">
							<span className="flex items-center gap-2">
								<span className="material-symbols-outlined text-lg">menu_book</span>
								API reference: Face Search (1:N)
							</span>
							<span className="material-symbols-outlined text-on-surface-variant/70 group-open:rotate-180 transition-transform">
								expand_more
							</span>
						</summary>
						<div className="mt-4 space-y-4 text-sm text-on-surface-variant border-t border-outline-variant/15 pt-4">
							<p>
								Official docs:{" "}
								<a
									href={`${DOCS_BASE}/biometrics/search`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									docs.verifik.co/biometrics/search
								</a>{" "}
								(Face Search — search by face image against enrolled persons).
							</p>
							<p className="text-xs leading-relaxed">
								Base URL <code className="text-primary">https://api.verifik.co</code>. Send one or more raw base64 images of the same
								subject in <code className="text-primary">images</code> (no data URL prefix). Optionally scope with{" "}
								<code className="text-primary">collection_id</code>. The public docs recommend 1–3 images for better recall.
							</p>
							<div>
								<p className="font-mono text-xs text-on-surface mb-1">POST /v2/face-recognition/search</p>
								<p className="text-xs leading-relaxed">
									1:N identification: returns candidate persons ranked by similarity score.
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
											<td>Array of base64 face images (same person; up to ~3 suggested)</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">min_score</td>
											<td>Yes</td>
											<td>Match threshold (e.g. 0.2–1.0)</td>
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
											<td>Cap on returned matches (API default applies if omitted)</td>
										</tr>
									</tbody>
								</table>
							</div>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{`await fetch("https://api.verifik.co/v2/face-recognition/search", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({
    images: ["<base64>", "<base64>"],
    collection_id: "<optionalCollectionMongoId>",
    min_score: 0.75,
    search_mode: "FAST",
  }),
});`}
							</pre>
							<ul className="list-disc pl-5 space-y-1 text-xs">
								<li>
									This demo uses <code className="text-primary">searchPersons</code> from{" "}
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
