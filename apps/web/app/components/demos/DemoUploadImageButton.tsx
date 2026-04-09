"use client";

type Props = {
	onClick: () => void;
	id?: string;
	primaryText: string;
	secondaryText?: string;
	icon?: string;
	className?: string;
};

export default function DemoUploadImageButton({
	onClick,
	id,
	primaryText,
	secondaryText,
	icon = "upload_file",
	className = "",
}: Props) {
	return (
		<button
			type="button"
			id={id}
			onClick={onClick}
			className={`flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/35 bg-surface-container/80 px-6 py-5 text-on-surface font-semibold shadow-sm transition-colors hover:border-primary/55 hover:bg-surface-bright active:scale-[0.99] ${className}`}
		>
			<span className="material-symbols-outlined text-primary" aria-hidden>
				{icon}
			</span>
			<span className="text-left">
				<span className="block">{primaryText}</span>
				{secondaryText ? <span className="mt-0.5 block text-xs font-normal text-on-surface-variant">{secondaryText}</span> : null}
			</span>
		</button>
	);
}
