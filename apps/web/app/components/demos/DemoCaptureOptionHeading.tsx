"use client";

type Props = {
	label: "A" | "B";
	title: string;
	subtitle: string;
	id?: string;
	className?: string;
};

export default function DemoCaptureOptionHeading({
	label,
	title,
	subtitle,
	id,
	className = "",
}: Props) {
	return (
		<div className={`mb-3 flex items-center gap-2 ${className}`}>
			<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary" aria-hidden>
				{label}
			</span>
			<div>
				<h3 id={id} className="text-sm font-bold tracking-tight text-on-surface">
					{title}
				</h3>
				<p className="text-xs text-on-surface-variant">{subtitle}</p>
			</div>
		</div>
	);
}
