"use client";

import Link from "next/link";

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
	return (
		<div className="space-y-5">
			<div className="rounded-2xl bg-surface-container-low border border-error/25 p-6">
				<div className="flex items-start gap-3 mb-6">
					<span className="material-symbols-outlined text-error text-2xl shrink-0">person_off</span>
					<div>
						<p className="font-bold text-on-surface text-lg">This face is already enrolled</p>
						<p className="text-sm text-on-surface-variant mt-1">
							The API returned <code className="text-primary font-mono text-xs">person_already_set</code>. Someone with a matching face
							already exists in your project. Try again with a different person or photo, or open the demos below to update metadata or
							remove the existing enrollment.
						</p>
					</div>
				</div>

				{previews.length > 0 ? (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4">
						<h3 className="text-sm font-bold text-primary mb-3">Image(s) you tried to enroll</h3>
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
					<h3 className="text-sm font-bold text-primary mb-3">Next steps</h3>
					<ul className="space-y-3 text-sm text-on-surface-variant">
						<li className="flex flex-wrap items-center gap-2">
							<span className="material-symbols-outlined text-primary text-lg">edit</span>
							<Link href="/demos/update-person" className="text-primary font-semibold underline underline-offset-2">
								Update Person demo
							</Link>
							<span>— change name, collections, or notes for an existing person id.</span>
						</li>
						<li className="flex flex-wrap items-center gap-2">
							<span className="material-symbols-outlined text-primary text-lg">delete</span>
							<Link href="/demos/delete-person" className="text-primary font-semibold underline underline-offset-2">
								Delete Person demo
							</Link>
							<span>— full delete or remove from a collection only.</span>
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
					Edit form and try again
				</button>
				<button
					type="button"
					onClick={onBackToDemos}
					className="flex-1 py-3 bg-primary-cta text-on-primary-container font-semibold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all"
				>
					Back to demos
				</button>
			</div>
		</div>
	);
}
