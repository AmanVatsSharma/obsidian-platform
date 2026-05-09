/**
 * File:        apps/desktop-pro/renderer/src/features/tab-manager/tab-store.ts
 * Module:      desktop-pro · Renderer · Tab Manager · Store
 * Purpose:     Zustand store for Bloomberg-style instrument tabs — tracks tabs[], activeTabId,
 *              and persists the full tab list to disk via ntBridge.layout on every mutation.
 *
 * Exports:
 *   - Tab                — { id, label, instrumentSymbol } tab record
 *   - TabStore           — full store type
 *   - useTabStore        — Zustand hook
 *   - DEFAULT_TAB_ID     — id of the first immutable default tab
 *
 * Depends on:
 *   - zustand — create
 *
 * Side-effects:
 *   - Calls ntBridge.layout.save() on every mutation (debounced via setTimeout)
 *   - Calls ntBridge.layout.load() once on module hydration
 *
 * Key invariants:
 *   - At least one tab always exists — closing the last tab is a no-op
 *   - activeTabId always points to an existing tab after every mutation
 *   - Tab ids are UUID-ish strings (Date.now() + random) — unique within a session
 *
 * Read order:
 *   1. Tab / TabStore — data shapes
 *   2. useTabStore — mutation logic
 *   3. hydration block at bottom
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { create } from 'zustand';

export type Tab = {
  id: string;
  label: string;
  instrumentSymbol: string;
};

type TabStore = {
  tabs: Tab[];
  activeTabId: string;
  addTab: (instrumentSymbol?: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  reorderTab: (fromIndex: number, toIndex: number) => void;
  updateTabInstrument: (id: string, symbol: string, label?: string) => void;
};

export const DEFAULT_TAB_ID = 'default-tab';

function newId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function persist(tabs: Tab[], activeTabId: string): void {
  setTimeout(() => {
    window.ntBridge?.layout.save({ tabs, activeTabId }).catch(() => null);
  }, 0);
}

export const useTabStore = create<TabStore>((set: (partial: Partial<TabStore>) => void, get: () => TabStore) => ({
  tabs: [{ id: DEFAULT_TAB_ID, label: 'EURUSD', instrumentSymbol: 'EURUSD' }],
  activeTabId: DEFAULT_TAB_ID,

  addTab: (instrumentSymbol = 'EURUSD') => {
    const id = newId();
    const tab: Tab = { id, label: instrumentSymbol, instrumentSymbol };
    const tabs = [...get().tabs, tab];
    set({ tabs, activeTabId: id });
    persist(tabs, id);
  },

  closeTab: (id: string) => {
    const { tabs, activeTabId } = get();
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex((t) => t.id === id);
    const next = tabs.filter((t) => t.id !== id);
    let nextActive = activeTabId;
    if (activeTabId === id) {
      nextActive = (next[idx] ?? next[idx - 1] ?? next[0]).id;
    }
    set({ tabs: next, activeTabId: nextActive });
    persist(next, nextActive);
  },

  setActiveTab: (id: string) => {
    if (!get().tabs.find((t) => t.id === id)) return;
    set({ activeTabId: id });
    persist(get().tabs, id);
  },

  reorderTab: (fromIndex: number, toIndex: number) => {
    const tabs = [...get().tabs];
    const [moved] = tabs.splice(fromIndex, 1);
    if (!moved) return;
    tabs.splice(toIndex, 0, moved);
    set({ tabs });
    persist(tabs, get().activeTabId);
  },

  updateTabInstrument: (id: string, symbol: string, label?: string) => {
    const tabs = get().tabs.map((t) =>
      t.id === id ? { ...t, instrumentSymbol: symbol, label: label ?? symbol } : t,
    );
    set({ tabs });
    persist(tabs, get().activeTabId);
  },
}));

// Hydrate tabs from disk on app launch
window.ntBridge?.layout.load().then((saved: unknown) => {
  if (!saved || typeof saved !== 'object') return;
  const { tabs, activeTabId } = saved as { tabs?: Tab[]; activeTabId?: string };
  if (Array.isArray(tabs) && tabs.length > 0 && typeof activeTabId === 'string') {
    const validActive = tabs.find((t) => t.id === activeTabId) ? activeTabId : tabs[0]!.id;
    useTabStore.setState({ tabs, activeTabId: validActive });
  }
});
