"use client";

import { useEffect, useId, useRef } from "react";
import clsx from "clsx";

export type DemoConfirmModalProps = {
	open: boolean;
	title: string;
	description: string;
	confirmLabel: string;
	cancelLabel?: string;
	/** @default "danger" */
	variant?: "danger" | "default";
	onConfirm: () => void;
	onCancel: () => void;
};

export default function DemoConfirmModal({
	open,
	title,
	description,
	confirmLabel,
	cancelLabel = "Cancel",
	variant = "danger",
	onConfirm,
	onCancel,
}: DemoConfirmModalProps) {
	const titleId = useId();
	const confirmRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!open) return;
		const t = requestAnimationFrame(() => confirmRef.current?.focus());
		return () => cancelAnimationFrame(t);
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				onCancel();
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onCancel]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
			role="presentation"
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className="w-full max-w-md rounded-2xl border border-outline-variant/25 bg-surface-container-low shadow-xl shadow-black/30"
			>
				<div className="p-6 space-y-4">
					<h2 id={titleId} className="text-lg font-bold text-on-surface tracking-tight">
						{title}
					</h2>
					<p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
					<div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
						<button
							type="button"
							onClick={onCancel}
							className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg ghost-border hover:bg-surface-container-high transition-all active:scale-[0.98]"
						>
							{cancelLabel}
						</button>
						<button
							ref={confirmRef}
							type="button"
							onClick={onConfirm}
							className={clsx(
								"flex-1 py-3 font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-[0.98] transition-all",
								variant === "danger"
									? "bg-error text-white"
									: "bg-primary-cta text-on-primary-container",
							)}
						>
							{confirmLabel}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
