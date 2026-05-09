/**
 * File:        apps/desktop-pro/electron/window/window-registry.ts
 * Module:      desktop-pro · Main · Window Registry
 * Purpose:     Tracks open detached-panel BrowserWindows by a string key so duplicate
 *              detach requests focus the existing window instead of opening a new one.
 *
 * Exports:
 *   - focusOrCreate(key, factory) → void
 *     If a live window exists for key, focus it. Otherwise call factory() and register the window.
 *   - destroyDetached() → void
 *     Close all registered windows (called on main window close to clean up orphans).
 *
 * Depends on:
 *   - electron — BrowserWindow
 *
 * Side-effects:
 *   - win.on('closed') cleanup removes the key from the registry automatically
 *
 * Key invariants:
 *   - A destroyed window's key is removed before any new window is registered for that key
 *   - Keys are stable across the session: format is `${type}:${symbol}` e.g. `chart:EURUSD`
 *
 * Read order:
 *   1. focusOrCreate — primary API
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { BrowserWindow } from 'electron';

const registry = new Map<string, BrowserWindow>();

function getAlive(key: string): BrowserWindow | undefined {
  const win = registry.get(key);
  if (!win || win.isDestroyed()) {
    registry.delete(key);
    return undefined;
  }
  return win;
}

export function focusOrCreate(key: string, factory: () => BrowserWindow): void {
  const existing = getAlive(key);
  if (existing) {
    if (existing.isMinimized()) existing.restore();
    existing.focus();
    return;
  }
  const win = factory();
  registry.set(key, win);
  win.on('closed', () => registry.delete(key));
}

export function destroyDetached(): void {
  for (const [key, win] of registry) {
    if (!win.isDestroyed()) win.close();
    registry.delete(key);
  }
}
