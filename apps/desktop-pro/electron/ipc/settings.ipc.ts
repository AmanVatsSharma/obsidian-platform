/**
 * File:        apps/desktop-pro/electron/ipc/settings.ipc.ts
 * Module:      desktop-pro · IPC · Settings
 * Purpose:     IPC handlers for application-level settings: auto-launch on login.
 *
 * Exports:
 *   - registerSettingsIpc(ipcMain) → void
 *
 * Depends on:
 *   - electron — app, IpcMain
 *
 * Side-effects:
 *   - Calls app.getLoginItemSettings / app.setLoginItemSettings (persisted by OS)
 *
 * Key invariants:
 *   - openAtLogin reads the registry on Windows; macOS LaunchAgent plist
 *   - On packaged Windows builds, Squirrel requires execPath + args — handled here
 *
 * Read order:
 *   1. registerSettingsIpc — handler list
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { app } from 'electron';
import type { IpcMain } from 'electron';

export function registerSettingsIpc(ipcMain: IpcMain): void {
  ipcMain.handle('settings:get-auto-launch', () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle('settings:set-auto-launch', (_event: unknown, enabled: boolean) => {
    if (process.platform === 'win32' && app.isPackaged) {
      // Squirrel launcher on Windows requires explicit path + args
      app.setLoginItemSettings({
        openAtLogin: enabled,
        path: process.execPath,
        args: ['--processStart', `"${app.getName()}.exe"`, '--process-start-args', '"--hidden"'],
      });
    } else {
      app.setLoginItemSettings({ openAtLogin: enabled });
    }
  });
}
