/**
 * File:        apps/desktop-pro/electron/main.ts
 * Module:      desktop-pro · Electron Main Process
 * Purpose:     App lifecycle, single-instance lock, IPC registration,
 *              deep-link protocol handling, and global shortcut registration.
 *
 * Exports:
 *   - none (entry point — side-effects only)
 *
 * Depends on:
 *   - electron — app, BrowserWindow, ipcMain, globalShortcut
 *   - ./ipc/auth.ipc — safeStorage token CRUD IPC handlers
 *   - ./ipc/market-data.ipc — price feed subscribe/unsubscribe handlers
 *   - ./ipc/window.ipc — open/close/minimize/maximize/focus handlers
 *   - ./ipc/layout.ipc — layout JSON read/write from userData
 *   - ./ipc/settings.ipc — auto-launch OS login item
 *   - ./services/price-feed.service — singleton Socket.IO connection + fan-out
 *   - ./services/auto-updater.service — electron-updater setup
 *   - ./window/workspace-window — main BrowserWindow factory
 *   - ./window/tray-widget — system tray icon + context menu
 *   - ./window/window-registry — detached panel window lifecycle
 *
 * Side-effects:
 *   - Registers app.setAsDefaultProtocolClient('obsidian')
 *   - Registers globalShortcut bindings (Ctrl+Shift+T/B/S)
 *   - Creates the main BrowserWindow on app.whenReady
 *   - Enforces single-instance lock
 *
 * Key invariants:
 *   - contextIsolation: true, nodeIntegration: false, sandbox: true (enforced in workspace-window.ts)
 *   - Deep links arrive as argv on Windows/Linux; 'open-url' event on macOS
 *   - Single-instance lock: second launch focuses existing window and exits
 *
 * Read order:
 *   1. app.whenReady handler — startup sequence
 *   2. handleDeepLink — protocol routing
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import { registerAuthIpc } from './ipc/auth.ipc';
import { registerMarketDataIpc } from './ipc/market-data.ipc';
import { registerWindowIpc } from './ipc/window.ipc';
import { registerLayoutIpc } from './ipc/layout.ipc';
import { registerSettingsIpc } from './ipc/settings.ipc';
import { PriceFeedService } from './services/price-feed.service';
import { setupAutoUpdater } from './services/auto-updater.service';
import { createWorkspaceWindow } from './window/workspace-window';
import { TrayWidget } from './window/tray-widget';
import { destroyDetached } from './window/window-registry';

// Linux iGPU (Haswell/older) can fail GPU process init — disable for stable dev rendering
if (process.env.NODE_ENV === 'development') {
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-software-rasterizer');
}

let mainWindow: BrowserWindow | null = null;
const priceFeed = new PriceFeedService();
const tray = new TrayWidget();

// ── Single instance lock ─────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}
app.on('second-instance', (_e: unknown, argv: string[]) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  const deepLink = argv.find((a) => a.startsWith('obsidian://'));
  if (deepLink) handleDeepLink(deepLink);
});

// ── Deep link protocol ───────────────────────────────────────────────────────
app.setAsDefaultProtocolClient('obsidian');
app.on('open-url', (event: { preventDefault: () => void }, url: string) => {
  event.preventDefault();
  handleDeepLink(url);
});

function handleDeepLink(url: string) {
  if (!mainWindow) return;
  mainWindow.webContents.send('deep-link', url);
  mainWindow.focus();
}

// ── Global shortcuts ─────────────────────────────────────────────────────────
function registerGlobalShortcuts(win: BrowserWindow) {
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });
  globalShortcut.register('CommandOrControl+Shift+B', () => {
    win.webContents.send('quick-order', { side: 'buy' });
    win.focus();
  });
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    win.webContents.send('quick-order', { side: 'sell' });
    win.focus();
  });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  mainWindow = createWorkspaceWindow();
  mainWindow.on('closed', () => { mainWindow = null; });

  registerAuthIpc(ipcMain);
  registerMarketDataIpc(ipcMain, priceFeed);
  registerWindowIpc(ipcMain, mainWindow);
  registerLayoutIpc(ipcMain);
  registerSettingsIpc(ipcMain);

  tray.create(mainWindow);
  registerGlobalShortcuts(mainWindow);
  setupAutoUpdater(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWorkspaceWindow();
      mainWindow.on('closed', () => { mainWindow = null; });
    } else {
      mainWindow?.focus();
    }
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  priceFeed.disconnect();
  destroyDetached();
  tray.destroy();
  if (process.platform !== 'darwin') app.quit();
});
