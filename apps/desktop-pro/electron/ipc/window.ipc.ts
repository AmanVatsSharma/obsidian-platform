/**
 * File:        apps/desktop-pro/electron/ipc/window.ipc.ts
 * Module:      desktop-pro · IPC · Window
 * Purpose:     IPC handlers for native window controls: minimize, maximize, close, and detach panels.
 *
 * Exports:
 *   - registerWindowIpc(ipcMain, mainWin) → void
 *
 * Depends on:
 *   - electron — BrowserWindow, IpcMain
 *   - ../window/window-registry — focusOrCreate (dedup logic)
 *   - ../window/chart-detach-window — createChartWindow, createMonitorWindow
 *
 * Side-effects:
 *   - Calls win.minimize / win.maximize / win.close on the main window
 *   - Creates or focuses detached-panel BrowserWindows via the registry
 *
 * Key invariants:
 *   - Duplicate detach requests for the same symbol focus the existing window — no new window
 *   - All detached windows use the same security model as the main window
 *
 * Read order:
 *   1. registerWindowIpc — all IPC handler registrations
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import type { IpcMain } from 'electron';
import { BrowserWindow } from 'electron';
import { focusOrCreate } from '../window/window-registry';
import { createChartWindow, createMonitorWindow } from '../window/chart-detach-window';

export function registerWindowIpc(ipcMain: IpcMain, mainWin: BrowserWindow): void {
  ipcMain.on('window:minimize', () => mainWin.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWin.isMaximized()) mainWin.unmaximize();
    else mainWin.maximize();
  });
  ipcMain.on('window:close', () => mainWin.close());

  ipcMain.handle('window:open-chart', (_event: unknown, symbol: string) => {
    focusOrCreate(`chart:${symbol}`, () => createChartWindow(symbol));
  });

  ipcMain.handle('window:open-monitor', (_event: unknown, symbol: string) => {
    focusOrCreate(`monitor:${symbol}`, () => createMonitorWindow(symbol));
  });
}
