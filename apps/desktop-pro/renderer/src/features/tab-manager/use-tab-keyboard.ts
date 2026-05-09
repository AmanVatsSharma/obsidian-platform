/**
 * File:        apps/desktop-pro/renderer/src/features/tab-manager/use-tab-keyboard.ts
 * Module:      desktop-pro · Renderer · Tab Manager · Keyboard
 * Purpose:     Keyboard shortcuts for tab navigation: new tab, close tab, switch 1–9.
 *
 * Exports:
 *   - useTabKeyboard() → void   — registers document keydown listener on mount
 *
 * Depends on:
 *   - react — useEffect
 *   - ./tab-store — useTabStore
 *
 * Side-effects:
 *   - addEventListener('keydown') on document
 *   - Calls tab store mutations
 *
 * Key invariants:
 *   - Ctrl+T / Ctrl+W / Ctrl+1–9 only fire when no input element is focused
 *   - Ctrl+9 selects the last tab regardless of count
 *
 * Read order:
 *   1. useTabKeyboard — handler logic
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { useEffect } from 'react';
import { useTabStore } from './tab-store';

export function useTabKeyboard(): void {
  const addTab = useTabStore((s: { addTab: () => void }) => s.addTab);
  const closeTab = useTabStore((s: { closeTab: (id: string) => void }) => s.closeTab);
  const setActiveTab = useTabStore((s: { setActiveTab: (id: string) => void }) => s.setActiveTab);
  const tabs = useTabStore((s: { tabs: { id: string }[] }) => s.tabs);
  const activeTabId = useTabStore((s: { activeTabId: string }) => s.activeTabId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      const target = e.target as HTMLElement;
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === 't' && !inInput) {
        e.preventDefault();
        addTab();
        return;
      }

      if (e.key === 'w' && !inInput) {
        e.preventDefault();
        closeTab(activeTabId);
        return;
      }

      const digit = parseInt(e.key, 10);
      if (!isNaN(digit) && digit >= 1 && digit <= 9 && !inInput) {
        e.preventDefault();
        const target = digit === 9 ? tabs[tabs.length - 1] : tabs[digit - 1];
        if (target) setActiveTab(target.id);
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [addTab, closeTab, setActiveTab, tabs, activeTabId]);
}
