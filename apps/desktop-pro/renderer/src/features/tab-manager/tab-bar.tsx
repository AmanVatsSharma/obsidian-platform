/**
 * File:        apps/desktop-pro/renderer/src/features/tab-manager/tab-bar.tsx
 * Module:      desktop-pro · Renderer · Tab Manager · TabBar
 * Purpose:     Bloomberg-style tab strip — draggable tabs, + button, × close, active indicator.
 *
 * Exports:
 *   - TabBar → ReactNode
 *
 * Depends on:
 *   - ./tab-store — useTabStore
 *   - ./use-tab-keyboard — registers keyboard shortcuts
 *
 * Side-effects:
 *   - Registers document keydown handlers via useTabKeyboard
 *
 * Key invariants:
 *   - Drag-to-reorder uses HTML5 DnD (no library); dragItem ref avoids unnecessary re-renders
 *   - The close button on a tab stops event propagation so it doesn't activate the tab first
 *   - Ctrl+T shortcut shown in + button tooltip for discoverability
 *
 * Read order:
 *   1. TabBar — tab strip render
 *   2. drag handlers — reorder logic
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { useRef } from 'react';
import { useTabStore, type Tab } from './tab-store';
import { useTabKeyboard } from './use-tab-keyboard';

export function TabBar() {
  useTabKeyboard();
  const tabs = useTabStore((s: { tabs: Tab[] }) => s.tabs);
  const activeTabId = useTabStore((s: { activeTabId: string }) => s.activeTabId);
  const addTab = useTabStore((s: { addTab: () => void }) => s.addTab);
  const closeTab = useTabStore((s: { closeTab: (id: string) => void }) => s.closeTab);
  const setActiveTab = useTabStore((s: { setActiveTab: (id: string) => void }) => s.setActiveTab);
  const reorderTab = useTabStore(
    (s: { reorderTab: (from: number, to: number) => void }) => s.reorderTab,
  );

  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const onDragStart = (idx: number) => {
    dragItem.current = idx;
  };

  const onDragEnter = (idx: number) => {
    dragOver.current = idx;
  };

  const onDrop = () => {
    if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      reorderTab(dragItem.current, dragOver.current);
    }
    dragItem.current = null;
    dragOver.current = null;
  };

  return (
    <div className="tab-bar">
      {tabs.map((tab: Tab, idx: number) => (
        <div
          key={tab.id}
          className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
          draggable
          onDragStart={() => onDragStart(idx)}
          onDragEnter={() => onDragEnter(idx)}
          onDragEnd={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => setActiveTab(tab.id)}
          title={tab.instrumentSymbol}
        >
          <span className="tab-item-label">{tab.label}</span>
          {tabs.length > 1 && (
            <button
              className="tab-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              aria-label={`Close ${tab.label}`}
              title="Close tab"
            >
              ×
            </button>
          )}
        </div>
      ))}

      <button
        className="tab-add-btn"
        onClick={() => addTab()}
        title="New tab (Ctrl+T)"
        aria-label="Add new tab"
      >
        +
      </button>

      <div className="tab-bar-spacer" />

      <div className="tab-bar-hints">
        <span>Ctrl+T new · Ctrl+W close · Ctrl+1–9 switch</span>
      </div>
    </div>
  );
}
