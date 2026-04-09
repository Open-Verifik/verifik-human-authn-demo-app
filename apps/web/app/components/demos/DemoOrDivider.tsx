"use client";

type Props = {
	label?: string;
	className?: string;
};

export default function DemoOrDivider({ label = "or", className = "" }: Props) {
	return (
		<div className={`relative flex items-center gap-3 py-1 ${className}`} role="separator" aria-label="Alternative option">
			<div className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/50 to-transparent" />
			<span className="shrink-0 rounded-full border border-outline-variant/40 bg-surface-container-high px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-outline-variant">
				{label}
			</span>
			<div className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/50 to-transparent" />
		</div>
	);
}
