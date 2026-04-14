"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import type { PersonListItem } from "@humanauthn/api-client";

function truncateId(id: string, max = 14) {
	if (id.length <= max) return id;
	return `${id.slice(0, max)}…`;
}

function matchesSearch(item: PersonListItem, q: string) {
	if (!q.trim()) return true;
	const s = q.trim().toLowerCase();
	const hay = [item.name, item._id].join(" ").toLowerCase();
	return hay.includes(s);
}

export type PersonSingleSelectProps = {
	items: PersonListItem[];
	selectedId: string | null;
	onChange: (id: string) => void;
	disabled?: boolean;
	loading?: boolean;
	error?: string | null;
	emptySlot?: React.ReactNode;
	labelId?: string;
};

export function PersonSingleSelect({
	items,
	selectedId,
	onChange,
	disabled,
	loading,
	error,
	emptySlot,
	labelId,
}: PersonSingleSelectProps) {
	const t = useTranslations("demos.common");
	const listId = useId();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const rootRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);

	const byId = useMemo(() => {
		const m = new Map<string, PersonListItem>();
		for (const it of items) m.set(it._id, it);
		return m;
	}, [items]);

	const filtered = useMemo(() => items.filter((it) => matchesSearch(it, search)), [items, search]);

	const close = useCallback(() => {
		setOpen(false);
		setSearch("");
	}, []);

	useEffect(() => {
		if (!open) return;
		const t = requestAnimationFrame(() => searchRef.current?.focus());
		return () => cancelAnimationFrame(t);
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const onDoc = (e: MouseEvent) => {
			if (!rootRef.current?.contains(e.target as Node)) close();
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [open, close]);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				close();
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, close]);

	const selected = selectedId ? byId.get(selectedId) : undefined;
	const summary = selected ? selected.name || truncateId(selected._id) : t("selectPerson");

	const pick = (id: string) => {
		onChange(id);
		close();
	};

	return (
		<div ref={rootRef} className="space-y-2">
			<div className="relative">
				<button
					type="button"
					{...(labelId ? { id: labelId } : {})}
					disabled={disabled || loading}
					aria-haspopup="listbox"
					aria-expanded={open}
					aria-controls={open ? listId : undefined}
					onClick={() => !disabled && !loading && setOpen((o) => !o)}
					className={clsx(
						"w-full flex items-center justify-between gap-2 bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-left text-sm text-on-surface focus:outline-none focus:border-primary/60 transition-colors",
						(disabled || loading) && "opacity-50 cursor-not-allowed",
					)}
				>
					<span className={clsx(!selected && "text-on-surface-variant")}>{loading ? t("loadingPeople") : summary}</span>
					<span className="material-symbols-outlined text-on-surface-variant/70 shrink-0">
						{open ? "expand_less" : "expand_more"}
					</span>
				</button>

				{open && !loading && (
					<div
						className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 flex max-h-[min(320px,calc(100vh-220px))] flex-col overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-low shadow-lg"
						role="presentation"
					>
						{items.length === 0 ? (
							<div className="px-4 py-6 text-sm text-on-surface-variant text-center">{emptySlot ?? t("noPeopleInProject")}</div>
						) : (
							<>
								<div className="shrink-0 border-b border-outline-variant/20 p-2">
									<label htmlFor={`${listId}-search`} className="sr-only">
										{t("searchPeopleSr")}
									</label>
									<div className="relative">
										<span
											className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant/70"
											aria-hidden
										>
											search
										</span>
										<input
											ref={searchRef}
											id={`${listId}-search`}
											type="search"
											autoComplete="off"
											value={search}
											onChange={(e) => setSearch(e.target.value)}
											placeholder={t("searchPeoplePlaceholder")}
											className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-high/50 py-2 pl-9 pr-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:border-primary/60"
										/>
									</div>
								</div>
								<ul
									id={listId}
									role="listbox"
									aria-label={t("peopleListAria")}
									className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
								>
									{filtered.length === 0 ? (
										<li className="px-3 py-6 text-center text-xs text-on-surface-variant">{t("noMatches")}</li>
									) : (
										filtered.map((it) => {
											const checked = selectedId === it._id;
											return (
												<li key={it._id} role="option" aria-selected={checked} className="px-1">
													<button
														type="button"
														onClick={() => pick(it._id)}
														className={clsx(
															"w-full flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
															checked ? "bg-primary/10" : "hover:bg-surface-container-high/80",
														)}
													>
														<span
															className={clsx(
																"mt-0.5 h-4 w-4 shrink-0 rounded-full border border-outline-variant flex items-center justify-center",
																checked && "border-primary bg-primary",
															)}
															aria-hidden
														>
															{checked ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
														</span>
														<span className="min-w-0 flex-1">
															<span className="font-medium text-on-surface block truncate">{it.name || t("emDash")}</span>
															<span className="text-xs text-on-surface-variant font-mono">{truncateId(it._id)}</span>
														</span>
													</button>
												</li>
											);
										})
									)}
								</ul>
							</>
						)}
					</div>
				)}
			</div>
			{error ? (
				<p className="text-sm text-error flex items-center gap-1">
					<span className="material-symbols-outlined text-sm">error_outline</span>
					{error}
				</p>
			) : null}
		</div>
	);
}
