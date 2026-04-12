const { contextBridge, ipcRenderer } = require('electron');

const platform =
  typeof ipcRenderer.sendSync === 'function' ? ipcRenderer.sendSync('electron-platform-sync') : undefined;

// ── Expose a safe, typed API to the renderer (Next.js) ───────────────────────
// Never expose ipcRenderer directly — always bridge specific methods
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app-version'),
  getPlatform: () => ipcRenderer.invoke('platform'),
  /** Same as `getPlatform()` but synchronous (for layout before first paint). */
  platform,

  // Flag for conditional desktop-only UI features
  isDesktop: true,
});
