/**
 * File:        apps/desktop-pro/electron/ipc/layout.ipc.ts
 * Module:      desktop-pro · IPC · Layout Persistence
 * Purpose:     IPC handlers for reading/writing layout JSON to app.getPath('userData').
 *
 * Exports:
 *   - registerLayoutIpc(ipcMain) → void   — registers layout:save, layout:load
 *
 * Depends on:
 *   - electron — app
 *   - fs — readFile, writeFile (promises)
 *
 * Side-effects:
 *   - Reads/writes <userData>/layout.json on disk
 *
 * Key invariants:
 *   - Returns null (not throws) when layout file is absent or corrupt
 *   - Writes are atomic-enough for a desktop app (no concurrent writers)
 *
 * Read order:
 *   1. registerLayoutIpc — save/load handlers
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { app } from 'electron';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import type { IpcMain } from 'electron';

const layoutPath = () => join(app.getPath('userData'), 'layout.json');

export function registerLayoutIpc(ipcMain: IpcMain): void {
  ipcMain.handle('layout:save', async (_event: unknown, layout: unknown) => {
    await writeFile(layoutPath(), JSON.stringify(layout, null, 2), 'utf-8');
  });

  ipcMain.handle('layout:load', async () => {
    try {
      const raw = await readFile(layoutPath(), 'utf-8');
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  });
}
