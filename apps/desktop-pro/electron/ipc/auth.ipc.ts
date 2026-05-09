/**
 * File:        apps/desktop-pro/electron/ipc/auth.ipc.ts
 * Module:      desktop-pro · IPC · Auth
 * Purpose:     IPC handlers for auth token CRUD backed by electron.safeStorage (OS keychain).
 *
 * Exports:
 *   - registerAuthIpc(ipcMain) → void   — registers auth:set-token, auth:get-token, auth:clear-token
 *
 * Depends on:
 *   - electron — safeStorage
 *
 * Side-effects:
 *   - Reads/writes OS keychain via safeStorage (macOS Keychain / Windows Credential Vault)
 *
 * Key invariants:
 *   - Tokens are encrypted at rest; safeStorage is unavailable until app.whenReady resolves
 *   - Returns null (not throws) when no token is stored
 *
 * Read order:
 *   1. registerAuthIpc — all three handlers
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { safeStorage } from 'electron';
import type { IpcMain } from 'electron';

const KEY = 'obsidian-auth-token';
let _encrypted: Buffer | null = null;

export function registerAuthIpc(ipcMain: IpcMain): void {
  ipcMain.handle('auth:set-token', (_event: unknown, token: string) => {
    if (!safeStorage.isEncryptionAvailable()) {
      console.warn('[auth.ipc] safeStorage unavailable — token NOT persisted');
      return;
    }
    _encrypted = safeStorage.encryptString(token);
  });

  ipcMain.handle('auth:get-token', () => {
    if (!_encrypted || !safeStorage.isEncryptionAvailable()) return null;
    try {
      return safeStorage.decryptString(_encrypted);
    } catch {
      _encrypted = null;
      return null;
    }
  });

  ipcMain.handle('auth:clear-token', () => {
    _encrypted = null;
  });
}
