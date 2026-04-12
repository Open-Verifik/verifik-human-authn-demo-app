const { app, BrowserWindow, nativeTheme, session, shell, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

/** Preload reads this synchronously (sandboxed preload has no `process`). */
ipcMain.on('electron-platform-sync', (event) => {
  event.returnValue = process.platform;
});

/**
 * Development only: tolerate invalid / untrusted TLS (e.g. local proxy or fake CA).
 * Never enable in packaged production builds (electron-is-dev is false there).
 */
if (isDev) {
  app.commandLine.appendSwitch('ignore-certificate-errors');
}

// ── Force dark theme ──────────────────────────────────────────────────────────
nativeTheme.themeSource = 'dark';

// ── Security: Keep a reference so the window isn't GC'd ──────────────────────
let mainWindow = null;

const loadInMainWindow = (routePath) => {
  const nextUrl = isDev ? `http://localhost:3000${routePath}` : getProductionUrl(routePath);
  return mainWindow?.webContents.loadURL(nextUrl);
};

const DEMO_ROUTES = [
  { label: 'All Demos', path: '/home', accelerator: 'CmdOrCtrl+1' },
  { type: 'separator' },
  { label: 'Liveness Detection', path: '/demos/liveness', accelerator: 'CmdOrCtrl+2' },
  { label: 'Face Comparison', path: '/demos/face-comparison', accelerator: 'CmdOrCtrl+3' },
  { label: 'Face Comparison + Liveness', path: '/demos/face-comparison-liveness' },
  { label: 'Face Detection', path: '/demos/face-detection' },
  { label: 'Detect Face', path: '/demos/detect-face' },
  { label: 'Verify Face', path: '/demos/verify-face' },
  { type: 'separator' },
  { label: 'Create Collection', path: '/demos/create-collection' },
  { label: 'Create Person', path: '/demos/create-person' },
  { label: 'Create Person With Liveness', path: '/demos/create-person-with-liveness' },
  { label: 'Update Person', path: '/demos/update-person' },
  { label: 'Delete Person', path: '/demos/delete-person' },
  { label: 'Search Person', path: '/demos/search-person' },
  { label: 'Search Live Person', path: '/demos/search-live-person' },
  { label: 'Search Active User', path: '/demos/search-active-user' },
  { label: 'Search Crops', path: '/demos/search-crops' },
  { type: 'separator' },
  { label: 'HumanID Login', path: '/demos/humanid' },
  { label: 'HumanID Create', path: '/demos/humanid-create' },
  { label: 'HumanID Create QR', path: '/demos/humanid-create-qr' },
  { label: 'HumanID Preview', path: '/demos/humanid-preview' },
  { label: 'HumanID Decrypt', path: '/demos/humanid-decrypt' },
];

// ── Custom menu ───────────────────────────────────────────────────────────────
function createMenu() {
  const template = [
    {
      label: 'HumanAuthn',
      submenu: [
        { label: 'About HumanAuthn', role: 'about' },
        { type: 'separator' },
        { label: 'Hide', role: 'hide' },
        { label: 'Quit', role: 'quit', accelerator: 'CmdOrCtrl+Q' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Home', click: () => loadInMainWindow('/') },
        { label: 'Sign In', click: () => loadInMainWindow('/auth') },
        { type: 'separator' },
        { label: 'Reload', role: 'reload' },
        { label: 'Force Reload', role: 'forceReload' },
        { label: 'Toggle DevTools', role: 'toggleDevTools', visible: isDev },
        { type: 'separator' },
        { label: 'Actual Size', role: 'resetZoom' },
        { label: 'Zoom In', role: 'zoomIn' },
        { label: 'Zoom Out', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Enter Full Screen', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Demos',
      submenu: DEMO_ROUTES.map((item) =>
        item.type === 'separator'
          ? { type: 'separator' }
          : {
              label: item.label,
              ...(item.accelerator ? { accelerator: item.accelerator } : {}),
              click: () => loadInMainWindow(item.path),
            }
      ),
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function getProductionUrl(path) {
  // In production, serve files from bundled Next.js output
  // For now, still hits localhost (you'd add a custom server for full offline)
  return `http://localhost:3000${path}`;
}

// ── Create main window ────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',     // macOS: keep native traffic lights
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#010333',       // Verifik navy — matches web surface
    vibrancy: 'under-window',        // macOS frosted glass effect
    visualEffectState: 'active',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    show: false, // Don't show until ready to prevent flicker
  });

  // ── Load URL ─────────────────────────────────────────────────────────────────
  const startUrl = isDev
    ? 'http://localhost:3000'
    : 'http://localhost:3000'; // production: could use file:// with custom server

  mainWindow.loadURL(startUrl).catch((err) => {
    console.error('Failed to load:', err);
    // Show error page if Next.js isn't running
    mainWindow.loadFile(path.join(__dirname, 'error.html'));
  });

  // ── Show window only when ready ───────────────────────────────────────────
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  // ── Open external links in system browser ─────────────────────────────────
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Security: set CSP headers
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' http://localhost:3000 https://verifik.app https://api.verifik.co https://*.verifik.co https://fonts.googleapis.com https://fonts.gstatic.com; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "img-src 'self' data: blob: https: http:; " +
          "media-src 'self' blob:; " +
          "connect-src 'self' http://localhost:3000 https://verifik.app https://api.verifik.co https://*.verifik.co https://access.verifik.co ws://localhost:*;",
        ],
      },
    });
  });

  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC handlers ──────────────────────────────────────────────────────────────
ipcMain.handle('app-version', () => app.getVersion());
ipcMain.handle('platform', () => process.platform);
