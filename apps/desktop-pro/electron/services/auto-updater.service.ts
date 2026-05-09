/**
 * File:        apps/desktop-pro/electron/services/auto-updater.service.ts
 * Module:      desktop-pro · Services · Auto Updater
 * Purpose:     electron-updater setup — checks for updates on launch and notifies the renderer
 *              via IPC so the user can accept or defer the install.
 *
 * Exports:
 *   - setupAutoUpdater(mainWin) → void
 *
 * Depends on:
 *   - electron-updater — autoUpdater
 *   - electron — BrowserWindow, ipcMain
 *
 * Side-effects:
 *   - Registers 'updater:check' and 'updater:quit-and-install' IPC channels
 *   - Sends 'updater:status' events to the renderer (checking, available, not-available, error, ready)
 *
 * Key invariants:
 *   - Auto-download is disabled; the renderer controls when the download starts
 *   - Silent check on app ready; user-facing prompt only when update-available
 *
 * Read order:
 *   1. setupAutoUpdater — event wiring + IPC registration
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { autoUpdater } from 'electron-updater';
import { ipcMain, type BrowserWindow } from 'electron';

export function setupAutoUpdater(mainWin: BrowserWindow): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  const send = (status: string, data?: unknown) => {
    if (!mainWin.isDestroyed()) {
      mainWin.webContents.send('updater:status', { status, data });
    }
  };

  autoUpdater.on('checking-for-update', () => send('checking'));
  autoUpdater.on('update-available', (info: unknown) => {
    send('available', info);
    void autoUpdater.downloadUpdate();
  });
  autoUpdater.on('update-not-available', () => send('not-available'));
  autoUpdater.on('download-progress', (progress: unknown) => send('progress', progress));
  autoUpdater.on('update-downloaded', () => send('ready'));
  autoUpdater.on('error', (err: Error) => send('error', err.message));

  ipcMain.handle('updater:check', () => autoUpdater.checkForUpdates());
  ipcMain.on('updater:quit-and-install', () => autoUpdater.quitAndInstall());

  // Silent background check on launch
  autoUpdater.checkForUpdates().catch(() => null);
}
