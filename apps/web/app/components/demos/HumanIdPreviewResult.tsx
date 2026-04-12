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

function formatPasswordLayer(value: string): string {
	const normalized = value.trim();
	const map: Record<string, string> = {
		NoPassword: "No password",
		HasPassword: "Password required",
	};
	return map[normalized] ?? normalized;
}

function KeyValueBlock({ title, obj, idSuffix }: { title: string; obj: Record<string, unknown>; idSuffix: string }) {
	const entries = Object.entries(obj).filter(([, v]) => v !== undefined && v !== null);
	if (entries.length === 0) return null;
	const headingId = `preview-kv-${idSuffix}`;
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

const PREVIEW_DATA_HANDLED = new Set(["publicData", "passwordLayer", "requireLiveness"]);

export type HumanIdPreviewResultProps = {
	result: Record<string, unknown> | null;
	onPreviewAnother: () => void;
	onBackToDemos: () => void;
};

export default function HumanIdPreviewResult({ result, onPreviewAnother, onBackToDemos }: HumanIdPreviewResultProps) {
	const parsed = useMemo(() => {
		if (!result) return null;
		const data = isPlainObject(result.data) ? result.data : null;
		const publicData = isPlainObject(data?.publicData) ? data.publicData : null;
		const passwordLayer = typeof data?.passwordLayer === "string" ? data.passwordLayer : undefined;
		const requireLiveness = typeof data?.requireLiveness === "boolean" ? data.requireLiveness : undefined;
		const extraData: Record<string, unknown> = {};
		if (data) {
			for (const [k, v] of Object.entries(data)) {
				if (PREVIEW_DATA_HANDLED.has(k)) continue;
				extraData[k] = v;
			}
		}
		return { data, publicData, passwordLayer, requireLiveness, extraData };
	}, [result]);

	const hasSummaryRow =
		parsed?.passwordLayer !== undefined || parsed?.requireLiveness !== undefined || Object.keys(parsed?.extraData ?? {}).length > 0;

	return (
		<div className="space-y-5">
			<div className="rounded-2xl bg-surface-container-low border border-primary/20 p-6">
				<div className="flex items-center gap-3 mb-6">
					<span className="material-symbols-outlined text-primary text-2xl">preview</span>
					<div>
						<p className="font-bold text-on-surface text-lg">HumanID preview</p>
						<p className="text-sm text-on-surface-variant">Public metadata and requirements from your ZelfProof.</p>
					</div>
				</div>

				{hasSummaryRow ? (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
						<h3 className="text-sm font-bold text-primary mb-3">Summary</h3>
						<dl className="space-y-2 text-sm">
							{parsed?.passwordLayer !== undefined ? (
								<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1">
									<dt className="text-on-surface-variant font-medium">Password layer</dt>
									<dd className="text-on-surface">{formatPasswordLayer(parsed.passwordLayer)}</dd>
								</div>
							) : null}
							{parsed?.requireLiveness !== undefined ? (
								<div className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1">
									<dt className="text-on-surface-variant font-medium">Liveness required</dt>
									<dd className="text-on-surface">{parsed.requireLiveness ? "Yes" : "No"}</dd>
								</div>
							) : null}
							{Object.entries(parsed?.extraData ?? {}).map(([k, v]) => (
								<div key={k} className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1">
									<dt className="text-on-surface-variant font-medium">{k}</dt>
									<dd className="font-mono text-xs text-on-surface break-all">
										{isPlainObject(v) ? (
											<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">
												{JSON.stringify(v, null, 2)}
											</pre>
										) : (
											formatDisplayValue(v)
										)}
									</dd>
								</div>
							))}
						</dl>
					</section>
				) : null}

				{parsed?.publicData ? <KeyValueBlock title="Public data" idSuffix="public" obj={parsed.publicData} /> : null}
			</div>

			<details className="rounded-xl border border-outline-variant/20 bg-surface-container-low/50 px-4 py-3 group">
				<summary className="cursor-pointer list-none font-bold text-sm text-on-surface-variant flex items-center justify-between gap-2">
					<span>Raw response (debug)</span>
					<span className="material-symbols-outlined text-on-surface-variant/70 group-open:rotate-180 transition-transform text-lg">
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
					onClick={onPreviewAnother}
					className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg ghost-border hover:bg-surface-container-high transition-all active:scale-95"
				>
					Preview Another
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
