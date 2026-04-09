const { contextBridge, ipcRenderer } = require('electron');

// ── Expose a safe, typed API to the renderer (Next.js) ───────────────────────
// Never expose ipcRenderer directly — always bridge specific methods
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app-version'),
  getPlatform: () => ipcRenderer.invoke('platform'),

  // Flag for conditional desktop-only UI features
  isDesktop: true,
});
