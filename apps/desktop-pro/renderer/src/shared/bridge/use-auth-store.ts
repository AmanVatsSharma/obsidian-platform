/**
 * File:        apps/desktop-pro/renderer/src/shared/bridge/use-auth-store.ts
 * Module:      desktop-pro · Renderer · Auth Store
 * Purpose:     Zustand store for auth token — reads from safeStorage via ntBridge on init,
 *              writes back through ntBridge on login/logout.
 *
 * Exports:
 *   - useAuthStore — Zustand store hook: { token, setToken, clearToken, initialized }
 *
 * Depends on:
 *   - zustand — create
 *   - ./nt-bridge.d.ts — window.ntBridge type
 *
 * Side-effects:
 *   - Calls ntBridge.auth.getToken() once on module load to hydrate from safeStorage
 *
 * Key invariants:
 *   - initialized flag prevents rendering the auth guard before hydration completes
 *   - setToken persists to safeStorage AND updates the in-memory Zustand state
 *   - clearToken wipes both safeStorage and in-memory state
 *
 * Read order:
 *   1. useAuthStore — state shape
 *   2. hydration effect at module level
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { create } from 'zustand';

type AuthState = {
  token: string | null;
  initialized: boolean;
  setToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set: (partial: Partial<AuthState>) => void) => ({
  token: null,
  initialized: false,

  setToken: async (token: string) => {
    await window.ntBridge?.auth.setToken(token);
    set({ token });
  },

  clearToken: async () => {
    await window.ntBridge?.auth.clearToken();
    set({ token: null });
  },
}));

// Hydrate from safeStorage on module load
window.ntBridge?.auth.getToken().then((token) => {
  useAuthStore.setState({ token, initialized: true });
});
