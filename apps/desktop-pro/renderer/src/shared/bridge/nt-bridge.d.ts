/**
 * File:        apps/desktop-pro/renderer/src/shared/bridge/nt-bridge.d.ts
 * Module:      desktop-pro · Renderer · Bridge Types
 * Purpose:     TypeScript ambient declaration — types window.ntBridge for the renderer.
 *
 * Exports:
 *   - NtBridgeApi — full type of window.ntBridge
 *
 * Depends on:
 *   - none (ambient type declaration)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Must stay in sync with electron/preload.ts — the actual implementation
 *   - window.ntBridge is undefined in web (Next.js) context; only exists in Electron renderer
 *
 * Read order:
 *   1. NtBridgeApi — full surface
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

export interface NtBridgeApi {
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
}

declare global {
  interface Window {
    ntBridge?: NtBridgeApi;
  }
}
