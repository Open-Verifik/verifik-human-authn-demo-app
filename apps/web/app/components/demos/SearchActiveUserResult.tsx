"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function thumbnailToDataUrl(b64: string): string {
	const trimmed = b64.trim();
	if (trimmed.startsWith("data:")) return trimmed;
	if (trimmed.startsWith("/9j/") || trimmed.startsWith("iVBOR")) {
		const mime = trimmed.startsWith("/9j/") ? "image/jpeg" : "image/png";
		return `data:${mime};base64,${trimmed}`;
	}
	return `data:image/jpeg;base64,${trimmed}`;
}

function formatDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatDob(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString(undefined, { dateStyle: "long" });
}

function formatScore(score: number | null, naLabel: string): string {
	if (score === null || !Number.isFinite(score)) return naLabel;
	return `${(score * 100).toFixed(2)}%`;
}

type SearchActiveUserResultProps = {
	result: Record<string, unknown> | null;
	onReset: () => void;
};

type ResultTab = "matches" | "raw";

export default function SearchActiveUserResult({ result, onReset }: SearchActiveUserResultProps) {
	const t = useTranslations("demos.searchActiveUserResult");
	const tCommon = useTranslations("demos.common");
	const [activeTab, setActiveTab] = useState<ResultTab>("matches");
	const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

	const formatGender = (gender: string) => {
		if (gender === "M") return tCommon("male");
		if (gender === "F") return tCommon("female");
		return gender;
	};

	const parsed = useMemo(() => {
		const data = isPlainObject(result?.data) ? result.data : null;

		const liveness = isPlainObject(data?.liveness)
			? {
					score: typeof data.liveness.score === "number" ? data.liveness.score : null,
					passed: typeof data.liveness.passed === "boolean" ? data.liveness.passed : null,
					status: typeof data.liveness.status === "string" ? data.liveness.status : "",
				}
			: null;

		const rawMatches = Array.isArray(data?.persons) ? data.persons : [];
		const matches = rawMatches
			.filter(isPlainObject)
			.map((person) => {
				const thumbnailsRaw = Array.isArray(person.thumbnails) ? person.thumbnails : [];
				const thumbnails = thumbnailsRaw
					.filter(isPlainObject)
					.map((item) => {
						const id = typeof item.id === "string" ? item.id : "";
						const thumbnail = typeof item.thumbnail === "string" ? item.thumbnail : "";
						if (!thumbnail) return null;
						return { id, src: thumbnailToDataUrl(thumbnail) };
					})
					.filter((item): item is { id: string; src: string } => item !== null);

				const collectionsRaw = Array.isArray(person.collections) ? person.collections : [];
				const collections = collectionsRaw
					.map((entry) => {
						if (typeof entry === "string") {
							return { id: entry, name: "", description: "", count: null as number | null };
						}
						if (!isPlainObject(entry)) return null;
						return {
							id: typeof entry.id === "string" ? entry.id : "",
							name: typeof entry.name === "string" ? entry.name : "",
							description: typeof entry.description === "string" ? entry.description : "",
							count: typeof entry.count === "number" ? entry.count : null,
						};
					})
					.filter(
						(entry): entry is { id: string; name: string; description: string; count: number | null } => entry !== null,
					);

				return {
					id: typeof person.id === "string" ? person.id : "",
					name: typeof person.name === "string" ? person.name : tCommon("unknownPerson"),
					gender: typeof person.gender === "string" ? person.gender : "",
					dateOfBirth: typeof person.date_of_birth === "string" ? person.date_of_birth : "",
					nationality: typeof person.nationality === "string" ? person.nationality : "",
					notes: person.notes,
					score: typeof person.score === "number" ? person.score : null,
					createDate: typeof person.create_date === "string" ? person.create_date : "",
					modifiedDate: typeof person.modified_date === "string" ? person.modified_date : "",
					thumbnails,
					collections,
				};
			})
			.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

		const signature = isPlainObject(result?.signature)
			? {
					dateTime: typeof result.signature.dateTime === "string" ? result.signature.dateTime : "",
					message: typeof result.signature.message === "string" ? result.signature.message : "",
				}
			: null;

		const requestId = typeof result?.id === "string" ? result.id : "";

		return { liveness, matches, signature, requestId };
	}, [result, tCommon]);

	const handleCopyRaw = async () => {
		if (!result) return;
		try {
			await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
			setCopyState("copied");
			window.setTimeout(() => setCopyState("idle"), 1800);
		} catch {
			setCopyState("error");
			window.setTimeout(() => setCopyState("idle"), 1800);
		}
	};

	const na = tCommon("scoreNA");
	const dash = tCommon("emDash");

	return (
		<div className="rounded-2xl bg-surface-container-low border border-primary/20 p-6 space-y-4">
			<div className="inline-flex rounded-lg border border-outline-variant/30 bg-surface-container-high/40 p-1">
				<button
					type="button"
					onClick={() => setActiveTab("matches")}
					className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
						activeTab === "matches" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"
					}`}
				>
					{t("tabMatches")}
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("raw")}
					className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
						activeTab === "raw" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"
					}`}
				>
					{t("tabRaw")}
				</button>
			</div>

			{activeTab === "matches" ? (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<p className="font-bold text-on-surface">{t("activeUserSearchResults")}</p>
						<button type="button" onClick={onReset} className="text-xs text-primary underline">
							{t("reset")}
						</button>
					</div>

					{parsed.liveness ? (
						<div className="rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
							<p className="font-semibold text-on-surface mb-2">{t("liveness")}</p>
							<dl className="space-y-1.5 text-sm">
								{parsed.liveness.status ? (
									<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,10rem)_1fr] gap-x-3 gap-y-1">
										<dt className="text-on-surface-variant font-medium">{t("status")}</dt>
										<dd className={parsed.liveness.status === "success" ? "text-emerald-400" : "text-error"}>
											{parsed.liveness.status}
										</dd>
									</div>
								) : null}
								{parsed.liveness.passed !== null ? (
									<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,10rem)_1fr] gap-x-3 gap-y-1">
										<dt className="text-on-surface-variant font-medium">{t("passedField")}</dt>
										<dd className={parsed.liveness.passed ? "text-emerald-400" : "text-error"}>
											{parsed.liveness.passed ? tCommon("yes") : tCommon("no")}
										</dd>
									</div>
								) : null}
								{parsed.liveness.score !== null ? (
									<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,10rem)_1fr] gap-x-3 gap-y-1">
										<dt className="text-on-surface-variant font-medium">{t("score")}</dt>
										<dd className="text-on-surface">{formatScore(parsed.liveness.score, na)}</dd>
									</div>
								) : null}
							</dl>
						</div>
					) : null}

					{parsed.matches.length === 0 ? (
						<div className="rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4 text-sm text-on-surface-variant">
							{t("noMatchesThreshold")}
						</div>
					) : (
						<div className="space-y-3">
							{parsed.matches.map((match, index) => (
								<div key={`${match.id}-${index}`} className="rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
									<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
										<div className="flex items-start gap-3">
											{match.thumbnails[0] ? (
												<img
													src={match.thumbnails[0].src}
													alt={match.name}
													className="w-16 h-16 rounded-lg object-cover border border-outline-variant/25"
												/>
											) : null}
											<div>
												<p className="text-sm text-on-surface-variant">{t("matchNumber", { n: index + 1 })}</p>
												<p className="font-bold text-on-surface">{match.name}</p>
												{match.id ? <p className="font-mono text-xs text-on-surface-variant break-all">{match.id}</p> : null}
											</div>
										</div>
										<div className="rounded-lg bg-primary/10 border border-primary/25 px-3 py-2">
											<p className="text-[0.65rem] uppercase tracking-wide text-primary/80">{t("similarity")}</p>
											<p className="font-bold text-primary">{formatScore(match.score, na)}</p>
										</div>
									</div>

									<dl className="mt-4 space-y-2 text-sm">
										{match.gender ? (
											<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,10rem)_1fr] gap-x-3 gap-y-1">
												<dt className="text-on-surface-variant font-medium">{t("gender")}</dt>
												<dd className="text-on-surface">{formatGender(match.gender)}</dd>
											</div>
										) : null}
										{match.dateOfBirth ? (
											<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,10rem)_1fr] gap-x-3 gap-y-1">
												<dt className="text-on-surface-variant font-medium">{t("dateOfBirth")}</dt>
												<dd className="text-on-surface">{formatDob(match.dateOfBirth)}</dd>
											</div>
										) : null}
										{match.nationality ? (
											<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,10rem)_1fr] gap-x-3 gap-y-1">
												<dt className="text-on-surface-variant font-medium">{t("nationality")}</dt>
												<dd className="text-on-surface">{match.nationality}</dd>
											</div>
										) : null}
										<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,10rem)_1fr] gap-x-3 gap-y-1">
											<dt className="text-on-surface-variant font-medium">{t("notes")}</dt>
											<dd className="text-on-surface">
												{match.notes === null || match.notes === undefined || match.notes === "" ? dash : String(match.notes)}
											</dd>
										</div>
									</dl>

									{match.collections.length > 0 ? (
										<div className="mt-4 rounded-lg border border-outline-variant/20 bg-surface-container-low/50 p-3">
											<p className="text-xs font-semibold text-primary mb-2">{t("collections")}</p>
											<ul className="space-y-1.5">
												{match.collections.map((collection) => (
													<li key={`${collection.id}-${collection.name}`} className="text-xs text-on-surface">
														<span className="font-semibold">{collection.name || collection.id || t("unnamedCollection")}</span>
														{collection.description ? (
															<span className="text-on-surface-variant"> — {collection.description}</span>
														) : null}
													</li>
												))}
											</ul>
										</div>
									) : null}

									{match.createDate || match.modifiedDate ? (
										<div className="mt-3 text-xs text-on-surface-variant space-y-1">
											{match.createDate ? (
												<p>
													{t("createdPrefix")} {formatDate(match.createDate)}
												</p>
											) : null}
											{match.modifiedDate ? (
												<p>
													{t("updatedPrefix")} {formatDate(match.modifiedDate)}
												</p>
											) : null}
										</div>
									) : null}
								</div>
							))}
						</div>
					)}

					{parsed.signature || parsed.requestId ? (
						<div className="rounded-xl border border-outline-variant/20 bg-surface-container-high/30 p-4 text-sm space-y-1">
							<p className="font-semibold text-on-surface">{t("responseSignature")}</p>
							{parsed.signature?.message ? <p className="text-on-surface-variant">{parsed.signature.message}</p> : null}
							{parsed.signature?.dateTime ? (
								<p className="text-on-surface-variant">
									{t("timestampPrefix")} {parsed.signature.dateTime}
								</p>
							) : null}
							{parsed.requestId ? (
								<p className="font-mono text-xs text-on-surface-variant break-all">
									{t("requestIdPrefix")} {parsed.requestId}
								</p>
							) : null}
						</div>
					) : null}
				</div>
			) : (
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<p className="font-bold text-on-surface">{t("rawResponse")}</p>
						<button type="button" onClick={handleCopyRaw} className="text-xs text-primary underline">
							{copyState === "copied" ? t("copied") : copyState === "error" ? t("copyFailed") : t("copy")}
						</button>
					</div>
					<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
						{result ? JSON.stringify(result, null, 2) : ""}
					</pre>
				</div>
			)}
		</div>
	);
}
