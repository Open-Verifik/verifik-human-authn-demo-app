export type DemoRelatedDocItem = {
	href: string;
	title: string;
	description: string;
	/** Shown like Projects endpoint verbs; use "Object" for schema/reference pages */
	badge: "GET" | "POST" | "PUT" | "DELETE" | "Object";
};

type DemoRelatedDocsSectionProps = {
	items: DemoRelatedDocItem[];
};

/**
 * External doc links for demo pages — layout aligned with Verifik Projects-style API docs (verb + title + summary).
 */
export default function DemoRelatedDocsSection({ items }: DemoRelatedDocsSectionProps) {
	return (
		<section
			className="mt-12 rounded-2xl border border-outline-variant/20 bg-surface-container-low/35 p-6 md:p-8"
			aria-labelledby="related-docs-heading"
		>
			<div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
				<div className="flex items-center gap-2.5">
					<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<span className="material-symbols-outlined text-[22px]">menu_book</span>
					</span>
					<div>
						<h3 id="related-docs-heading" className="text-lg font-black tracking-tight text-on-surface">
							Related documentation
						</h3>
						<p className="text-xs text-on-surface-variant mt-0.5">Official guides on docs.verifik.co</p>
					</div>
				</div>
			</div>

			<div className="grid gap-3 sm:grid-cols-2">
				{items.map((doc) => (
					<a
						key={doc.href}
						href={doc.href}
						target="_blank"
						rel="noopener noreferrer"
						className="group flex flex-col rounded-xl border border-outline-variant/25 bg-surface-container/60 px-4 py-3.5 text-left shadow-sm transition-all hover:border-primary/35 hover:bg-surface-container-low/80 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
					>
						<div className="mb-2 flex items-start justify-between gap-2">
							<span
								className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 font-mono text-[0.625rem] font-bold uppercase tracking-wide tabular-nums ${
									doc.badge === "Object"
										? "border-outline-variant/35 bg-surface-container-high/40 text-outline"
										: "border-primary/25 bg-primary/8 text-primary"
								}`}
							>
								{doc.badge}
							</span>
							<span
								className="material-symbols-outlined shrink-0 text-lg text-outline-variant transition-colors group-hover:text-primary"
								aria-hidden
							>
								open_in_new
							</span>
						</div>
						<p className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{doc.title}</p>
						<p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{doc.description}</p>
					</a>
				))}
			</div>
		</section>
	);
}
