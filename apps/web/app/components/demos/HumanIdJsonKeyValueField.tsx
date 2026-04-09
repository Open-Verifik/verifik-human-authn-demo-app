"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

type Mode = "json" | "rows";

export interface HumanIdJsonKeyValueFieldProps {
	label: string;
	required?: boolean;
	hint?: string;
	value: Record<string, string>;
	onChange: (next: Record<string, string>) => void;
	defaultMode?: Mode;
}
/** Call before submit so JSON mode drafts are parsed, formatted, and synced to parent state. */
export interface HumanIdJsonKeyValueFieldHandle {
	/** Rows: synced record. JSON: parse/format draft; returns null if invalid. */
	commitJsonIfNeeded: () => Record<string, string> | null;
}


type Row = { id: string; key: string; value: string };

function newRow(): Row {
	return { id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, key: "", value: "" };
}

function recordToRows(rec: Record<string, string>): Row[] {
	const entries = Object.entries(rec);
	if (entries.length === 0) return [newRow()];
	return entries.map(([key, value]) => ({
		id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${key}-${Math.random()}`,
		key,
		value,
	}));
}

function rowsToRecord(rows: Row[]): Record<string, string> {
	const out: Record<string, string> = {};
	for (const r of rows) {
		const k = r.key.trim();
		if (!k) continue;
		out[k] = r.value;
	}
	return out;
}

function parseStringRecord(text: string): { ok: true; data: Record<string, string> } | { ok: false; error: string } {
	try {
		const parsed = JSON.parse(text) as unknown;
		if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
			return { ok: false, error: "Must be a JSON object (not an array)." };
		}
		const out: Record<string, string> = {};
		for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
			if (typeof v === "string") {
				out[k] = v;
			} else if (v === null || v === undefined) {
				out[k] = "";
			} else if (typeof v === "object") {
				out[k] = JSON.stringify(v);
			} else {
				out[k] = String(v);
			}
		}
		return { ok: true, data: out };
	} catch {
		return { ok: false, error: "Invalid JSON." };
	}
}

function prettyStringify(rec: Record<string, string>): string {
	return JSON.stringify(rec, null, 2);
}

const HumanIdJsonKeyValueField = forwardRef<HumanIdJsonKeyValueFieldHandle, HumanIdJsonKeyValueFieldProps>(
	function HumanIdJsonKeyValueField({ label, required, hint, value, onChange, defaultMode = "rows" }, ref) {
	const [mode, setMode] = useState<Mode>(defaultMode);
	const [jsonDraft, setJsonDraft] = useState(() => prettyStringify(value));
	const [rows, setRows] = useState<Row[]>(() => recordToRows(value));
	const [jsonError, setJsonError] = useState<string | null>(null);
	const lastSerializedValue = useRef(JSON.stringify(value));

	const modeRef = useRef(mode);
	const jsonDraftRef = useRef(jsonDraft);
	const rowsRef = useRef(rows);
	modeRef.current = mode;
	jsonDraftRef.current = jsonDraft;
	rowsRef.current = rows;

	const syncFromProp = useCallback(() => {
		const s = JSON.stringify(value);
		if (s === lastSerializedValue.current) return;
		lastSerializedValue.current = s;
		setJsonDraft(prettyStringify(value));
		setRows(recordToRows(value));
		setJsonError(null);
	}, [value]);

	useEffect(() => {
		syncFromProp();
	}, [syncFromProp]);

	const applyJsonAndNotify = useCallback(
		(text: string) => {
			const result = parseStringRecord(text);
			if (!result.ok) {
				setJsonError(result.error);
				return false;
			}
			setJsonError(null);
			lastSerializedValue.current = JSON.stringify(result.data);
			onChange(result.data);
			setJsonDraft(prettyStringify(result.data));
			return true;
		},
		[onChange],
	);

	useImperativeHandle(
		ref,
		() => ({
			commitJsonIfNeeded: (): Record<string, string> | null => {
				if (modeRef.current === "rows") {
					const rec = rowsToRecord(rowsRef.current);
					lastSerializedValue.current = JSON.stringify(rec);
					onChange(rec);
					return rec;
				}
				const result = parseStringRecord(jsonDraftRef.current);
				if (!result.ok) {
					setJsonError(result.error);
					return null;
				}
				setJsonError(null);
				lastSerializedValue.current = JSON.stringify(result.data);
				onChange(result.data);
				setJsonDraft(prettyStringify(result.data));
				return result.data;
			},
		}),
		[onChange],
	);

	const switchToRows = () => {
		if (mode === "rows") return;
		const result = parseStringRecord(jsonDraft);
		if (!result.ok) {
			setJsonError(result.error);
			return;
		}
		setJsonError(null);
		lastSerializedValue.current = JSON.stringify(result.data);
		onChange(result.data);
		setRows(recordToRows(result.data));
		setMode("rows");
	};

	const switchToJson = () => {
		if (mode === "json") return;
		const rec = rowsToRecord(rows);
		onChange(rec);
		lastSerializedValue.current = JSON.stringify(rec);
		setJsonDraft(prettyStringify(rec));
		setJsonError(null);
		setMode("json");
	};

	const handleRowChange = (id: string, field: "key" | "value", next: string) => {
		setRows((prev) => {
			const nextRows = prev.map((r) => (r.id === id ? { ...r, [field]: next } : r));
			const rec = rowsToRecord(nextRows);
			lastSerializedValue.current = JSON.stringify(rec);
			onChange(rec);
			return nextRows;
		});
	};

	const addRow = () => {
		setRows((prev) => {
			const nextRows = [...prev, newRow()];
			const rec = rowsToRecord(nextRows);
			lastSerializedValue.current = JSON.stringify(rec);
			onChange(rec);
			return nextRows;
		});
	};

	const removeRow = (id: string) => {
		setRows((prev) => {
			const nextRows = prev.filter((r) => r.id !== id);
			const finalRows = nextRows.length ? nextRows : [newRow()];
			const rec = rowsToRecord(finalRows);
			lastSerializedValue.current = JSON.stringify(rec);
			onChange(rec);
			return finalRows;
		});
	};

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<label className="block text-sm font-semibold text-on-surface">
					{label} {required ? <span className="text-error">*</span> : null}
				</label>
				<div
					className="inline-flex rounded-lg border border-outline-variant/30 bg-surface-container-high/50 p-0.5"
					role="group"
					aria-label={`${label} input mode`}
				>
					<button
						type="button"
						onClick={() => {
							switchToRows();
						}}
						className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
							mode === "rows"
								? "bg-primary text-on-primary shadow-sm"
								: "text-on-surface-variant hover:text-on-surface"
						}`}
					>
						Key / value
					</button>
					<button
						type="button"
						onClick={() => {
							switchToJson();
						}}
						className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
							mode === "json"
								? "bg-primary text-on-primary shadow-sm"
								: "text-on-surface-variant hover:text-on-surface"
						}`}
					>
						JSON
					</button>
				</div>
			</div>
			{hint ? <p className="text-xs text-on-surface-variant">{hint}</p> : null}

			{mode === "json" ? (
				<div className="space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={() => applyJsonAndNotify(jsonDraft)}
							className="text-xs font-semibold text-primary underline underline-offset-2"
						>
							Format & validate
						</button>
						<span className="text-[0.65rem] text-on-surface-variant">Values are stored as strings for the API.</span>
					</div>
					<textarea
						value={jsonDraft}
						onChange={(e) => {
							setJsonDraft(e.target.value);
							setJsonError(null);
						}}
						onBlur={() => applyJsonAndNotify(jsonDraft)}
						spellCheck={false}
						rows={12}
						className="w-full min-h-[12rem] rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-3 font-mono text-[0.8rem] leading-relaxed text-on-surface shadow-inner focus:border-primary/60 focus:outline-none"
						aria-invalid={!!jsonError}
					/>
					{jsonError ? <p className="text-xs text-error">{jsonError}</p> : null}
				</div>
			) : (
				<div className="space-y-2 rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-3">
					<div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[0.65rem] font-semibold uppercase tracking-wide text-on-surface-variant">
						<span>Key</span>
						<span>Value</span>
						<span className="sr-only">Remove</span>
					</div>
					{rows.map((r) => (
						<div key={r.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
							<input
								type="text"
								value={r.key}
								onChange={(e) => handleRowChange(r.id, "key", e.target.value)}
								placeholder="fieldName"
								className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface placeholder:text-outline-variant focus:border-primary/60 focus:outline-none"
							/>
							<input
								type="text"
								value={r.value}
								onChange={(e) => handleRowChange(r.id, "value", e.target.value)}
								placeholder="value"
								className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-sm text-on-surface placeholder:text-outline-variant focus:border-primary/60 focus:outline-none"
							/>
							<button
								type="button"
								onClick={() => removeRow(r.id)}
								className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-error-container/20 hover:text-error"
								aria-label="Remove row"
							>
								<span className="material-symbols-outlined text-lg">close</span>
							</button>
						</div>
					))}
					<button
						type="button"
						onClick={addRow}
						className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
					>
						<span className="material-symbols-outlined text-base">add</span>
						Add field
					</button>
				</div>
			)}
		</div>
	);
	},
);

export default HumanIdJsonKeyValueField;
