"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import type { FaceCollectionListItem } from "@humanauthn/api-client";

function truncateCode(code: string, max = 14) {
	if (code.length <= max) return code;
	return `${code.slice(0, max)}…`;
}

function matchesSearch(item: FaceCollectionListItem, q: string) {
	if (!q.trim()) return true;
	const s = q.trim().toLowerCase();
	const hay = [item.name, item.code, item.description ?? ""].join(" ").toLowerCase();
	return hay.includes(s);
}

export type CollectionMultiSelectProps = {
	items: FaceCollectionListItem[];
	selectedIds: string[];
	onChange: (ids: string[]) => void;
	disabled?: boolean;
	loading?: boolean;
	emptySlot?: React.ReactNode;
	labelId?: string;
};

export function CollectionMultiSelect({
	items,
	selectedIds,
	onChange,
	disabled,
	loading,
	emptySlot,
	labelId,
}: CollectionMultiSelectProps) {
	const t = useTranslations("demos.common");
	const listId = useId();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const rootRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);

	const byId = useMemo(() => {
		const m = new Map<string, FaceCollectionListItem>();
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

	const toggle = (id: string) => {
		if (selectedIds.includes(id)) {
			onChange(selectedIds.filter((x) => x !== id));
		} else {
			onChange([...selectedIds, id]);
		}
	};

	const remove = (id: string) => {
		onChange(selectedIds.filter((x) => x !== id));
	};

	const summary =
		selectedIds.length === 0 ? t("selectCollections") : t("collectionsSelected", { count: selectedIds.length });

	return (
		<div ref={rootRef} className="space-y-2">
			<div className="flex flex-wrap gap-2 min-h-[2.25rem]">
				{selectedIds.map((id) => {
					const it = byId.get(id);
					const label = it?.name ?? id;
					return (
						<span
							key={id}
							className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-primary/15 text-on-surface text-xs font-medium border border-primary/25"
						>
							<span className="max-w-[200px] truncate">{label}</span>
							<button
								type="button"
								onClick={() => remove(id)}
								disabled={disabled}
								className="shrink-0 p-0.5 rounded hover:bg-primary/20 text-on-surface-variant disabled:opacity-50"
								aria-label={t("removeItemAria", { label })}
							>
								<span className="material-symbols-outlined text-[16px]">close</span>
							</button>
						</span>
					);
				})}
			</div>

			<div className="relative">
				<button
					type="button"
					{...(labelId ? { id: labelId } : {})}
					disabled={disabled || loading}
					aria-haspopup="listbox"
					aria-expanded={open}
					aria-controls={open ? listId : undefined}
					aria-multiselectable="true"
					onClick={() => !disabled && !loading && setOpen((o) => !o)}
					className={clsx(
						"w-full flex items-center justify-between gap-2 bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-left text-sm text-on-surface focus:outline-none focus:border-primary/60 transition-colors",
						(disabled || loading) && "opacity-50 cursor-not-allowed",
					)}
				>
					<span className={clsx(selectedIds.length === 0 && "text-on-surface-variant")}>{loading ? t("loadingCollections") : summary}</span>
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
							<div className="px-4 py-6 text-sm text-on-surface-variant text-center">{emptySlot ?? t("noCollectionsAvailable")}</div>
						) : (
							<>
								<div className="shrink-0 border-b border-outline-variant/20 p-2">
									<label htmlFor={`${listId}-search`} className="sr-only">
										{t("searchCollectionsSr")}
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
											placeholder={t("searchCollectionsPlaceholder")}
											className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-high/50 py-2 pl-9 pr-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50 focus:border-primary/60"
										/>
									</div>
								</div>
								<ul
									id={listId}
									role="listbox"
									aria-label={t("collectionsListAria")}
									className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
								>
									{filtered.length === 0 ? (
										<li className="px-3 py-6 text-center text-xs text-on-surface-variant">{t("noMatches")}</li>
									) : (
										filtered.map((it) => {
											const checked = selectedIds.includes(it._id);
											return (
												<li key={it._id} role="option" aria-selected={checked} className="px-1">
													<label
														className={clsx(
															"flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
															checked ? "bg-primary/10" : "hover:bg-surface-container-high/80",
														)}
													>
														<input
															type="checkbox"
															className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-variant text-primary focus:ring-primary/40"
															checked={checked}
															onChange={() => toggle(it._id)}
														/>
														<span className="min-w-0 flex-1">
															<span className="font-medium text-on-surface block truncate">{it.name}</span>
															<span className="text-xs text-on-surface-variant font-mono">{truncateCode(it.code)}</span>
														</span>
													</label>
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
		</div>
	);
}
