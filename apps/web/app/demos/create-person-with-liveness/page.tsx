"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPersonWithLiveness, fileToBase64 } from "@humanauthn/api-client";
import { useAuthHydration } from "../../hooks/useAuthHydration";
import { useAuthStore } from "../../store/authStore";
import DemoCaptureOptionHeading from "../../components/demos/DemoCaptureOptionHeading";
import DemoChooseOneCallout from "../../components/demos/DemoChooseOneCallout";
import DemoOrDivider from "../../components/demos/DemoOrDivider";
import DemoScannerShell from "../../components/demos/DemoScannerShell";
import DemoUploadImageButton from "../../components/demos/DemoUploadImageButton";
import FaceGuidedCamera from "../../components/demos/FaceGuidedCameraLoader";
import DemoRelatedDocsSection, { type DemoRelatedDocItem } from "../../components/demos/DemoRelatedDocsSection";
import CreatePersonAlreadyExistsResult from "../../components/demos/CreatePersonAlreadyExistsResult";
import DemoSignInPrompt from "../DemoSignInPrompt";
import ElectronAwareAppHeader from "../../components/layout/ElectronAwareAppHeader";


const DOCS_BASE = "https://docs.verifik.co";
const DOCS_ES_BASE = "https://docs.verifik.co/verifik-es";

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
		href: `${DOCS_BASE}/resources/create-a-person-with-liveness/`,
		title: "Create Person with Liveness",
		description: "Liveness, duplicate search, and enroll in one request.",
		badge: "POST",
	},
	{
		href: "/demos/update-person",
		title: "Update Person (demo)",
		description: "Change profile or collections for an existing person id.",
		badge: "Demo",
	},
	{
		href: "/demos/delete-person",
		title: "Delete Person (demo)",
		description: "Full delete or remove from a collection only.",
		badge: "Demo",
	},
];

type Step = "form" | "processing" | "result" | "conflict";

function isPersonAlreadySetError(res: { error?: string; code?: string }): boolean {
	return res.error === "person_already_set" || (res.code === "PreconditionFailed" && res.error === "person_already_set");
}

export default function CreatePersonWithLivenessPage() {
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();

	const [step, setStep] = useState<Step>("form");
	const [name, setName] = useState("");
	const [gender, setGender] = useState<"M" | "F">("M");
	const [dob, setDob] = useState("");
	const [collectionId, setCollectionId] = useState("");
	const [nationality, setNationality] = useState("");
	const [livenessMinScore, setLivenessMinScore] = useState(0.65);
	const [minScore, setMinScore] = useState(0.8);
	const [searchMode, setSearchMode] = useState<"FAST" | "ACCURATE">("FAST");
	const [images, setImages] = useState<string[]>([]);
	const [previews, setPreviews] = useState<string[]>([]);
	const [result, setResult] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	const canUseDemo = hasHydrated && isAuthenticated;
	const showApiReference = step !== "result" && step !== "conflict";

	const appendCapturedImage = (preview: string, b64: string) => {
		setImages((p) => [...p, b64]);
		setPreviews((p) => [...p, preview]);
	};

	const handleFiles = async (files: FileList | null) => {
		if (!files?.length) return;
		const b64s = await Promise.all(Array.from(files).map(fileToBase64));
		const urls = Array.from(files).map((f) => URL.createObjectURL(f));
		setImages((p) => [...p, ...b64s]);
		setPreviews((p) => [...p, ...urls]);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const token = useAuthStore.getState().token;
		if (!token || !images.length) return;

		setStep("processing");
		setError(null);

		const res = await createPersonWithLiveness(
			{
				name,
				images,
				gender,
				date_of_birth: dob,
				collection_id: collectionId,
				liveness_min_score: livenessMinScore,
				min_score: minScore,
				search_mode: searchMode,
				nationality: nationality || undefined,
			},
			token,
		);

		if (res.error) {
			if (isPersonAlreadySetError(res)) {
				setStep("conflict");
				return;
			}
			setError(res.error);
			setStep("form");
			return;
		}
		setResult(res.data as Record<string, unknown>);
		setStep("result");
	};

	const reset = () => {
		setStep("form");
		setName("");
		setGender("M");
		setDob("");
		setCollectionId("");
		setNationality("");
		setLivenessMinScore(0.65);
		setMinScore(0.8);
		setSearchMode("FAST");
		setImages([]);
		setPreviews([]);
		setResult(null);
		setError(null);
	};

	const backToFormFromConflict = () => {
		setStep("form");
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
				<h1 className="font-bold tracking-tight text-lg text-primary">Create Person with Liveness</h1>
			</ElectronAwareAppHeader>

			<main className="flex-1 mt-20 mb-10 px-4 md:px-8 max-w-4xl mx-auto w-full">
				<div className="mb-8">
					<h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">
						{step === "result"
							? "Person Enrolled"
							: step === "conflict"
								? "Already enrolled"
								: "Create Person with Liveness"}
					</h2>
					<p className="text-on-surface-variant">
						{step === "result"
							? "Person has been enrolled with liveness and search checks."
							: step === "conflict"
								? "This face matches an existing person. Review the images you used and choose a next step."
								: "Enroll + liveness check + deduplication search in one call."}
					</p>
				</div>

				{!hasHydrated ? (
					<div className="h-60 rounded-xl bg-surface-container-high animate-pulse" />
				) : !canUseDemo ? (
					<DemoSignInPrompt />
				) : step === "form" ? (
					<form onSubmit={handleSubmit} className="space-y-5">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="plv-name">
									Full name <span className="text-error">*</span>
								</label>
								<input
									id="plv-name"
									type="text"
									required
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Jane Doe"
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:border-primary/60 transition-colors"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="plv-gender">
									Gender <span className="text-error">*</span>
								</label>
								<select
									id="plv-gender"
									value={gender}
									onChange={(e) => setGender(e.target.value as "M" | "F")}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-primary/60 transition-colors"
								>
									<option value="M">Male</option>
									<option value="F">Female</option>
								</select>
							</div>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="plv-dob">
									Date of birth <span className="text-error">*</span>
								</label>
								<input
									id="plv-dob"
									type="date"
									required
									value={dob}
									onChange={(e) => setDob(e.target.value)}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-primary/60 transition-colors"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="plv-nat">
									Nationality
								</label>
								<input
									id="plv-nat"
									type="text"
									value={nationality}
									onChange={(e) => setNationality(e.target.value)}
									placeholder="CO"
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:border-primary/60 transition-colors"
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="plv-col">
								Collection ID <span className="text-error">*</span>
							</label>
							<input
								id="plv-col"
								type="text"
								required
								value={collectionId}
								onChange={(e) => setCollectionId(e.target.value)}
								placeholder="Collection unique _id"
								className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:border-primary/60 transition-colors"
							/>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
						</div>
						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5">
								Face images <span className="text-error">*</span>
							</label>
							<div className="mb-3 space-y-5">
								<DemoChooseOneCallout description="Scan with your camera or upload a photo. Each capture is added to the enrolled face images." />
								<section aria-labelledby="create-person-live-camera-heading">
									<DemoCaptureOptionHeading
										label="A"
										id="create-person-live-camera-heading"
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
								<section aria-labelledby="create-person-live-upload-heading">
									<DemoCaptureOptionHeading
										label="B"
										id="create-person-live-upload-heading"
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
								<div className="flex flex-wrap gap-2 mb-3">
									{previews.map((u, i) => (
										<img key={i} src={u} alt="" className="w-20 h-20 object-cover rounded-lg border border-frost" />
									))}
								</div>
							)}
							<input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
						</div>
						{error && (
							<div className="px-4 py-3 bg-error-container/20 border border-error/20 rounded-lg flex items-center gap-2 text-sm text-error">
								<span className="material-symbols-outlined text-sm">error_outline</span>
								{error}
							</div>
						)}
						<button
							type="submit"
							disabled={!images.length}
							className="w-full py-3 bg-primary-cta text-on-primary-container font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
						>
							Enroll with Liveness
						</button>
					</form>
				) : step === "processing" ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<p className="text-on-surface font-semibold">Enrolling and checking liveness…</p>
					</div>
				) : step === "conflict" ? (
					<CreatePersonAlreadyExistsResult
						previews={previews}
						onEditForm={backToFormFromConflict}
						onBackToDemos={() => router.push("/home")}
					/>
				) : (
					<div className="space-y-4">
						<div className="rounded-2xl bg-surface-container-low border border-primary/20 p-6">
							<div className="flex items-center gap-3 mb-4">
								<span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
								<p className="font-bold text-on-surface">Person enrolled with liveness</p>
							</div>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{JSON.stringify(result, null, 2)}
							</pre>
						</div>
						<div className="flex gap-3">
							<button
								onClick={reset}
								className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg hover:bg-surface-container-high transition-all active:scale-95 ghost-border"
							>
								Try Again
							</button>
							<button
								onClick={() => router.push("/home")}
								className="flex-1 py-3 bg-primary-cta text-on-primary-container font-semibold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all"
							>
								Back to Demos
							</button>
						</div>
					</div>
				)}

				{showApiReference ? (
					<details className="mt-10 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 text-left max-w-3xl mx-auto w-full px-4 py-3 group">
						<summary className="cursor-pointer list-none font-bold text-sm text-primary flex items-center justify-between gap-2">
							<span className="flex items-center gap-2">
								<span className="material-symbols-outlined text-lg">menu_book</span>
								API reference: Create Person with Liveness
							</span>
							<span className="material-symbols-outlined text-on-surface-variant/70 group-open:rotate-180 transition-transform">
								expand_more
							</span>
						</summary>
						<div className="mt-4 space-y-4 text-sm text-on-surface-variant border-t border-outline-variant/15 pt-4">
							<p>
								Official docs (English):{" "}
								<a
									href={`${DOCS_BASE}/resources/create-a-person-with-liveness/`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									docs.verifik.co/resources/create-a-person-with-liveness
								</a>
							</p>
							<p>
								Documentación (Español):{" "}
								<a
									href={`${DOCS_ES_BASE}/resources/personas/crear-una-persona-con-deteccion-de-vida/`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									docs.verifik.co/verifik-es/resources/personas/crear-una-persona-con-deteccion-de-vida
								</a>
							</p>
							<p className="text-xs leading-relaxed">
								Base URL <code className="text-primary">https://api.verifik.co</code>. Send JSON with profile fields, a single{" "}
								<code className="text-primary">collection_id</code> (collection <code className="text-primary">_id</code>), liveness and search
								thresholds, and at least one base64 face image per entry in <code className="text-primary">images</code> (no data URL prefix).
							</p>
							<div>
								<p className="font-mono text-xs text-on-surface mb-1">POST /v2/face-recognition/persons/search-live-face</p>
								<p className="text-xs leading-relaxed">
									Runs liveness on the submitted face(s), searches for similar enrollments, then creates or updates a person in the target
									collection.
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
											<td className="py-2 font-mono text-primary">name</td>
											<td>Yes</td>
											<td>Display name</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">images</td>
											<td>Yes</td>
											<td>Array of base64 face images (raw base64, not data URLs)</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">gender</td>
											<td>Yes</td>
											<td>M or F</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">date_of_birth</td>
											<td>Yes</td>
											<td>YYYY-MM-DD</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">collection_id</td>
											<td>Yes</td>
											<td>Single collection unique id</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">liveness_min_score</td>
											<td>Yes</td>
											<td>0.5–1</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">min_score</td>
											<td>Yes</td>
											<td>Internal search threshold, 0.5–1</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">search_mode</td>
											<td>Yes</td>
											<td>FAST or ACCURATE</td>
										</tr>
										<tr className="align-top">
											<td className="py-2 font-mono text-primary">nationality</td>
											<td>No</td>
											<td>Optional</td>
										</tr>
									</tbody>
								</table>
							</div>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{`await fetch("https://api.verifik.co/v2/face-recognition/persons/search-live-face", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({
    name: "Jane Doe",
    gender: "F",
    date_of_birth: "1990-01-15",
    collection_id: "<collectionMongoId>",
    liveness_min_score: 0.65,
    min_score: 0.8,
    search_mode: "FAST",
    nationality: "CO",
    images: ["<base64>", "<base64>"],
  }),
});`}
							</pre>
							<ul className="list-disc pl-5 space-y-1 text-xs">
								<li>
									This demo uses <code className="text-primary">createPersonWithLiveness</code> from{" "}
									<code className="text-primary">@humanauthn/api-client</code> with your session token.
								</li>
								<li>
									Responses may include a <code className="text-primary">signature</code> block alongside <code className="text-primary">data</code>{" "}
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
