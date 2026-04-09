"use client";

import { useMemo } from "react";

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === "object" && !Array.isArray(v);
}

function formatDisplayValue(v: unknown): string {
	if (v === null || v === undefined) return "";
	if (typeof v === "boolean") return v ? "Yes" : "No";
	if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
	if (typeof v === "string") return v;
	return JSON.stringify(v);
}

function faceCropToDataUrl(base64: string): string {
	const t = base64.trim();
	if (t.startsWith("data:")) return t;
	if (t.startsWith("/9j/") || t.startsWith("iVBOR")) {
		const mime = t.startsWith("/9j/") ? "image/jpeg" : "image/png";
		return `data:${mime};base64,${t}`;
	}
	return `data:image/jpeg;base64,${t}`;
}

function KeyValueBlock({ title, obj, idSuffix }: { title: string; obj: Record<string, unknown>; idSuffix: string }) {
	const entries = Object.entries(obj).filter(([, v]) => v !== undefined && v !== null);
	if (entries.length === 0) return null;
	const headingId = `decrypt-kv-${idSuffix}`;
	return (
		<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4" aria-labelledby={headingId}>
			<h3 id={headingId} className="text-sm font-bold text-primary mb-3">
				{title}
			</h3>
			<dl className="space-y-2 text-sm">
				{entries.map(([k, v]) => (
					<div
						key={k}
						className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1 border-b border-outline-variant/10 pb-2 last:border-0 last:pb-0"
					>
						<dt className="text-on-surface-variant font-medium">{k}</dt>
						<dd className="font-mono text-xs text-on-surface break-all">{formatDisplayValue(v)}</dd>
					</div>
				))}
			</dl>
		</section>
	);
}

function CreditsBlock({ credits }: { credits: Record<string, unknown> }) {
	const amt = typeof credits.amount === "number" ? credits.amount : null;
	const extra = [
		["status", credits.status],
		["category", credits.category],
		["code", credits.code],
		["product", credits.product],
		["group", credits.group],
		["expensesGroup", credits.expensesGroup],
		["createdAt", credits.createdAt],
		["updatedAt", credits.updatedAt],
	] as const;
	return (
		<>
			{amt === null ? null : amt < 0 ? (
				<p className="text-on-surface">
					Charged: <span className="font-bold tabular-nums">{Math.abs(amt)}</span> credits
				</p>
			) : (
				<p className="text-on-surface">
					Credit change: <span className="font-bold tabular-nums">{amt}</span>
				</p>
			)}
			<dl className="mt-3 space-y-1.5 text-sm">
				{extra.map(([k, v]) => {
					if (v === undefined || v === null) return null;
					return (
						<div key={k} className="flex flex-wrap gap-x-2 gap-y-0.5">
							<dt className="text-on-surface-variant shrink-0">{k}</dt>
							<dd className="font-mono text-xs text-on-surface break-all">{formatDisplayValue(v)}</dd>
						</div>
					);
				})}
			</dl>
		</>
	);
}

export type HumanIdDecryptResultProps = {
	result: Record<string, unknown> | null;
	onTryAgain: () => void;
	onBackToDemos: () => void;
};

export default function HumanIdDecryptResult({ result, onTryAgain, onBackToDemos }: HumanIdDecryptResultProps) {
	const parsed = useMemo(() => {
		if (!result) return null;
		const data = isPlainObject(result.data) ? result.data : null;
		const identifier = typeof data?.identifier === "string" ? data.identifier : "";
		const publicData = isPlainObject(data?.publicData) ? data.publicData : null;
		const metadata = isPlainObject(data?.metadata) ? data.metadata : null;
		const faceCropBase64 = typeof data?.faceCropBase64 === "string" ? data.faceCropBase64 : "";
		const difficulty = typeof data?.difficulty === "string" ? data.difficulty : undefined;
		const credits = isPlainObject(result.credits) ? result.credits : null;
		const charged = typeof result.charged === "boolean" ? result.charged : undefined;
		const requiredLiveness = typeof result.requiredLiveness === "boolean" ? result.requiredLiveness : undefined;
		return { data, identifier, publicData, metadata, faceCropBase64, difficulty, credits, charged, requiredLiveness };
	}, [result]);

	return (
		<div className="space-y-5">
			<div className="rounded-2xl bg-surface-container-low border border-primary/20 p-6">
				<div className="flex items-center gap-3 mb-6">
					<span className="material-symbols-outlined text-primary text-2xl">lock_open</span>
					<div>
						<p className="font-bold text-on-surface text-lg">HumanID decrypted</p>
						<p className="text-sm text-on-surface-variant">Identity data recovered from your ZelfProof.</p>
					</div>
				</div>

				{parsed?.identifier ? (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
						<h3 className="text-sm font-bold text-primary mb-2">Identifier</h3>
						<p className="font-mono text-sm text-on-surface break-all">{parsed.identifier}</p>
					</section>
				) : null}

				{parsed?.publicData ? <KeyValueBlock title="Public data" idSuffix="public" obj={parsed.publicData} /> : null}

				{parsed?.metadata && Object.keys(parsed.metadata).length > 0 ? (
					<KeyValueBlock title="Metadata" idSuffix="metadata" obj={parsed.metadata} />
				) : null}

				{parsed?.difficulty ? (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
						<h3 className="text-sm font-bold text-primary mb-1">Difficulty</h3>
						<p className="text-sm text-on-surface font-medium">{parsed.difficulty}</p>
					</section>
				) : null}

				{parsed?.faceCropBase64 ? (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
						<h3 className="text-sm font-bold text-primary mb-3">Face crop</h3>
						<div className="rounded-xl border border-outline-variant/20 bg-surface-container-high overflow-hidden inline-block max-w-full">
							<img
								src={faceCropToDataUrl(parsed.faceCropBase64)}
								alt="Decoded face crop from proof"
								className="max-h-64 w-auto max-w-full object-contain"
							/>
						</div>
					</section>
				) : null}

				{(parsed?.charged !== undefined || parsed?.requiredLiveness !== undefined) && (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
						<h3 className="text-sm font-bold text-primary mb-3">Session</h3>
						<dl className="space-y-2 text-sm">
							{parsed.charged !== undefined ? (
								<div className="flex flex-wrap gap-x-2">
									<dt className="text-on-surface-variant">Charged</dt>
									<dd className="text-on-surface">{parsed.charged ? "Yes" : "No"}</dd>
								</div>
							) : null}
							{parsed.requiredLiveness !== undefined ? (
								<div className="flex flex-wrap gap-x-2">
									<dt className="text-on-surface-variant">Liveness required</dt>
									<dd className="text-on-surface">{parsed.requiredLiveness ? "Yes" : "No"}</dd>
								</div>
							) : null}
						</dl>
					</section>
				)}

				{parsed?.credits && Object.keys(parsed.credits).length > 0 ? (
					<section className="rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
						<h3 className="text-sm font-bold text-primary mb-3">Credits / usage</h3>
						<CreditsBlock credits={parsed.credits} />
					</section>
				) : null}
			</div>

			<details className="rounded-xl border border-outline-variant/20 bg-surface-container-low/50 px-4 py-3 group">
				<summary className="cursor-pointer list-none font-bold text-sm text-on-surface-variant flex items-center justify-between gap-2">
					<span>Raw response (debug)</span>
					<span className="material-symbols-outlined text-outline-variant group-open:rotate-180 transition-transform text-lg">
						expand_more
					</span>
				</summary>
				<pre className="mt-3 text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
					{result ? JSON.stringify(result, null, 2) : ""}
				</pre>
			</details>

			<div className="flex gap-3">
				<button
					type="button"
					onClick={onTryAgain}
					className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg ghost-border hover:bg-surface-container-high transition-all active:scale-95"
				>
					Try Again
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
