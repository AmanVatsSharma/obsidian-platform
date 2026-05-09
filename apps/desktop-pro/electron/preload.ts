/**
 * File:        apps/desktop-pro/electron/preload.ts
 * Module:      desktop-pro · Electron Preload (Context Bridge)
 * Purpose:     Exposes window.ntBridge — the ONLY sanctioned channel between the renderer (untrusted)
 *              and the main process (full OS access). Nothing else leaks across the boundary.
 *
 * Exports:
 *   - window.ntBridge — injected into renderer global scope via contextBridge
 *
 * Depends on:
 *   - electron — contextBridge, ipcRenderer
 *
 * Side-effects:
 *   - Mutates window.ntBridge (renderer global)
 *
 * Key invariants:
 *   - contextIsolation: true means this script can call ipcRenderer but the renderer page cannot
 *   - All IPC channel names must match handlers registered in electron/ipc/*.ipc.ts
 *   - subscribe() returns a cleanup function — caller must invoke it on component unmount
 *   - auth token flows only through safeStorage → never through renderer localStorage
 *
 * Read order:
 *   1. NtBridge interface — understand the full API surface
 *   2. contextBridge.exposeInMainWorld — wiring
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { contextBridge, ipcRenderer } from 'electron';

export type NtBridge = {
  auth: {
    setToken: (token: string) => Promise<void>;
    getToken: () => Promise<string | null>;
    clearToken: () => Promise<void>;
  };
  feed: {
    subscribe: (symbol: string, handler: (tick: unknown) => void) => () => void;
    unsubscribe: (symbol: string) => void;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    openChart: (symbol: string) => void;
    openMonitor: (symbol: string) => void;
  };
  layout: {
    save: (layout: unknown) => Promise<void>;
    load: () => Promise<unknown>;
  };
  settings: {
    getAutoLaunch: () => Promise<boolean>;
    setAutoLaunch: (enabled: boolean) => Promise<void>;
  };
  updater: {
    checkForUpdates: () => Promise<void>;
    quitAndInstall: () => void;
  };
  on: (channel: string, handler: (...args: unknown[]) => void) => () => void;
};

contextBridge.exposeInMainWorld('ntBridge', {
  auth: {
    setToken: (token: string) => ipcRenderer.invoke('auth:set-token', token),
    getToken: () => ipcRenderer.invoke('auth:get-token'),
    clearToken: () => ipcRenderer.invoke('auth:clear-token'),
  },

  feed: {
    subscribe: (symbol: string, handler: (tick: unknown) => void) => {
      const channel = `feed:tick:${symbol}`;
      const listener = (_event: { sender: unknown }, tick: unknown) => handler(tick);
      ipcRenderer.on(channel, listener);
      ipcRenderer.invoke('feed:subscribe', symbol).catch(() => null);
      return () => {
        ipcRenderer.off(channel, listener);
        ipcRenderer.invoke('feed:unsubscribe', symbol).catch(() => null);
      };
    },
    unsubscribe: (symbol: string) => {
      ipcRenderer.invoke('feed:unsubscribe', symbol).catch(() => null);
    },
  },

  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    openChart: (symbol: string) => ipcRenderer.invoke('window:open-chart', symbol),
    openMonitor: (symbol: string) => ipcRenderer.invoke('window:open-monitor', symbol),
  },

  layout: {
    save: (layout: unknown) => ipcRenderer.invoke('layout:save', layout),
    load: () => ipcRenderer.invoke('layout:load'),
  },

  settings: {
    getAutoLaunch: () => ipcRenderer.invoke('settings:get-auto-launch'),
    setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke('settings:set-auto-launch', enabled),
  },

  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),
    quitAndInstall: () => ipcRenderer.send('updater:quit-and-install'),
  },

  on: (channel: string, handler: (...args: unknown[]) => void) => {
    const listener = (_event: { sender: unknown }, ...args: unknown[]) => handler(...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.off(channel, listener);
  },
} satisfies NtBridge);
