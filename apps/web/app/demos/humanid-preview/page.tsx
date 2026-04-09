"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { previewHumanId } from "@humanauthn/api-client";
import { useAuthHydration } from "../../hooks/useAuthHydration";
import { useAuthStore } from "../../store/authStore";
import DemoSignInPrompt from "../DemoSignInPrompt";

type Step = "form" | "processing" | "result";

export default function HumanIdPreviewPage() {
	useAuthHydration();
	const hasHydrated = useAuthStore((s) => s.hasHydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const router = useRouter();

	const [step, setStep] = useState<Step>("form");
	const [zelfProof, setZelfProof] = useState("");
	const [verifierKey, setVerifierKey] = useState("");
	const [result, setResult] = useState<Record<string, unknown> | null>(null);
	const [error, setError] = useState<string | null>(null);

	const canUseDemo = hasHydrated && isAuthenticated;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const token = useAuthStore.getState().token;
		if (!token || !zelfProof) return;
		setStep("processing");
		setError(null);
		const res = await previewHumanId({ zelfProof, verifierKey: verifierKey || undefined }, token);
		if (res.error) { setError(res.error); setStep("form"); return; }
		setResult(res.data as Record<string, unknown>);
		setStep("result");
	};

	const reset = () => { setStep("form"); setZelfProof(""); setResult(null); setError(null); };

	return (
		<div className="min-h-screen bg-surface flex flex-col">
			<header className="fixed top-0 left-0 w-full z-50 glass-panel-dark flex items-center px-6 py-4">
				<button onClick={() => router.back()} className="hover:bg-surface-container transition-colors p-1.5 rounded-lg text-primary mr-3" aria-label="Back"><span className="material-symbols-outlined">arrow_back</span></button>
				<h1 className="font-bold tracking-tight text-lg text-primary">Preview HumanID</h1>
			</header>
			<main className="flex-1 mt-20 mb-10 px-4 md:px-8 max-w-2xl mx-auto w-full">
				<details className="mb-8 mt-6 rounded-xl border border-outline-variant/20 bg-surface-container-low/50 text-left px-4 py-3 group">
					<summary className="cursor-pointer list-none font-bold text-sm text-primary flex items-center justify-between gap-2">
						<span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">menu_book</span>API reference: Preview HumanID</span>
						<span className="material-symbols-outlined text-outline-variant group-open:rotate-180 transition-transform">expand_more</span>
					</summary>
					<div className="mt-4 space-y-3 text-sm text-on-surface-variant border-t border-outline-variant/15 pt-4">
						<p className="font-mono text-xs text-on-surface">POST /v2/zelf-proof/preview</p>
						<p className="text-xs">Inspect the public metadata inside a ZelfProof without presenting a face or credentials. Only the <code className="text-primary">zelfProof</code> string is required. Optional <code className="text-primary">verifierKey</code> unlocks additional fields if set during creation.</p>
					</div>
				</details>
				<div className="mb-8">
					<h2 className="text-3xl font-black tracking-tight text-on-surface mb-2">{step === "result" ? "Preview Ready" : "Preview HumanID"}</h2>
					<p className="text-on-surface-variant">Inspect public metadata from a ZelfProof. No face or credentials needed.</p>
				</div>
				{!hasHydrated ? <div className="h-40 rounded-xl bg-surface-container-high animate-pulse" /> : !canUseDemo ? <DemoSignInPrompt /> : step === "form" ? (
					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="prev-proof">ZelfProof string <span className="text-error">*</span></label>
							<textarea id="prev-proof" required rows={5} value={zelfProof} onChange={(e) => setZelfProof(e.target.value)} placeholder="Paste the ZelfProof string here…" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-outline text-xs font-mono focus:outline-none focus:border-primary/60 transition-colors resize-none" />
						</div>
						<div>
							<label className="block text-sm font-semibold text-on-surface mb-1.5" htmlFor="prev-vk">Verifier key (optional)</label>
							<input id="prev-vk" type="text" value={verifierKey} onChange={(e) => setVerifierKey(e.target.value)} placeholder="Unlocks additional fields if set during creation" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder-outline text-sm focus:outline-none focus:border-primary/60" />
						</div>
						{error && <div className="px-4 py-3 bg-error-container/20 border border-error/20 rounded-lg text-sm text-error">{error}</div>}
						<button type="submit" disabled={!zelfProof} className="w-full py-3 bg-primary-cta text-on-primary-container font-bold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">Preview</button>
					</form>
				) : step === "processing" ? (
					<div className="flex flex-col items-center justify-center py-20 gap-4">
						<div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
						<p className="text-on-surface font-semibold">Fetching preview…</p>
					</div>
				) : (
					<div className="space-y-4">
						<div className="rounded-2xl bg-surface-container-low border border-primary/20 p-6">
							<div className="flex items-center gap-3 mb-4"><span className="material-symbols-outlined text-primary text-2xl">preview</span><p className="font-bold text-on-surface">HumanID metadata</p></div>
							<pre className="text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
						</div>
						<div className="flex gap-3">
							<button onClick={reset} className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg ghost-border hover:bg-surface-container-high transition-all active:scale-95">Preview Another</button>
							<button onClick={() => router.push("/home")} className="flex-1 py-3 bg-primary-cta text-on-primary-container font-semibold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all">Back to Demos</button>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
