"use client";

import type { ReactNode } from "react";
import { ELECTRON_TITLEBAR_DRAG_REGION_CLASS, useElectronTitleBarChrome } from "../../hooks/useElectronTitleBarChrome";

type Props = {
	children: ReactNode;
	/** Extra classes, e.g. `justify-between`. */
	className?: string;
};

export default function ElectronAwareAppHeader({ children, className = "" }: Props) {
	const { isElectron, isElectronMac, titleBarPaddingLeftPx } = useElectronTitleBarChrome();

	return (
		<header
			className={`fixed top-0 left-0 w-full z-50 glass-panel-dark flex items-center py-4 pr-6 ${isElectronMac ? "" : "pl-6"} ${
				isElectron ? ELECTRON_TITLEBAR_DRAG_REGION_CLASS : ""
			} ${className}`.trim()}
			style={titleBarPaddingLeftPx != null ? { paddingLeft: titleBarPaddingLeftPx } : undefined}
		>
			{children}
		</header>
	);
}
