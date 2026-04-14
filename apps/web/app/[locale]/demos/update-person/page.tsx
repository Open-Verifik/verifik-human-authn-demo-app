"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
	getPerson,
	getPersons,
	listCollections,
	mapPersonDocsToListItems,
	normalizePersonsListPayload,
	updatePerson,
	type FaceCollectionListItem,
	type PersonListItem,
} from "@humanauthn/api-client";
import { useAuthHydration } from "../../../hooks/useAuthHydration";
import { useAuthStore } from "../../../store/authStore";
import DemoRelatedDocsSection, { type DemoRelatedDocItem } from "../../../components/demos/DemoRelatedDocsSection";
import { CollectionMultiSelect } from "../../../components/demos/CollectionMultiSelect";
import { PersonSingleSelect } from "../../../components/demos/PersonSingleSelect";
import DemoSignInPrompt from "../DemoSignInPrompt";
import ElectronAwareAppHeader from "../../../components/layout/ElectronAwareAppHeader";

import CreatePersonResult from "../../../components/demos/CreatePersonResult";

const DOCS_BASE = "https://docs.verifik.co";

const RELATED_DOC_HREFS = [
	`${DOCS_BASE}/resources/retrieve-a-person`,
	`${DOCS_BASE}/resources/persons/update-a-person`,
	`${DOCS_BASE}/resources/create-a-person`,
	`${DOCS_BASE}/resources/persons/delete-a-person`,
] as const;

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

export default function UpdatePersonPage() {
	const t = useTranslations("demos.updatePerson");
	const tCommon = useTranslations("demos.common");
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();

	const relatedDocs = useMemo((): DemoRelatedDocItem[] => {
		return RELATED_DOC_HREFS.map((href, i) => ({
			href,
			title: t(`relatedDocs.${i}.title`),
			description: t(`relatedDocs.${i}.description`),
			badge: t(`relatedDocs.${i}.badge`),
		}));
	}, [t]);

	const [step, setStep] = useState<Step>("form");
	const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
	const [personsLoading, setPersonsLoading] = useState(false);
	const [personsError, setPersonsError] = useState<string | null>(null);
	const [personRows, setPersonRows] = useState<PersonListItem[]>([]);
	const [name, setName] = useState("");
	const [gender, setGender] = useState<"M" | "F">("M");
	const [dob, setDob] = useState("");
	const [nationality, setNationality] = useState("");
	const [notes, setNotes] = useState("");
	const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
	const [collectionItems, setCollectionItems] = useState<FaceCollectionListItem[]>([]);
	const [collectionsLoading, setCollectionsLoading] = useState(false);
	const [collectionsError, setCollectionsError] = useState<string | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [loadingPerson, setLoadingPerson] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [result, setResult] = useState<Record<string, unknown> | null>(null);

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

	const applyPersonToForm = (person: Record<string, unknown>) => {
		setName(typeof person.name === "string" ? person.name : "");
		setGender(person.gender === "F" ? "F" : "M");
		const dobRaw = person.date_of_birth;
		setDob(typeof dobRaw === "string" ? dobRaw.slice(0, 10) : "");
		setNationality(typeof person.nationality === "string" ? person.nationality : "");
		setNotes(person.notes !== undefined && person.notes !== null ? String(person.notes) : "");
		const cols = Array.isArray(person.collections) ? person.collections.filter((c): c is string => typeof c === "string") : [];
		setSelectedCollectionIds(cols);
	};

	const loadPersonDetails = async (id: string) => {
		const token = useAuthStore.getState().token;
		if (!token || !id) return;
		setLoadingPerson(true);
		setLoadError(null);
		const res = await getPerson(id, token);
		setLoadingPerson(false);
		if (res.error) {
			setLoadError(res.error);
			return;
		}
		const person = readPersonPayload(res.data);
		if (!person) {
			setLoadError(t("unexpectedResponseShape"));
			return;
		}
		applyPersonToForm(person);
	};

	const handlePersonSelected = async (id: string) => {
		setSelectedPersonId(id);
		await loadPersonDetails(id);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const token = useAuthStore.getState().token;
		const id = selectedPersonId?.trim();
		if (!token || !id) return;

		setStep("processing");
		setSubmitError(null);

		const res = await updatePerson(
			id,
			{
				name,
				gender,
				date_of_birth: dob,
				nationality: nationality || undefined,
				notes: notes || undefined,
				collections: selectedCollectionIds,
			},
			token,
		);

		if (res.error) {
			setSubmitError(res.error);
			setStep("form");
			return;
		}
		setResult(res.data as Record<string, unknown>);
		setStep("result");
	};

	const reset = () => {
		setStep("form");
		setSelectedPersonId(null);
		setName("");
		setGender("M");
		setDob("");
		setNationality("");
		setNotes("");
		setSelectedCollectionIds([]);
		setLoadError(null);
		setSubmitError(null);
		setResult(null);
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

			<main className="flex-1 mt-20 mb-10 px-4 md:px-8 max-w-4xl mx-auto w-full">
				<div className="mb-8">
					<h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">
						{step === "result" ? t("heroTitleResult") : t("heroTitleForm")}
					</h2>
					<p className="text-on-surface-variant">
						{step === "result" ? t("heroSubtitleResult") : t("heroSubtitleForm")}
					</p>
				</div>

				{!hasHydrated ? (
					<div className="h-60 rounded-xl bg-surface-container-high animate-pulse" />
				) : !canUseDemo ? (
					<DemoSignInPrompt />
				) : step === "form" ? (
					<form onSubmit={handleSubmit} className="space-y-5">
						<div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/50 p-4 space-y-3">
							<label className="block text-sm font-semibold text-on-surface" id="up-person-label">
								{t("personLabel")} <span className="text-error">{tCommon("requiredStar")}</span>
							</label>
							<p className="text-xs text-on-surface-variant">{t("personHint")}</p>
							<PersonSingleSelect
								labelId="up-person-label"
								items={personRows}
								selectedId={selectedPersonId}
								onChange={handlePersonSelected}
								loading={personsLoading}
								error={personsError}
								emptySlot={<span>{t("noPeopleEmpty")}</span>}
							/>
							{loadingPerson ? (
								<p className="text-sm text-on-surface-variant flex items-center gap-2">
									<span className="inline-block h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
									{t("loadingProfile")}
								</p>
							) : null}
							{loadError ? (
								<p className="text-sm text-error flex items-center gap-1">
									<span className="material-symbols-outlined text-sm">error_outline</span>
									{loadError}
								</p>
							) : null}
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="up-name">
									{t("fullNameLabel")} <span className="text-error">{tCommon("requiredStar")}</span>
								</label>
								<input
									id="up-name"
									type="text"
									required
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-primary/60"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="up-gender">
									{t("genderLabel")} <span className="text-error">{tCommon("requiredStar")}</span>
								</label>
								<select
									id="up-gender"
									value={gender}
									onChange={(e) => setGender(e.target.value as "M" | "F")}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-primary/60"
								>
									<option value="M">{tCommon("male")}</option>
									<option value="F">{tCommon("female")}</option>
								</select>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="up-dob">
									{t("dobLabel")} <span className="text-error">{tCommon("requiredStar")}</span>
								</label>
								<input
									id="up-dob"
									type="date"
									required
									value={dob}
									onChange={(e) => setDob(e.target.value)}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-primary/60"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="up-nationality">
									{t("nationalityLabel")}
								</label>
								<input
									id="up-nationality"
									type="text"
									value={nationality}
									onChange={(e) => setNationality(e.target.value)}
									placeholder={t("nationalityPlaceholder")}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-primary/60"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="up-notes">
								{t("notesLabel")}
							</label>
							<textarea
								id="up-notes"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								rows={3}
								className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-primary/60"
							/>
						</div>

						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5" id="up-col-label">
								{t("collectionsLabel")} <span className="text-error">{tCommon("requiredStar")}</span>
							</label>
							{collectionsError && (
								<div className="mb-2 text-sm text-error flex items-center gap-1.5">
									<span className="material-symbols-outlined text-sm">error_outline</span>
									{collectionsError}
								</div>
							)}
							<CollectionMultiSelect
								labelId="up-col-label"
								items={collectionItems}
								selectedIds={selectedCollectionIds}
								onChange={setSelectedCollectionIds}
								loading={collectionsLoading}
								emptySlot={<span>{t("noCollectionsLoaded")}</span>}
							/>
						</div>

						{submitError && (
							<div className="px-4 py-3 bg-error-container/20 border border-error/20 rounded-lg flex items-center gap-2 text-sm text-error">
								<span className="material-symbols-outlined text-sm">error_outline</span>
								{submitError}
							</div>
						)}

						<button
							type="submit"
							disabled={
								!selectedPersonId?.trim() || !selectedCollectionIds.length || collectionsLoading || loadingPerson || personsLoading
							}
							className="w-full py-3 bg-primary-cta text-on-primary-container font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
						>
							{t("saveChanges")}
						</button>
					</form>
				) : step === "processing" ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<p className="text-on-surface font-semibold">{t("processing")}</p>
					</div>
				) : (
					<CreatePersonResult
						mode="update"
						result={result}
						onEnrollAnother={reset}
						onBackToDemos={() => router.push("/home")}
					/>
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
						<div className="mt-4 space-y-3 text-sm text-on-surface-variant border-t border-outline-variant/15 pt-4">
							<p>
								{t("apiRefOfficialDocs")}{" "}
								<a
									href={`${DOCS_BASE}/resources/persons/update-a-person`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									{t("apiRefLinkLabel")}
								</a>
							</p>
							<p className="text-xs leading-relaxed">{t("apiRefBody")}</p>
						</div>
					</details>
				) : null}

				<DemoRelatedDocsSection items={relatedDocs} />
			</main>
		</div>
	);
}
