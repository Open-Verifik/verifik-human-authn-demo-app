"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { createPerson, fileToBase64, listCollections, type FaceCollectionListItem } from "@humanauthn/api-client";
import { useAuthHydration } from "../../../hooks/useAuthHydration";
import { useAuthStore } from "../../../store/authStore";
import DemoCaptureOptionHeading from "../../../components/demos/DemoCaptureOptionHeading";
import DemoChooseOneCallout from "../../../components/demos/DemoChooseOneCallout";
import DemoOrDivider from "../../../components/demos/DemoOrDivider";
import DemoScannerShell from "../../../components/demos/DemoScannerShell";
import DemoUploadImageButton from "../../../components/demos/DemoUploadImageButton";
import FaceGuidedCamera from "../../../components/demos/FaceGuidedCameraLoader";
import DemoRelatedDocsSection, { type DemoRelatedDocItem } from "../../../components/demos/DemoRelatedDocsSection";
import DemoSignInPrompt from "../DemoSignInPrompt";
import ElectronAwareAppHeader from "../../../components/layout/ElectronAwareAppHeader";

import CreatePersonResult from "../../../components/demos/CreatePersonResult";
import CreatePersonAlreadyExistsResult from "../../../components/demos/CreatePersonAlreadyExistsResult";
import { CollectionMultiSelect } from "../../../components/demos/CollectionMultiSelect";

const DOCS_BASE = "https://docs.verifik.co";

const RELATED_DOC_HREFS = [
	`${DOCS_BASE}/resources/the-person-object`,
	`${DOCS_BASE}/resources/list-all-persons`,
	`${DOCS_BASE}/resources/retrieve-a-person`,
	`${DOCS_BASE}/resources/persons/update-a-person`,
	`${DOCS_BASE}/resources/persons/delete-a-person`,
	"/demos/update-person",
	"/demos/delete-person",
] as const;

const RELATED_DOC_BADGE_MUTED = [true, false, false, false, false, false, false] as const;

type Step = "form" | "processing" | "result" | "conflict";

function isPersonAlreadySetError(res: { error?: string; code?: string }): boolean {
	return res.error === "person_already_set" || (res.code === "PreconditionFailed" && res.error === "person_already_set");
}

export default function CreatePersonPage() {
	const t = useTranslations("demos.createPerson");
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
			badgeMuted: RELATED_DOC_BADGE_MUTED[i],
		}));
	}, [t]);

	const [step, setStep] = useState<Step>("form");
	const [name, setName] = useState("");
	const [gender, setGender] = useState<"M" | "F">("M");
	const [dob, setDob] = useState("");
	const [collectionItems, setCollectionItems] = useState<FaceCollectionListItem[]>([]);
	const [collectionsLoading, setCollectionsLoading] = useState(false);
	const [collectionsError, setCollectionsError] = useState<string | null>(null);
	const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
	const [nationality, setNationality] = useState("");
	const [images, setImages] = useState<string[]>([]);
	const [previews, setPreviews] = useState<string[]>([]);
	const [result, setResult] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	const canUseDemo = hasHydrated && isAuthenticated;

	const showApiReference = step !== "result" && step !== "conflict";

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
		if (!token || !images.length || !selectedCollectionIds.length) return;

		setStep("processing");
		setError(null);

		const res = await createPerson(
			{
				name,
				images,
				gender,
				date_of_birth: dob,
				collections: selectedCollectionIds,
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
		setSelectedCollectionIds([]);
		setNationality("");
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
						{step === "result" ? t("heroTitleResult") : step === "conflict" ? t("heroTitleConflict") : t("heroTitleForm")}
					</h2>
					<p className="text-on-surface-variant">
						{step === "result"
							? t("heroSubtitleResult")
							: step === "conflict"
								? t("heroSubtitleConflict")
								: t("heroSubtitleForm")}
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
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="p-name">
									{t("fullNameLabel")} <span className="text-error">{tCommon("requiredStar")}</span>
								</label>
								<input
									id="p-name"
									type="text"
									required
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder={t("namePlaceholder")}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:border-primary/60 transition-colors"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="p-gender">
									{t("genderLabel")} <span className="text-error">{tCommon("requiredStar")}</span>
								</label>
								<select
									id="p-gender"
									value={gender}
									onChange={(e) => setGender(e.target.value as "M" | "F")}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-primary/60 transition-colors"
								>
									<option value="M">{tCommon("male")}</option>
									<option value="F">{tCommon("female")}</option>
								</select>
							</div>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="p-dob">
									{t("dobLabel")} <span className="text-error">{tCommon("requiredStar")}</span>
								</label>
								<input
									id="p-dob"
									type="date"
									required
									value={dob}
									onChange={(e) => setDob(e.target.value)}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-primary/60 transition-colors"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="p-nat">
									{t("nationalityLabel")}
								</label>
								<input
									id="p-nat"
									type="text"
									value={nationality}
									onChange={(e) => setNationality(e.target.value)}
									placeholder={t("nationalityPlaceholder")}
									className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:border-primary/60 transition-colors"
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="p-col">
								{t("collectionsLabel")} <span className="text-error">{tCommon("requiredStar")}</span>
							</label>
							{collectionsError && (
								<div className="mb-2 text-sm text-error flex items-center gap-1.5">
									<span className="material-symbols-outlined text-sm">error_outline</span>
									{collectionsError}
								</div>
							)}
							<CollectionMultiSelect
								labelId="p-col"
								items={collectionItems}
								selectedIds={selectedCollectionIds}
								onChange={setSelectedCollectionIds}
								loading={collectionsLoading}
								emptySlot={
									<span>
										{t("noCollectionsLead")}{" "}
										<Link href="/demos/create-collection" className="text-primary font-semibold underline underline-offset-2">
											{t("noCollectionsCta")}
										</Link>{" "}
										{t("noCollectionsTail")}
									</span>
								}
							/>
						</div>
						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5">
								{t("faceImagesLabel")} <span className="text-error">{tCommon("requiredStar")}</span>
							</label>
							<div className="space-y-5 mb-3">
								<DemoChooseOneCallout description={t("chooseOneDescription")} />
								<section aria-labelledby="create-person-camera-heading">
									<DemoCaptureOptionHeading
										label="A"
										id="create-person-camera-heading"
										title={t("cameraTitle")}
										subtitle={t("cameraSubtitle")}
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
								<section aria-labelledby="create-person-upload-heading">
									<DemoCaptureOptionHeading
										label="B"
										id="create-person-upload-heading"
										title={t("uploadTitle")}
										subtitle={t("uploadSubtitle")}
									/>
									<DemoUploadImageButton
										onClick={() => fileRef.current?.click()}
										primaryText={
											images.length ? tCommon("imagesAddMore", { count: images.length }) : tCommon("uploadFaceImages")
										}
										secondaryText={tCommon("jpegPngGallery")}
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
							disabled={!images.length || !selectedCollectionIds.length || collectionsLoading}
							className="w-full py-3 bg-primary-cta text-on-primary-container font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
						>
							{t("submit")}
						</button>
					</form>
				) : step === "processing" ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<p className="text-on-surface font-semibold">{t("processing")}</p>
					</div>
				) : step === "conflict" ? (
					<CreatePersonAlreadyExistsResult
						previews={previews}
						onEditForm={backToFormFromConflict}
						onBackToDemos={() => router.push("/home")}
					/>
				) : (
					<CreatePersonResult result={result} onEnrollAnother={reset} onBackToDemos={() => router.push("/home")} />
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
								{t("apiRefOfficialDocs")}{" "}
								<a
									href={`${DOCS_BASE}/resources/create-a-person/`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									{t("apiRefLinkLabel")}
								</a>
							</p>
							<p className="text-xs leading-relaxed">{t("apiRefBody")}</p>
							<div>
								<p className="font-mono text-xs text-on-surface mb-1">{t("apiRefEndpoint")}</p>
								<p className="text-xs leading-relaxed">{t("apiRefEndpointDesc")}</p>
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
											<td className="py-2 font-mono text-primary">{t("paramName")}</td>
											<td>{tCommon("yes")}</td>
											<td>{t("paramNameDesc")}</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">{t("paramImages")}</td>
											<td>{tCommon("yes")}</td>
											<td>{t("paramImagesDesc")}</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">{t("paramGender")}</td>
											<td>{tCommon("yes")}</td>
											<td>{t("paramGenderDesc")}</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">{t("paramDob")}</td>
											<td>{tCommon("yes")}</td>
											<td>{t("paramDobDesc")}</td>
										</tr>
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">{t("paramCollections")}</td>
											<td>{tCommon("yes")}</td>
											<td>{t("paramCollectionsDesc")}</td>
										</tr>
										<tr className="align-top">
											<td className="py-2 font-mono text-primary">{t("paramNationality")}</td>
											<td>{tCommon("no")}</td>
											<td>{t("paramNationalityDesc")}</td>
										</tr>
									</tbody>
								</table>
							</div>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{`await fetch("https://api.verifik.co/v2/face-recognition/persons", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({
    name: "Jane Doe",
    gender: "F",
    date_of_birth: "1990-01-15",
    collections: ["<collectionMongoId>"],
    nationality: "CO",
    images: ["<base64>", "<base64>"],
  }),
});`}
							</pre>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{`// 200 OK — example shape
{
  "data": {
    "id": "…",
    "name": "Jane Doe",
    "gender": "F",
    "date_of_birth": "1990-01-15",
    "collections": ["…"],
    "…": "…"
  }
}`}
							</pre>
							<ul className="list-disc pl-5 space-y-1 text-xs">
								<li>{t("bullet1")}</li>
								<li>{t("bullet2")}</li>
							</ul>
						</div>
					</details>
				) : null}

				<DemoRelatedDocsSection items={relatedDocs} />
			</main>
		</div>
	);
}
