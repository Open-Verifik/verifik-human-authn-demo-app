"use client";

import { useMemo } from "react";

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === "object" && !Array.isArray(v);
}

function thumbnailToDataUrl(b64: string): string {
	const t = b64.trim();
	if (t.startsWith("data:")) return t;
	if (t.startsWith("/9j/") || t.startsWith("iVBOR")) {
		const mime = t.startsWith("/9j/") ? "image/jpeg" : "image/png";
		return `data:${mime};base64,${t}`;
	}
	return `data:image/jpeg;base64,${t}`;
}

function formatDate(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatDob(iso: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString(undefined, { dateStyle: "long" });
}

function formatGender(g: string): string {
	if (g === "M") return "Male";
	if (g === "F") return "Female";
	return g;
}

/** Keeps raw JSON readable in the debug expander (avoids multi‑KB base64 lines). */
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

const HANDLED = new Set([
	"name",
	"thumbnails",
	"collections",
	"_id",
	"id",
	"gender",
	"date_of_birth",
	"nationality",
	"notes",
	"documentValidations",
	"emails",
	"phones",
	"isDemoPerson",
	"environment",
	"client",
	"createdAt",
	"updatedAt",
	"create_date",
	"modified_date",
	"__v",
]);

export type CreatePersonResultProps = {
	result: Record<string, unknown> | null;
	onEnrollAnother: () => void;
	onBackToDemos: () => void;
	/** `"update"` / `"delete"` adjust labels for those demos. @default "create" */
	mode?: "create" | "update" | "delete";
};

export default function CreatePersonResult({
	result,
	onEnrollAnother,
	onBackToDemos,
	mode = "create",
}: CreatePersonResultProps) {
	const isUpdate = mode === "update";
	const isDelete = mode === "delete";

	const primaryActionLabel = isDelete ? "Another action" : isUpdate ? "Update another" : "Enroll Another";

	const headerIcon = isDelete ? "delete" : isUpdate ? "edit" : "person_add";

	const parsed = useMemo(() => {
		if (!result) return null;
		const data = isPlainObject(result.data) ? result.data : null;
		if (!data) return { data: null, extra: {} as Record<string, unknown> };

		const personId = typeof data._id === "string" ? data._id : typeof data.id === "string" ? data.id : "";
		const name = typeof data.name === "string" ? data.name : "";
		const gender = typeof data.gender === "string" ? data.gender : "";
		const dateOfBirth = typeof data.date_of_birth === "string" ? data.date_of_birth : "";
		const nationality = typeof data.nationality === "string" ? data.nationality : "";
		const notes = data.notes;
		const isDemoPerson = typeof data.isDemoPerson === "boolean" ? data.isDemoPerson : undefined;
		const environment = typeof data.environment === "string" ? data.environment : "";
		const client = typeof data.client === "string" ? data.client : "";

		const collections = Array.isArray(data.collections)
			? data.collections.filter((c): c is string => typeof c === "string")
			: [];

		const thumbnailsRaw = Array.isArray(data.thumbnails) ? data.thumbnails : [];
		const thumbnails: { id: string; src: string }[] = [];
		for (const item of thumbnailsRaw) {
			if (!isPlainObject(item)) continue;
			const id = typeof item.id === "string" ? item.id : "";
			const thumb = typeof item.thumbnail === "string" ? item.thumbnail : "";
			if (thumb) thumbnails.push({ id, src: thumbnailToDataUrl(thumb) });
		}

		const createdAt = typeof data.createdAt === "string" ? data.createdAt : "";
		const updatedAt = typeof data.updatedAt === "string" ? data.updatedAt : "";
		const createDate = typeof data.create_date === "string" ? data.create_date : "";
		const modifiedDate = typeof data.modified_date === "string" ? data.modified_date : "";

		const extra: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(data)) {
			if (HANDLED.has(k)) continue;
			extra[k] = v;
		}

		return {
			data,
			personId,
			name,
			gender,
			dateOfBirth,
			nationality,
			notes,
			isDemoPerson,
			environment,
			client,
			collections,
			thumbnails,
			createdAt,
			updatedAt,
			createDate,
			modifiedDate,
			extra,
		};
	}, [result]);

	if (!parsed?.data) {
		return (
			<div className="space-y-5">
				<div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-6">
					<p className="text-on-surface-variant text-sm">No person object in the response.</p>
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
						onClick={onEnrollAnother}
						className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg ghost-border hover:bg-surface-container-high transition-all active:scale-95"
					>
						{primaryActionLabel}
					</button>
					<button
						type="button"
						onClick={onBackToDemos}
						className="flex-1 py-3 bg-primary-cta text-on-primary-container font-semibold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all"
					>
						Back to Demos
					</button>
				</div>
			</div>
		);
	}

	const headerTitle =
		parsed.name || (isDelete ? "Delete completed" : isUpdate ? "Person updated" : "Person enrolled");

	const headerSubtitle = isDelete
		? "Latest record returned from DELETE /persons/:id (e.g. after removing from one collection)."
		: isUpdate
			? "Latest record returned from PUT /persons/:id."
			: "Stored in your OpenCV collections.";

	return (
		<div className="space-y-5">
			<div className="rounded-2xl bg-surface-container-low border border-primary/20 p-6">
				<div className="flex items-center gap-3 mb-6">
					<span className="material-symbols-outlined text-primary text-2xl">{headerIcon}</span>
					<div>
						<p className="font-bold text-on-surface text-lg">{headerTitle}</p>
						<p className="text-sm text-on-surface-variant">{headerSubtitle}</p>
					</div>
				</div>

				{parsed.personId ? (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
						<h3 className="text-sm font-bold text-primary mb-2">Person ID</h3>
						<p className="font-mono text-sm text-on-surface break-all">{parsed.personId}</p>
					</section>
				) : null}

				<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
					<h3 className="text-sm font-bold text-primary mb-3">Profile</h3>
					<dl className="space-y-2 text-sm">
						{parsed.gender ? (
							<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1">
								<dt className="text-on-surface-variant font-medium">Gender</dt>
								<dd className="text-on-surface">{formatGender(parsed.gender)}</dd>
							</div>
						) : null}
						{parsed.dateOfBirth ? (
							<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1">
								<dt className="text-on-surface-variant font-medium">Date of birth</dt>
								<dd className="text-on-surface">{formatDob(parsed.dateOfBirth)}</dd>
							</div>
						) : null}
						{parsed.nationality ? (
							<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1">
								<dt className="text-on-surface-variant font-medium">Nationality</dt>
								<dd className="text-on-surface">{parsed.nationality}</dd>
							</div>
						) : null}
						<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1">
							<dt className="text-on-surface-variant font-medium">Notes</dt>
							<dd className="text-on-surface font-mono text-xs break-all">
								{parsed.notes === null || parsed.notes === undefined || parsed.notes === ""
									? "—"
									: String(parsed.notes)}
							</dd>
						</div>
						{parsed.isDemoPerson !== undefined ? (
							<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1">
								<dt className="text-on-surface-variant font-medium">Demo person</dt>
								<dd className="text-on-surface">{parsed.isDemoPerson ? "Yes" : "No"}</dd>
							</div>
						) : null}
						{parsed.environment ? (
							<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1">
								<dt className="text-on-surface-variant font-medium">Environment</dt>
								<dd className="font-mono text-xs text-on-surface break-all">{parsed.environment}</dd>
							</div>
						) : null}
						{parsed.client ? (
							<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1">
								<dt className="text-on-surface-variant font-medium">Client</dt>
								<dd className="font-mono text-xs text-on-surface break-all">{parsed.client}</dd>
							</div>
						) : null}
					</dl>
				</section>

				{parsed.collections.length > 0 ? (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
						<h3 className="text-sm font-bold text-primary mb-3">Collections</h3>
						<ul className="space-y-1.5 text-sm">
							{parsed.collections.map((id) => (
								<li key={id} className="font-mono text-xs text-on-surface break-all">
									{id}
								</li>
							))}
						</ul>
					</section>
				) : null}

				{parsed.thumbnails.length > 0 ? (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
						<h3 className="text-sm font-bold text-primary mb-3">Thumbnails</h3>
						<div className="flex flex-wrap gap-4">
							{parsed.thumbnails.map((t, i) => (
								<div key={t.id || i} className="flex flex-col gap-2">
									<div className="rounded-xl border border-outline-variant/20 bg-surface-container-high overflow-hidden inline-block max-w-[200px]">
										<img src={t.src} alt="Enrollment thumbnail" className="max-h-48 w-auto max-w-full object-contain" />
									</div>
									{t.id ? (
										<p className="text-[0.65rem] font-mono text-on-surface-variant break-all max-w-[200px]">{t.id}</p>
									) : null}
								</div>
							))}
						</div>
					</section>
				) : null}

				{(parsed.createdAt ||
					parsed.updatedAt ||
					parsed.createDate ||
					parsed.modifiedDate) && (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
						<h3 className="text-sm font-bold text-primary mb-3">Record</h3>
						<dl className="space-y-2 text-sm">
							{parsed.createdAt ? (
								<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1">
									<dt className="text-on-surface-variant font-medium">Created</dt>
									<dd className="text-on-surface">{formatDate(parsed.createdAt)}</dd>
								</div>
							) : null}
							{parsed.updatedAt ? (
								<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1">
									<dt className="text-on-surface-variant font-medium">Updated</dt>
									<dd className="text-on-surface">{formatDate(parsed.updatedAt)}</dd>
								</div>
							) : null}
							{parsed.createDate ? (
								<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1">
									<dt className="text-on-surface-variant font-medium">create_date</dt>
									<dd className="text-on-surface">{formatDate(parsed.createDate)}</dd>
								</div>
							) : null}
							{parsed.modifiedDate ? (
								<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1">
									<dt className="text-on-surface-variant font-medium">modified_date</dt>
									<dd className="text-on-surface">{formatDate(parsed.modifiedDate)}</dd>
								</div>
							) : null}
						</dl>
					</section>
				)}

				{Object.keys(parsed.extra).length > 0 ? (
					<section className="rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
						<h3 className="text-sm font-bold text-primary mb-3">Additional fields</h3>
						<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
							{JSON.stringify(parsed.extra, null, 2)}
						</pre>
					</section>
				) : null}
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
					onClick={onEnrollAnother}
					className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg ghost-border hover:bg-surface-container-high transition-all active:scale-95"
				>
					{primaryActionLabel}
				</button>
				<button
					type="button"
					onClick={onBackToDemos}
					className="flex-1 py-3 bg-primary-cta text-on-primary-container font-semibold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all"
				>
					Back to Demos
				</button>
			</div>
		</div>
	);
}
