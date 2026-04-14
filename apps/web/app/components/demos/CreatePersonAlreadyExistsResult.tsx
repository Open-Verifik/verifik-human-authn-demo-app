"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export type CreatePersonAlreadyExistsResultProps = {
	/** Preview URLs (blob or data URLs) for images the user attempted to enroll. */
	previews: string[];
	onEditForm: () => void;
	onBackToDemos: () => void;
};

export default function CreatePersonAlreadyExistsResult({
	previews,
	onEditForm,
	onBackToDemos,
}: CreatePersonAlreadyExistsResultProps) {
	const t = useTranslations("demos.alreadyEnrolled");

	return (
		<div className="space-y-5">
			<div className="rounded-2xl bg-surface-container-low border border-error/25 p-6">
				<div className="flex items-start gap-3 mb-6">
					<span className="material-symbols-outlined text-error text-2xl shrink-0">person_off</span>
					<div>
						<p className="font-bold text-on-surface text-lg">{t("title")}</p>
						<p className="text-sm text-on-surface-variant mt-1">
							{t.rich("body", {
								code: (chunks) => <code className="text-primary font-mono text-xs">{chunks}</code>,
							})}
						</p>
					</div>
				</div>

				{previews.length > 0 ? (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
						<h3 className="text-sm font-bold text-primary mb-3">{t("imagesHeading")}</h3>
						<div className="flex flex-wrap gap-4">
							{previews.map((src, i) => (
								<div
									key={i}
									className="rounded-xl border border-outline-variant/20 bg-surface-container-high overflow-hidden inline-block max-w-[220px]"
								>
									<img src={src} alt="" className="max-h-56 w-auto max-w-full object-contain" />
								</div>
							))}
						</div>
					</section>
				) : null}

				<section className="rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
					<h3 className="text-sm font-bold text-primary mb-3">{t("nextSteps")}</h3>
					<ul className="space-y-3 text-sm text-on-surface-variant">
						<li className="flex flex-wrap items-center gap-2">
							<span className="material-symbols-outlined text-primary text-lg">edit</span>
							<Link href="/demos/update-person" className="text-primary font-semibold underline underline-offset-2">
								{t("updateDemo")}
							</Link>
							<span>{t("updateHint")}</span>
						</li>
						<li className="flex flex-wrap items-center gap-2">
							<span className="material-symbols-outlined text-primary text-lg">delete</span>
							<Link href="/demos/delete-person" className="text-primary font-semibold underline underline-offset-2">
								{t("deleteDemo")}
							</Link>
							<span>{t("deleteHint")}</span>
						</li>
					</ul>
				</section>
			</div>

			<div className="flex flex-col sm:flex-row gap-3">
				<button
					type="button"
					onClick={onEditForm}
					className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg ghost-border hover:bg-surface-container-high transition-all active:scale-95"
				>
					{t("editFormAgain")}
				</button>
				<button
					type="button"
					onClick={onBackToDemos}
					className="flex-1 py-3 bg-primary-cta text-on-primary-container font-semibold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all"
				>
					{t("backToDemos")}
				</button>
			</div>
		</div>
	);
}
