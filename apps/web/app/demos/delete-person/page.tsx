"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
	deletePerson,
	getPerson,
	getPersons,
	listCollections,
	mapPersonDocsToListItems,
	normalizePersonsListPayload,
	type FaceCollectionListItem,
	type PersonListItem,
} from "@humanauthn/api-client";
import { useAuthHydration } from "../../hooks/useAuthHydration";
import { useAuthStore } from "../../store/authStore";
import DemoRelatedDocsSection, { type DemoRelatedDocItem } from "../../components/demos/DemoRelatedDocsSection";
import { PersonSingleSelect } from "../../components/demos/PersonSingleSelect";
import { CollectionSingleSelect } from "../../components/demos/CollectionSingleSelect";
import CreatePersonResult from "../../components/demos/CreatePersonResult";
import DemoConfirmModal from "../../components/demos/DemoConfirmModal";
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
		description: "Retrieve a list of all persons in the facial recognition system.",
		badge: "GET",
	},
	{
		href: `${DOCS_BASE}/resources/retrieve-a-person`,
		title: "Retrieve a Person",
		description: "Retrieve a specific person record using its unique identifier.",
		badge: "GET",
	},
	{
		href: `${DOCS_BASE}/resources/persons/delete-a-person`,
		title: "Delete a Person",
		description: "Delete a person record from the facial recognition system.",
		badge: "DELETE",
	},
	{
		href: `${DOCS_BASE}/resources/create-a-person`,
		title: "Create a Person",
		description: "Create a new person in the facial recognition system.",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/resources/create-a-person-with-liveness`,
		title: "Create a Person with Liveness",
		description: "Enroll with liveness, duplicate search, and optional merge.",
		badge: "POST",
	},
	{
		href: `${DOCS_BASE}/resources/persons/update-a-person`,
		title: "Update a Person",
		description: "Profile, images, collections, and more.",
		badge: "PUT",
	},
	{
		href: `${DOCS_BASE}/resources/persons`,
		title: "Persons",
		description: "Overview of person records and biometric data in your project.",
		badge: "Object",
	},
];

type DeleteMode = "full" | "collection";
type Step = "form" | "processing" | "result";

function readPersonPayload(body: unknown): Record<string, unknown> | null {
	if (!body || typeof body !== "object" || Array.isArray(body)) return null;
	const envelope = body as Record<string, unknown>;
	const inner = envelope.data;
	if (inner && typeof inner === "object" && !Array.isArray(inner)) {
		return inner as Record<string, unknown>;
	}
	return null;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === "object" && !Array.isArray(v);
}

function redactThumbnailsForDebug(value: unknown): unknown {
	if (value === null || typeof value !== "object") return value;
	if (Array.isArray(value)) return value.map(redactThumbnailsForDebug);
	const o = value as Record<string, unknown>;
	const next: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(o)) {
		if (k === "thumbnail" && typeof v === "string" && v.length > 64) {
			next[k] = `[base64 image, ${v.length} characters]`;
		} else {
			next[k] = redactThumbnailsForDebug(v) as unknown;
		}
	}
	return next;
}

export default function DeletePersonPage() {
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();

	const [step, setStep] = useState<Step>("form");
	const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
	const [personsLoading, setPersonsLoading] = useState(false);
	const [personsError, setPersonsError] = useState<string | null>(null);
	const [personRows, setPersonRows] = useState<PersonListItem[]>([]);
	const [mode, setMode] = useState<DeleteMode>("full");
	const [selectedCollectionCode, setSelectedCollectionCode] = useState<string | null>(null);
	const [collectionItems, setCollectionItems] = useState<FaceCollectionListItem[]>([]);
	const [collectionsLoading, setCollectionsLoading] = useState(false);
	const [collectionsError, setCollectionsError] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<Record<string, unknown> | null>(null);
	const [loadingPersonDetail, setLoadingPersonDetail] = useState(false);
	const [loadPersonDetailError, setLoadPersonDetailError] = useState<string | null>(null);
	/** Collection codes (and possibly Mongo ids) from GET person — used to filter the picker. */
	const [personMemberCodes, setPersonMemberCodes] = useState<string[]>([]);
	const [confirmOpen, setConfirmOpen] = useState(false);

	const canUseDemo = hasHydrated && isAuthenticated;
	const showApiReference = step !== "result";

	useEffect(() => {
		if (!canUseDemo) return;
		const token = useAuthStore.getState().token;
		if (!token) return;
		let cancelled = false;
		(async () => {
			setCollectionsLoading(true);
			setCollectionsError(null);
			const res = await listCollections(token);
			if (cancelled) return;
			setCollectionsLoading(false);
			if (res.error) {
				setCollectionsError(res.error);
				setCollectionItems([]);
				return;
			}
			const body = res.data as { data?: FaceCollectionListItem[] } | undefined;
			setCollectionItems(Array.isArray(body?.data) ? body.data : []);
		})();
		return () => {
			cancelled = true;
		};
	}, [canUseDemo]);

	useEffect(() => {
		if (!canUseDemo) return;
		const token = useAuthStore.getState().token;
		if (!token) return;
		let cancelled = false;
		(async () => {
			setPersonsLoading(true);
			setPersonsError(null);
			const res = await getPersons(token, { page: 1, limit: 200 });
			if (cancelled) return;
			setPersonsLoading(false);
			if (res.error) {
				setPersonsError(res.error);
				setPersonRows([]);
				return;
			}
			const body = res.data as { data?: unknown } | undefined;
			const raw = normalizePersonsListPayload(body?.data);
			setPersonRows(mapPersonDocsToListItems(raw));
		})();
		return () => {
			cancelled = true;
		};
	}, [canUseDemo]);

	useEffect(() => {
		setSelectedCollectionCode(null);
	}, [selectedPersonId]);

	useEffect(() => {
		if (!canUseDemo || !selectedPersonId?.trim()) {
			setPersonMemberCodes([]);
			setLoadPersonDetailError(null);
			setLoadingPersonDetail(false);
			return;
		}
		const id = selectedPersonId.trim();
		const token = useAuthStore.getState().token;
		if (!token) return;
		let cancelled = false;
		(async () => {
			setLoadingPersonDetail(true);
			setLoadPersonDetailError(null);
			const res = await getPerson(id, token);
			if (cancelled) return;
			setLoadingPersonDetail(false);
			if (res.error) {
				setLoadPersonDetailError(res.error);
				setPersonMemberCodes([]);
				return;
			}
			const person = readPersonPayload(res.data);
			const cols =
				person && Array.isArray(person.collections)
					? person.collections.filter((c): c is string => typeof c === "string")
					: [];
			setPersonMemberCodes(cols);
		})();
		return () => {
			cancelled = true;
		};
	}, [canUseDemo, selectedPersonId]);

	const collectionsForPicker = useMemo(() => {
		if (!personMemberCodes.length) return [];
		const memberSet = new Set(personMemberCodes);
		return collectionItems.filter((c) => memberSet.has(c.code) || memberSet.has(c._id));
	}, [collectionItems, personMemberCodes]);

	const handleModeChange = (next: DeleteMode) => {
		setMode(next);
		if (next === "full") setSelectedCollectionCode(null);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const token = useAuthStore.getState().token;
		const id = selectedPersonId?.trim();
		if (!token || !id) return;
		if (mode === "collection" && !selectedCollectionCode?.trim()) {
			setError("Select a collection to remove the person from.");
			return;
		}
		setError(null);
		setConfirmOpen(true);
	};

	const performDelete = async () => {
		setConfirmOpen(false);
		const token = useAuthStore.getState().token;
		const id = selectedPersonId?.trim();
		if (!token || !id) return;

		setStep("processing");
		setError(null);

		const res = await deletePerson(
			id,
			token,
			mode === "collection" && selectedCollectionCode ? { collection: selectedCollectionCode.trim() } : {},
		);

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
		setSelectedPersonId(null);
		setMode("full");
		setSelectedCollectionCode(null);
		setPersonMemberCodes([]);
		setLoadPersonDetailError(null);
		setConfirmOpen(false);
		setError(null);
		setResult(null);
	};

	const resultData = result && "data" in result ? result.data : undefined;
	const hasPersonPayload = isPlainObject(resultData);

	const confirmTitle = mode === "full" ? "Delete this person?" : "Remove from collection?";
	const confirmDescription =
		mode === "full"
			? "Delete this person completely from your project? This cannot be undone."
			: "Remove this person from the selected collection? If this was their only collection, the server may delete the person entirely.";
	const confirmLabel = mode === "full" ? "Delete person" : "Remove from collection";

	return (
		<div className="min-h-screen bg-surface flex flex-col">
			<DemoConfirmModal
				open={confirmOpen}
				title={confirmTitle}
				description={confirmDescription}
				confirmLabel={confirmLabel}
				cancelLabel="Cancel"
				variant="danger"
				onConfirm={performDelete}
				onCancel={() => setConfirmOpen(false)}
			/>
			<ElectronAwareAppHeader>
				<button
					type="button"
					onClick={() => router.back()}
					className="hover:bg-surface-container transition-colors p-1.5 rounded-lg text-primary mr-3"
					aria-label="Back"
				>
					<span className="material-symbols-outlined">arrow_back</span>
				</button>
				<h1 className="font-bold tracking-tight text-lg text-primary">Delete Person</h1>
			</ElectronAwareAppHeader>

			<main className="flex-1 mt-20 mb-10 px-4 md:px-8 max-w-4xl mx-auto w-full">
				<div className="mb-8">
					<h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">
						{step === "result" ? "Request completed" : "Delete Person"}
					</h2>
					<p className="text-on-surface-variant">
						{step === "result"
							? "The API responded. See the summary below."
							: "Delete a person entirely, or remove them from one collection only (partial update)."}
					</p>
				</div>

				{!hasHydrated ? (
					<div className="h-60 rounded-xl bg-surface-container-high animate-pulse" />
				) : !canUseDemo ? (
					<DemoSignInPrompt />
				) : step === "form" ? (
					<form onSubmit={handleSubmit} className="space-y-5">
						<div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/50 p-4 space-y-2 text-sm text-on-surface-variant">
							<p>
								<strong className="text-on-surface">Full delete:</strong> omit the collection query — the person is fully removed from face recognition and your project records.
							</p>
							<p>
								<strong className="text-on-surface">Remove from one collection:</strong> pass{" "}
								<code className="text-primary font-mono text-xs">collection</code> as a query param using the collection{" "}
								<strong className="text-on-surface">code</strong> (UUID), matching values stored on the person&apos;s{" "}
								<code className="text-primary font-mono text-xs">collections</code> array. The dropdown only lists collections
								this person belongs to (from GET person).
							</p>
						</div>

						<div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/50 p-4 space-y-3">
							<label className="block text-sm font-semibold text-on-surface" id="del-person-label">
								Person <span className="text-error">*</span>
							</label>
							<p className="text-xs text-on-surface-variant">List from GET /v2/face-recognition/persons — same as Update Person.</p>
							<PersonSingleSelect
								labelId="del-person-label"
								items={personRows}
								selectedId={selectedPersonId}
								onChange={setSelectedPersonId}
								loading={personsLoading}
								error={personsError}
								emptySlot={<span>No people found. Enroll someone first in Create Person.</span>}
							/>
							{selectedPersonId?.trim() && loadingPersonDetail ? (
								<p className="text-sm text-on-surface-variant flex items-center gap-2">
									<span className="inline-block h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
									Loading collections for this person…
								</p>
							) : null}
							{loadPersonDetailError ? (
								<p className="text-sm text-error flex items-center gap-1">
									<span className="material-symbols-outlined text-sm">error_outline</span>
									{loadPersonDetailError}
								</p>
							) : null}
						</div>

						<fieldset className="space-y-3 rounded-xl border border-outline-variant/20 p-4">
							<legend className="text-sm font-semibold text-on-surface px-1">Mode</legend>
							<label className="flex items-start gap-3 cursor-pointer">
								<input
									type="radio"
									name="del-mode"
									checked={mode === "full"}
									onChange={() => handleModeChange("full")}
									className="mt-1"
								/>
								<span>
									<span className="font-medium text-on-surface">Full delete</span>
									<span className="block text-xs text-on-surface-variant">DELETE /persons/:id with no query params.</span>
								</span>
							</label>
							<label className="flex items-start gap-3 cursor-pointer">
								<input
									type="radio"
									name="del-mode"
									checked={mode === "collection"}
									onChange={() => handleModeChange("collection")}
									className="mt-1"
								/>
								<span>
									<span className="font-medium text-on-surface">Remove from collection only</span>
									<span className="block text-xs text-on-surface-variant">
										DELETE /persons/:id?collection=&lt;collection code (UUID)&gt;
									</span>
								</span>
							</label>
						</fieldset>

						{mode === "collection" ? (
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" id="del-col-label">
									Collection <span className="text-error">*</span>
								</label>
								{collectionsError && (
									<div className="mb-2 text-sm text-error flex items-center gap-1.5">
										<span className="material-symbols-outlined text-sm">error_outline</span>
										{collectionsError}
									</div>
								)}
								<CollectionSingleSelect
									labelId="del-col-label"
									items={collectionsForPicker}
									selectedCode={selectedCollectionCode}
									onChange={setSelectedCollectionCode}
									loading={collectionsLoading || loadingPersonDetail}
									emptySlot={
										<span>
											{loadingPersonDetail
												? "Loading…"
												: !selectedPersonId?.trim()
													? "Select a person first."
													: collectionsForPicker.length === 0
														? "No matching collections for this person (check GET person or list collections)."
														: "No collections loaded."}
										</span>
									}
								/>
							</div>
						) : null}

						{error && (
							<div className="px-4 py-3 bg-error-container/20 border border-error/20 rounded-lg flex items-center gap-2 text-sm text-error">
								<span className="material-symbols-outlined text-sm">error_outline</span>
								{error}
							</div>
						)}

						<button
							type="submit"
							disabled={
								!selectedPersonId?.trim() ||
								(mode === "collection" &&
									(!selectedCollectionCode?.trim() || loadingPersonDetail || !!loadPersonDetailError)) ||
								collectionsLoading ||
								personsLoading
							}
							className="w-full py-3 bg-error text-white font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
						>
							{mode === "full" ? "Delete person" : "Remove from collection"}
						</button>
					</form>
				) : step === "processing" ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<p className="text-on-surface font-semibold">Sending request…</p>
					</div>
				) : hasPersonPayload ? (
					<CreatePersonResult
						mode="delete"
						result={result}
						onEnrollAnother={reset}
						onBackToDemos={() => router.push("/home")}
					/>
				) : (
					<div className="space-y-5">
						<div className="rounded-2xl bg-surface-container-low border border-primary/20 p-6">
							<div className="flex items-center gap-3">
								<span className="material-symbols-outlined text-primary text-3xl">task_alt</span>
								<div>
									<p className="font-bold text-on-surface text-lg">Person removed</p>
									<p className="text-sm text-on-surface-variant mt-1">
										The server returned no person document (typical after a full delete). Check the raw payload if you need
										details.
									</p>
								</div>
							</div>
						</div>
						<details className="rounded-xl border border-outline-variant/20 bg-surface-container-low/50 px-4 py-3 group">
							<summary className="cursor-pointer list-none font-bold text-sm text-on-surface-variant flex items-center justify-between gap-2">
								<span>Raw response (debug)</span>
								<span className="material-symbols-outlined text-on-surface-variant/70 group-open:rotate-180 transition-transform text-lg">
									expand_more
								</span>
							</summary>
							<pre className="mt-3 text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{result ? JSON.stringify(redactThumbnailsForDebug(result), null, 2) : ""}
							</pre>
						</details>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={reset}
								className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg ghost-border hover:bg-surface-container-high transition-all active:scale-95"
							>
								Another action
							</button>
							<button
								type="button"
								onClick={() => router.push("/home")}
								className="flex-1 py-3 bg-primary-cta text-on-primary-container font-semibold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all"
							>
								Back to demos
							</button>
						</div>
					</div>
				)}

				{showApiReference ? (
					<details className="mt-10 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 text-left max-w-3xl mx-auto w-full px-4 py-3 group">
						<summary className="cursor-pointer list-none font-bold text-sm text-primary flex items-center justify-between gap-2">
							<span className="flex items-center gap-2">
								<span className="material-symbols-outlined text-lg">menu_book</span>
								API reference: Delete Person
							</span>
							<span className="material-symbols-outlined text-on-surface-variant/70 group-open:rotate-180 transition-transform">
								expand_more
							</span>
						</summary>
						<div className="mt-4 space-y-3 text-sm text-on-surface-variant border-t border-outline-variant/15 pt-4">
							<p>
								Official docs:{" "}
								<a
									href={`${DOCS_BASE}/resources/persons/delete-a-person`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									docs.verifik.co/resources/persons/delete-a-person
								</a>
							</p>
							<p className="text-xs leading-relaxed font-mono">
								DELETE {`https://api.verifik.co/v2/face-recognition/persons/<personId>`}
								<br />
								Optional: ?collection=&lt;collectionCodeUuid&gt; (same id as on the person&apos;s collections list)
							</p>
						</div>
					</details>
				) : null}

				<DemoRelatedDocsSection items={RELATED_DOCS} />
			</main>
		</div>
	);
}
