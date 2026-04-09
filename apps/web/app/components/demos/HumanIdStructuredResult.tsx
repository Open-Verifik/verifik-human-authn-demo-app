"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

function truncateMiddle(s: string, head = 28, tail = 16): string {
	if (s.length <= head + tail + 3) return s;
	return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === "object" && !Array.isArray(v);
}

function formatDisplayValue(v: unknown): string {
	if (v === null || v === undefined) return "";
	if (typeof v === "boolean") return v ? "Yes" : "No";
	if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
	if (typeof v === "string") return v;
	return JSON.stringify(v);
}

const IPFS_DETAIL_KEYS = [
	"IpfsHash",
	"url",
	"PinSize",
	"Timestamp",
	"MimeType",
	"Name",
	"name",
	"pinned",
	"ID",
	"GroupId",
	"NumberOfFiles",
	"web3",
] as const;

function IpfsDetailRows({ ipfs }: { ipfs: Record<string, unknown> }) {
	return (
		<dl className="space-y-2 text-sm">
			{IPFS_DETAIL_KEYS.map((key) => {
				const val = ipfs[key];
				if (val === undefined) return null;
				return (
					<div key={key} className="grid grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr] gap-x-3 gap-y-1 border-b border-outline-variant/10 pb-2 last:border-0 last:pb-0">
						<dt className="text-on-surface-variant font-medium">{key}</dt>
						<dd className="font-mono text-xs text-on-surface break-all">{formatDisplayValue(val)}</dd>
					</div>
				);
			})}
		</dl>
	);
}

function HumanIdCreditsSection({ credits }: { credits: Record<string, unknown> }) {
	const amt = typeof credits.amount === "number" ? credits.amount : null;
	const extra = [
		["status", credits.status],
		["category", credits.category],
		["code", credits.code],
		["product", credits.product],
		["group", credits.group],
		["expensesGroup", credits.expensesGroup],
		["createdAt", credits.createdAt],
		["updatedAt", credits.updatedAt],
	] as const;
	return (
		<>
			{amt === null ? null : amt < 0 ? (
				<p className="text-on-surface">
					Charged: <span className="font-bold tabular-nums">{Math.abs(amt)}</span> credits
				</p>
			) : (
				<p className="text-on-surface">
					Credit change: <span className="font-bold tabular-nums">{amt}</span>
				</p>
			)}
			<dl className="mt-3 space-y-1.5 text-sm">
				{extra.map(([k, v]) => {
					if (v === undefined || v === null) return null;
					return (
						<div key={k} className="flex flex-wrap gap-x-2 gap-y-0.5">
							<dt className="text-on-surface-variant shrink-0">{k}</dt>
							<dd className="font-mono text-xs text-on-surface break-all">{formatDisplayValue(v)}</dd>
						</div>
					);
				})}
			</dl>
		</>
	);
}

export type HumanIdStructuredResultProps = {
	result: Record<string, unknown> | null;
	successTitle: string;
	successDescription?: string;
	/** PNG data URL from encrypt-qr (`data.zelfQR`). When set, the separate gateway QR image is omitted to avoid two QR blocks; the IPFS card still lists `url`. */
	zelfQrPngDataUrl?: string | null;
	onCreateAnother: () => void;
	onBackToDemos: () => void;
	createAnotherLabel?: string;
};

export default function HumanIdStructuredResult({
	result,
	successTitle,
	successDescription = "Your ZelfProof is ready. Details below.",
	zelfQrPngDataUrl = null,
	onCreateAnother,
	onBackToDemos,
	createAnotherLabel = "Create Another",
}: HumanIdStructuredResultProps) {
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [showFullZelfProof, setShowFullZelfProof] = useState(false);
	const [qrLoadFailed, setQrLoadFailed] = useState(false);

	const parsedResult = useMemo(() => {
		if (!result) return null;
		const innerData = isPlainObject(result.data) ? result.data : null;
		const zelfProof = typeof innerData?.zelfProof === "string" ? innerData.zelfProof : "";
		const ipfs = isPlainObject(innerData?.ipfs) ? innerData.ipfs : null;
		const credits = isPlainObject(result.credits) ? result.credits : null;
		return { zelfProof, ipfs, credits };
	}, [result]);

	const copyText = useCallback(async (text: string, fieldId: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(fieldId);
			window.setTimeout(() => setCopiedField(null), 2000);
		} catch {
			setCopiedField(null);
		}
	}, []);

	useEffect(() => {
		if (result) setQrLoadFailed(false);
	}, [result]);

	const ipfsGatewayUrl =
		parsedResult?.ipfs && typeof parsedResult.ipfs.url === "string" ? parsedResult.ipfs.url : "";
	const qrSrc =
		ipfsGatewayUrl && !qrLoadFailed
			? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ipfsGatewayUrl)}`
			: "";

	return (
		<div className="space-y-5">
			<div className="rounded-2xl bg-surface-container-low border border-primary/20 p-6">
				<div className="flex items-center gap-3 mb-6">
					<span className="material-symbols-outlined text-primary text-2xl">check_circle</span>
					<div>
						<p className="font-bold text-on-surface text-lg">{successTitle}</p>
						<p className="text-sm text-on-surface-variant">{successDescription}</p>
					</div>
				</div>

				{zelfQrPngDataUrl ? (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4" aria-labelledby="humanid-png-qr-heading">
						<h3 id="humanid-png-qr-heading" className="text-sm font-bold text-primary mb-2">
							Human ID QR (PNG)
						</h3>
						<p className="text-xs text-on-surface-variant mb-3">
							Portable QR image returned by <code className="text-primary">encrypt-qr-code</code>. Scan with a verifier app or save the image.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
							<div className="flex justify-center rounded-xl border border-outline-variant/20 bg-white p-4 shrink-0">
								<img src={zelfQrPngDataUrl} alt="HumanID QR code" className="w-56 h-56 object-contain" />
							</div>
							<div className="flex flex-col gap-2 min-w-0">
								<a
									href={zelfQrPngDataUrl}
									download="humanid-qr.png"
									className="inline-flex items-center justify-center text-sm font-semibold py-2 px-4 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors w-fit"
								>
									Download PNG
								</a>
								<p className="text-xs text-on-surface-variant">Data URL — right-click the image to save works too.</p>
							</div>
						</div>
						{ipfsGatewayUrl ? (
							<p className="text-xs text-on-surface-variant mt-3 pt-3 border-t border-outline-variant/15">
								IPFS gateway URL and pin details are in <span className="font-medium text-on-surface">Decentralized storage</span> below.
							</p>
						) : null}
					</section>
				) : null}

				{parsedResult?.zelfProof ? (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4" aria-labelledby="humanid-zelfproof-heading">
						<div className="flex flex-wrap items-start justify-between gap-2 mb-2">
							<h3 id="humanid-zelfproof-heading" className="text-sm font-bold text-primary">
								Human ID (ZelfProof)
							</h3>
							<button
								type="button"
								onClick={() => copyText(parsedResult.zelfProof, "zelfProof")}
								className="text-xs font-semibold text-primary underline underline-offset-2"
							>
								{copiedField === "zelfProof" ? "Copied" : "Copy full"}
							</button>
						</div>
						{!showFullZelfProof ? (
							<p className="text-[0.7rem] font-mono text-on-surface break-all bg-surface-container-high/80 rounded-lg px-3 py-2 border border-outline-variant/15">
								{truncateMiddle(parsedResult.zelfProof)}
							</p>
						) : (
							<pre className="max-h-48 overflow-auto text-[0.65rem] font-mono bg-surface-container-high rounded-lg p-3 border border-outline-variant/15 text-on-surface whitespace-pre-wrap">
								{parsedResult.zelfProof}
							</pre>
						)}
						{parsedResult.zelfProof.length > 52 ? (
							<button
								type="button"
								onClick={() => setShowFullZelfProof((v) => !v)}
								className="mt-2 text-xs font-semibold text-on-surface-variant hover:text-primary"
							>
								{showFullZelfProof ? "Show less" : "Show full"}
							</button>
						) : null}
					</section>
				) : null}

				{ipfsGatewayUrl && !zelfQrPngDataUrl ? (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4" aria-labelledby="humanid-gateway-qr-heading">
						<h3 id="humanid-gateway-qr-heading" className="text-sm font-bold text-primary mb-1">
							Gateway URL QR (IPFS)
						</h3>
						<p className="text-xs text-on-surface-variant mb-3">
							Scan to open the pinned JSON on the IPFS gateway (same as the link below).
						</p>
						<div className="flex flex-col sm:flex-row gap-4 items-start">
							{qrSrc ? (
								<div className="shrink-0 rounded-lg border border-outline-variant/20 bg-white p-2">
									<img
										src={qrSrc}
										alt=""
										width={200}
										height={200}
										className="block"
										onError={() => setQrLoadFailed(true)}
									/>
								</div>
							) : null}
							<div className="min-w-0 flex-1 space-y-2">
								<a
									href={ipfsGatewayUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm font-semibold text-primary break-all underline underline-offset-2"
								>
									{ipfsGatewayUrl}
								</a>
								<p className="text-xs text-on-surface-variant">Opens in a new tab.</p>
							</div>
						</div>
					</section>
				) : null}

				{parsedResult?.ipfs ? (
					<section className="mb-6 rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4" aria-labelledby="humanid-ipfs-heading">
						<h3 id="humanid-ipfs-heading" className="text-sm font-bold text-primary mb-3">
							Decentralized storage (IPFS)
						</h3>
						<IpfsDetailRows ipfs={parsedResult.ipfs} />
						{isPlainObject(parsedResult.ipfs.metadata) ? (
							<div className="mt-4">
								<p className="text-xs font-semibold text-on-surface-variant mb-1">metadata</p>
								<pre className="text-[0.65rem] font-mono bg-surface-container-high rounded-lg p-3 overflow-x-auto text-on-surface border border-outline-variant/15">
									{JSON.stringify(parsedResult.ipfs.metadata, null, 2)}
								</pre>
							</div>
						) : null}
					</section>
				) : null}

				{parsedResult?.credits ? (
					<section className="rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-4" aria-labelledby="humanid-credits-heading">
						<h3 id="humanid-credits-heading" className="text-sm font-bold text-primary mb-3">
							Credits / usage
						</h3>
						<HumanIdCreditsSection credits={parsedResult.credits} />
					</section>
				) : null}
			</div>

			<details className="rounded-xl border border-outline-variant/20 bg-surface-container-low/50 px-4 py-3 group">
				<summary className="cursor-pointer list-none font-bold text-sm text-on-surface-variant flex items-center justify-between gap-2">
					<span>Raw response (debug)</span>
					<span className="material-symbols-outlined text-outline-variant group-open:rotate-180 transition-transform text-lg">
						expand_more
					</span>
				</summary>
				<pre className="mt-3 text-[0.65rem] font-mono bg-surface-container-high/80 rounded-lg p-3 overflow-x-auto text-on-surface whitespace-pre-wrap">
					{result ? JSON.stringify(result, null, 2) : ""}
				</pre>
			</details>

			<div className="flex gap-3">
				<button
					type="button"
					onClick={onCreateAnother}
					className="flex-1 py-3 bg-surface-container text-on-surface font-semibold rounded-lg ghost-border hover:bg-surface-container-high transition-all active:scale-95"
				>
					{createAnotherLabel}
				</button>
				<button
					type="button"
					onClick={onBackToDemos}
					className="flex-1 py-3 bg-primary-cta text-on-primary-container font-semibold rounded-lg shadow-primary hover:opacity-90 active:scale-95 transition-all"
				>
					Back to Demos
				</button>
			</div>
		</div>
	);
}
