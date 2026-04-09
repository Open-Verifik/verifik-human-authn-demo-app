const { app, BrowserWindow, nativeTheme, session, shell, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

// ── Force dark theme ──────────────────────────────────────────────────────────
nativeTheme.themeSource = 'dark';

// ── Security: Keep a reference so the window isn't GC'd ──────────────────────
let mainWindow = null;

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
        { label: 'Home', click: () => mainWindow?.webContents.loadURL(isDev ? 'http://localhost:3000' : getProductionUrl('/')) },
        { label: 'Sign In', click: () => mainWindow?.webContents.loadURL(isDev ? 'http://localhost:3000/auth' : getProductionUrl('/auth')) },
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
      submenu: [
        {
          label: 'Face Comparison',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow?.webContents.loadURL(isDev ? 'http://localhost:3000/demos/face-comparison' : getProductionUrl('/demos/face-comparison')),
        },
        {
          label: 'Liveness Detection',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow?.webContents.loadURL(isDev ? 'http://localhost:3000/demos/liveness' : getProductionUrl('/demos/liveness')),
        },
        {
          label: 'HumanID Login',
          accelerator: 'CmdOrCtrl+3',
          click: () => mainWindow?.webContents.loadURL(isDev ? 'http://localhost:3000/demos/humanid' : getProductionUrl('/demos/humanid')),
        },
      ],
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
          "default-src 'self' http://localhost:3000 https://*.verifik.co https://fonts.googleapis.com https://fonts.gstatic.com; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:3000; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "img-src 'self' data: blob: https: http:; " +
          "media-src 'self' blob:; " +
          "connect-src 'self' http://localhost:3000 https://*.verifik.co https://access.verifik.co ws://localhost:*;",
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
