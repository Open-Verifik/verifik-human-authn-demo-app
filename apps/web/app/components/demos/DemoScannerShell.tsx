"use client";

import type { ReactNode } from "react";

type Props = {
	children: ReactNode;
	className?: string;
	innerClassName?: string;
};

export default function DemoScannerShell({
	children,
	className = "",
	innerClassName = "",
}: Props) {
	return (
		<div className={`group relative mx-auto h-[min(82vh,720px)] w-full min-h-[400px] overflow-hidden rounded-lg bg-surface-container-low ${className}`}>
			<div className="pointer-events-none absolute inset-0 opacity-[0.025] blueprint-grid" aria-hidden="true" />
			<div className="absolute inset-0 z-0 opacity-20" aria-hidden="true">
				<div className="h-full w-full bg-surface-container-lowest" />
			</div>
			<div className="scanner-corner-tl" />
			<div className="scanner-corner-tr" />
			<div className="scanner-corner-bl" />
			<div className="scanner-corner-br" />
			<div className="scan-line" aria-hidden="true" />
			<div className={`relative z-20 flex h-full w-full flex-col p-2 sm:p-3 ${innerClassName}`}>{children}</div>
		</div>
	);
}
