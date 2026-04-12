export {};

declare global {
interface Window {
		electronAPI?: {
			isDesktop?: boolean;
			/** `process.platform` from main (e.g. `darwin`, `win32`). */
			platform?: string;
			getVersion?: () => Promise<string>;
			getPlatform?: () => Promise<string>;
		};
	}
}
