/**
 * File:        apps/desktop-pro/renderer/src/features/layout-engine/use-layout-store.ts
 * Module:      desktop-pro · Renderer · Layout Engine · Store
 * Purpose:     Zustand store for panel layout state — preset, panel dimensions, collapse flags.
 *              Hydrates from ntBridge.layout on module load; persists on every mutation.
 *
 * Exports:
 *   - useLayoutStore — Zustand hook exposing LayoutState
 *   - LayoutState    — full store shape (preset + dimensions + actions)
 *
 * Depends on:
 *   - zustand/vanilla — create
 *   - ./layout-preset — PRESETS, LayoutPresetId
 *   - ../../shared/bridge/nt-bridge.d — window.ntBridge (ambient)
 *
 * Side-effects:
 *   - Calls window.ntBridge.layout.load() once on module load (async, fires after first render)
 *   - Calls window.ntBridge.layout.save() on every mutation (deferred to next tick)
 *
 * Key invariants:
 *   - wlWidth / rsWidth represent the EXPANDED size; collapse is tracked separately
 *   - LayoutEngine computes effective width = collapsed ? 40 : storedWidth
 *   - Layout is saved under the key `panelLayout` within ntBridge's layout JSON blob
 *     so it does not clobber the `tabs` key written by tab-store
 *
 * Read order:
 *   1. LayoutState — shape
 *   2. useLayoutStore initializer — default values + actions
 *   3. hydration block — bottom of file
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { create } from 'zustand';
import { PRESETS, type LayoutPresetId } from './layout-preset';

export type LayoutState = {
  preset: LayoutPresetId;
  wlWidth: number;
  rsWidth: number;
  bottomH: number;
  wlCollapsed: boolean;
  rsCollapsed: boolean;
  setPreset: (id: LayoutPresetId) => void;
  setWlWidth: (v: number) => void;
  setRsWidth: (v: number) => void;
  setBottomH: (v: number) => void;
  toggleWl: () => void;
  toggleRs: () => void;
};

const DEFAULT = PRESETS.swing;

function persistLayout(state: LayoutState) {
  if (typeof window !== 'undefined' && window.ntBridge) {
    window.ntBridge.layout.save({
      panelLayout: {
        preset: state.preset,
        wlWidth: state.wlWidth,
        rsWidth: state.rsWidth,
        bottomH: state.bottomH,
        wlCollapsed: state.wlCollapsed,
        rsCollapsed: state.rsCollapsed,
      },
    });
  }
}

export const useLayoutStore = create<LayoutState>((set: (partial: Partial<LayoutState>) => void, get: () => LayoutState) => ({
  preset: DEFAULT.id,
  wlWidth: DEFAULT.wlWidth,
  rsWidth: DEFAULT.rsWidth,
  bottomH: DEFAULT.bottomH,
  wlCollapsed: DEFAULT.wlCollapsed,
  rsCollapsed: DEFAULT.rsCollapsed,

  setPreset(id: LayoutPresetId) {
    const p = PRESETS[id];
    if (!p) return;
    set({ preset: p.id, wlWidth: p.wlWidth, rsWidth: p.rsWidth, bottomH: p.bottomH, wlCollapsed: p.wlCollapsed, rsCollapsed: p.rsCollapsed });
    persistLayout(get());
  },

  setWlWidth(v: number) {
    set({ wlWidth: v });
    persistLayout(get());
  },

  setRsWidth(v: number) {
    set({ rsWidth: v });
    persistLayout(get());
  },

  setBottomH(v: number) {
    set({ bottomH: v });
    persistLayout(get());
  },

  toggleWl() {
    set({ wlCollapsed: !get().wlCollapsed });
    persistLayout(get());
  },

  toggleRs() {
    set({ rsCollapsed: !get().rsCollapsed });
    persistLayout(get());
  },
}));

// Hydrate from persisted layout (fires after initial render — non-blocking)
if (typeof window !== 'undefined') {
  window.ntBridge?.layout
    .load()
    .then((data: unknown) => {
      type Saved = Partial<{ preset: LayoutPresetId; wlWidth: number; rsWidth: number; bottomH: number; wlCollapsed: boolean; rsCollapsed: boolean }>;
      const saved: Saved | undefined = (data as { panelLayout?: Saved })?.panelLayout;
      if (!saved) return;
      const preset = (saved.preset && PRESETS[saved.preset]) ? saved.preset : DEFAULT.id;
      useLayoutStore.setState({
        preset,
        wlWidth: saved.wlWidth ?? PRESETS[preset].wlWidth,
        rsWidth: saved.rsWidth ?? PRESETS[preset].rsWidth,
        bottomH: saved.bottomH ?? PRESETS[preset].bottomH,
        wlCollapsed: saved.wlCollapsed ?? PRESETS[preset].wlCollapsed,
        rsCollapsed: saved.rsCollapsed ?? PRESETS[preset].rsCollapsed,
      });
    })
    .catch(() => {});
}
