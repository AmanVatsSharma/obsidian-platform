/**
 * File:        apps/desktop-pro/electron/window/workspace-window.ts
 * Module:      desktop-pro · Main · Workspace Window
 * Purpose:     BrowserWindow factory for the main trading workspace — handles security config,
 *              CSP injection, external link interception, and dev vs. production URL resolution.
 *
 * Exports:
 *   - createWorkspaceWindow() → BrowserWindow
 *
 * Depends on:
 *   - electron — BrowserWindow, shell
 *   - path — join
 *
 * Side-effects:
 *   - Creates a BrowserWindow and loads the renderer URL
 *   - Registers a session webRequest hook for CSP headers
 *   - Registers a setWindowOpenHandler to route external links to the OS browser
 *
 * Key invariants:
 *   - contextIsolation: true, nodeIntegration: false, sandbox: true — never weaken this
 *   - CSP blocks eval, remote scripts, and non-self origins; ws: and wss: allowed for price feed
 *   - In dev mode, DevTools open detached and the Vite HMR server at :5173 is loaded
 *
 * Read order:
 *   1. createWorkspaceWindow — factory function
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { BrowserWindow, shell } from 'electron';
import { join } from 'path';

const isDev = !BrowserWindow.getAllWindows().length && process.env['NODE_ENV'] === 'development';

export function createWorkspaceWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#06080A',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Content Security Policy — injected on all renderer responses
  win.webContents.session.webRequest.onHeadersReceived(
    (details: { responseHeaders?: Record<string, string[]> }, callback: (r: unknown) => void) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss: http://localhost:*;",
          ],
        },
      });
    },
  );

  // Route external links (help docs, TOS, etc.) to the OS browser
  win.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env['NODE_ENV'] === 'development') {
    void win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  win.once('ready-to-show', () => win.show());
  return win;
}
