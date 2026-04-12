"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCollection } from "@humanauthn/api-client";
import { useAuthHydration } from "../../hooks/useAuthHydration";
import { useAuthStore } from "../../store/authStore";
import DemoRelatedDocsSection, { type DemoRelatedDocItem } from "../../components/demos/DemoRelatedDocsSection";
import DemoSignInPrompt from "../DemoSignInPrompt";
import ElectronAwareAppHeader from "../../components/layout/ElectronAwareAppHeader";


const DOCS_BASE = "https://docs.verifik.co";

const RELATED_DOCS: DemoRelatedDocItem[] = [
	{
		href: `${DOCS_BASE}/resources/the-collection-object`,
		title: "The Collection Object",
		description: "Fields and structure of a face recognition collection.",
		badge: "Object",
	},
	{
		href: `${DOCS_BASE}/resources/list-all-collections`,
		title: "List All Collections",
		description: "All collections for the authenticated client.",
		badge: "GET",
	},
	{
		href: `${DOCS_BASE}/resources/retrieve-a-collection`,
		title: "Retrieve a Collection",
		description: "A single collection by id.",
		badge: "GET",
	},
	{
		href: `${DOCS_BASE}/resources/update-a-collection`,
		title: "Update a Collection",
		description: "Name, description, optional project or people list.",
		badge: "PUT",
	},
	{
		href: `${DOCS_BASE}/resources/delete-a-collection`,
		title: "Delete a Collection",
		description: "Remove a collection by id and clean up linked data.",
		badge: "DELETE",
	},
];

type Step = "form" | "processing" | "result";

export default function CreateCollectionPage() {
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();

	const [step, setStep] = useState<Step>("form");
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [result, setResult] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);

	const canUseDemo = hasHydrated && isAuthenticated;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const token = useAuthStore.getState().token;
		if (!token) return;

		setStep("processing");
		setError(null);

		const res = await createCollection({ name, description: description || undefined }, token);
		if (res.error) {
			setError(res.error);
			setStep("form");
			return;
		}
		setResult(res.data as Record<string, unknown>);
		setStep("result");
	};

	const reset = () => {
		setStep("form");
		setName("");
		setDescription("");
		setResult(null);
		setError(null);
	};

	const showApiReference = step !== "result";

	return (
		<div className="min-h-screen bg-surface flex flex-col">
			<ElectronAwareAppHeader>
				<button
					onClick={() => router.back()}
					className="hover:bg-surface-container transition-colors p-1.5 rounded-lg text-primary mr-3"
					aria-label="Back"
				>
					<span className="material-symbols-outlined">arrow_back</span>
				</button>
				<h1 className="font-bold tracking-tight text-lg text-primary">Create Collection</h1>
			</ElectronAwareAppHeader>

			<main className="flex-1 mt-20 mb-10 px-4 md:px-8 max-w-4xl mx-auto w-full">
				<div className="mb-8">
					<h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">
						{step === "result" ? "Collection Created" : "Create Collection"}
					</h2>
					<p className="text-on-surface-variant">
						{step === "result"
							? "A new face collection has been created in your OpenCV database."
							: "Create a named collection to group enrolled persons."}
					</p>
				</div>

				{!hasHydrated ? (
					<div className="h-40 rounded-xl bg-surface-container-high animate-pulse" />
				) : !canUseDemo ? (
					<DemoSignInPrompt />
				) : step === "form" ? (
					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="col-name">
								Collection name <span className="text-error">*</span>
							</label>
							<input
								id="col-name"
								type="text"
								required
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. Employees 2025"
								className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:border-primary/60 transition-colors"
							/>
						</div>
						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="col-desc">
								Description
							</label>
							<textarea
								id="col-desc"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={3}
								placeholder="Optional description for this collection"
								className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none focus:border-primary/60 transition-colors resize-none"
							/>
						</div>
						{error && (
							<div className="px-4 py-3 bg-error-container/20 border border-error/20 rounded-lg flex items-center gap-2 text-sm text-error">
								<span className="material-symbols-outlined text-sm">error_outline</span>
								{error}
							</div>
						)}
						<button
							type="submit"
							className="w-full py-3 bg-primary-cta text-on-primary-container font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all"
						>
							Create Collection
						</button>
					</form>
				) : step === "processing" ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<p className="text-on-surface font-semibold">Creating collection…</p>
					</div>
				) : (
					<div className="space-y-4">
						<div className="rounded-2xl bg-surface-container-low border border-primary/20 p-6">
							<div className="flex items-center gap-3 mb-4">
								<span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
								<p className="font-bold text-on-surface">Collection created successfully</p>
							</div>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{JSON.stringify(result, null, 2)}
							</pre>
						</div>
						<div className="flex gap-3">
							<button
								onClick={reset}
								className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg hover:bg-surface-container-high transition-all active:scale-95 ghost-border"
							>
								Create Another
							</button>
							<button
								onClick={() => router.push("/home")}
								className="flex-1 py-3 bg-primary-cta text-on-primary-container font-semibold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all"
							>
								Back to Demos
							</button>
						</div>
					</div>
				)}

				{showApiReference ? (
					<details className="mt-10 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 text-left max-w-3xl mx-auto w-full px-4 py-3 group">
						<summary className="cursor-pointer list-none font-bold text-sm text-primary flex items-center justify-between gap-2">
							<span className="flex items-center gap-2">
								<span className="material-symbols-outlined text-lg">menu_book</span>
								API reference: Create Collection
							</span>
							<span className="material-symbols-outlined text-on-surface-variant/70 group-open:rotate-180 transition-transform">
								expand_more
							</span>
						</summary>
						<div className="mt-4 space-y-4 text-sm text-on-surface-variant border-t border-outline-variant/15 pt-4">
							<p>
								Official docs:{" "}
								<a
									href={`${DOCS_BASE}/resources/create-a-collection/`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline underline-offset-2"
								>
									docs.verifik.co/resources/create-a-collection
								</a>
							</p>
							<p className="text-xs leading-relaxed">
								Base URL <code className="text-primary">https://api.verifik.co</code>. Send a JSON body with a display{" "}
								<code className="text-primary">name</code> and an optional <code className="text-primary">description</code>.
							</p>
							<div>
								<p className="font-mono text-xs text-on-surface mb-1">POST /v2/face-recognition/collections</p>
								<p className="text-xs leading-relaxed">
									Creates a named collection to group enrolled persons for search and verification in your OpenCV-backed
									database.
								</p>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full text-xs border-collapse">
									<thead>
										<tr className="border-b border-outline-variant/20">
											<th className="text-left py-2 pr-2 font-semibold text-on-surface">Header</th>
											<th className="text-left py-2 font-semibold text-on-surface">Value</th>
										</tr>
									</thead>
									<tbody>
										<tr className="border-b border-outline-variant/10">
											<td className="py-2 pr-2 font-mono">Content-Type</td>
											<td className="font-mono">application/json</td>
										</tr>
										<tr>
											<td className="py-2 pr-2 font-mono">Authorization</td>
											<td className="font-mono">Bearer &lt;token&gt;</td>
										</tr>
									</tbody>
								</table>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full text-xs border-collapse">
									<thead>
										<tr className="border-b border-outline-variant/20">
											<th className="text-left py-2 pr-1">Param</th>
											<th className="text-left py-2 pr-1">Req</th>
											<th className="text-left py-2">Description</th>
										</tr>
									</thead>
									<tbody className="text-on-surface-variant">
										<tr className="border-b border-outline-variant/10 align-top">
											<td className="py-2 font-mono text-primary">name</td>
											<td>Yes</td>
											<td>Collection display name</td>
										</tr>
										<tr className="align-top">
											<td className="py-2 font-mono text-primary">description</td>
											<td>No</td>
											<td>Optional description</td>
										</tr>
									</tbody>
								</table>
							</div>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{`await fetch("https://api.verifik.co/v2/face-recognition/collections", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({
    name: "My collection",
    description: "Optional notes",
  }),
});`}
							</pre>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
								{`// 200 OK — example shape
{
  "data": {
    "_id": "…",
    "code": "…",
    "name": "My collection",
    "description": "Optional notes",
    "client": "…",
    "createdAt": "…",
    "updatedAt": "…",
    "__v": 0
  }
}`}
							</pre>
							<ul className="list-disc pl-5 space-y-1 text-xs">
								<li>
									This demo uses <code className="text-primary">createCollection</code> from{" "}
									<code className="text-primary">@humanauthn/api-client</code> with your session token.
								</li>
								<li>
									Some environments may attach an <code className="text-primary">id</code> or{" "}
									<code className="text-primary">signature</code> block on responses; the shape above shows the core{" "}
									<code className="text-primary">data</code> payload.
								</li>
							</ul>
						</div>
					</details>
				) : null}

				<DemoRelatedDocsSection items={RELATED_DOCS} />
			</main>
		</div>
	);
}
