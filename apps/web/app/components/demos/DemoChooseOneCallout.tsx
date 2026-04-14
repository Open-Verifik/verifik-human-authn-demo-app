"use client";

import { useTranslations } from "next-intl";

type Props = {
	title?: string;
	description: string;
	className?: string;
};

export default function DemoChooseOneCallout({
	title,
	description,
	className = "",
}: Props) {
	const t = useTranslations("demos.common");
	const resolvedTitle = title ?? t("chooseOneDefaultTitle");

	return (
		<div className={`rounded-xl border border-outline-variant/25 bg-surface-container-low/40 px-4 py-3 text-center sm:px-6 ${className}`}>
			<p className="label-meta mb-1 text-primary">{resolvedTitle}</p>
			<p className="text-sm text-on-surface-variant">{description}</p>
		</div>
	);
}
