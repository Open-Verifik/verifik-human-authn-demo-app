"use client";

import { useTranslations } from "next-intl";

type Props = {
	label?: string;
	className?: string;
};

export default function DemoOrDivider({ label, className = "" }: Props) {
	const t = useTranslations("demos.common");
	const resolvedLabel = label ?? t("orDivider");

	return (
		<div className={`relative flex items-center gap-3 py-1 ${className}`} role="separator" aria-label={t("orDividerAria")}>
			<div className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/50 to-transparent" />
			<span className="shrink-0 rounded-full border border-outline-variant/40 bg-surface-container-high px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/80">
				{resolvedLabel}
			</span>
			<div className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/50 to-transparent" />
		</div>
	);
}
