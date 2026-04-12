"use client";

import { useState } from "react";

/**
 * Left padding so header content clears macOS traffic lights (`titleBarStyle: hiddenInset`).
 * Tune alongside `trafficLightPosition` in `apps/desktop/electron/main.js`.
 */
export const ELECTRON_MAC_TRAFFIC_LIGHT_LEFT_INSET_PX = 80;

/** Drag window from chrome; links/buttons/inputs opt out (standard Electron pattern). */
export const ELECTRON_TITLEBAR_DRAG_REGION_CLASS =
	"[-webkit-app-region:drag] [&_a]:[-webkit-app-region:no-drag] [&_button]:[-webkit-app-region:no-drag] [&_input]:[-webkit-app-region:no-drag] [&_select]:[-webkit-app-region:no-drag] [&_textarea]:[-webkit-app-region:no-drag]";

export function useElectronTitleBarChrome() {
	const [state] = useState(() => {
		if (typeof window === "undefined") return { isElectron: false, isElectronMac: false };
		const api = window.electronAPI;
		if (!api?.isDesktop) return { isElectron: false, isElectronMac: false };
		return { isElectron: true, isElectronMac: api.platform === "darwin" };
	});

	return {
		isElectron: state.isElectron,
		isElectronMac: state.isElectronMac,
		titleBarPaddingLeftPx: state.isElectronMac ? ELECTRON_MAC_TRAFFIC_LIGHT_LEFT_INSET_PX : null,
	};
}
