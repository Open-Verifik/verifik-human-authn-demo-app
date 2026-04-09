"use client";

type Props = {
	title?: string;
	description: string;
	className?: string;
};

export default function DemoChooseOneCallout({
	title = "Choose one",
	description,
	className = "",
}: Props) {
	return (
		<div className={`rounded-xl border border-outline-variant/25 bg-surface-container-low/40 px-4 py-3 text-center sm:px-6 ${className}`}>
			<p className="label-meta mb-1 text-primary">{title}</p>
			<p className="text-sm text-on-surface-variant">{description}</p>
		</div>
	);
}
