/**
 * File:        apps/desktop-pro/renderer/src/features/tab-manager/tab-content.tsx
 * Module:      desktop-pro · Renderer · Tab Manager · TabContent
 * Purpose:     Renders the active tab's TradingWorkstation instance inside the LayoutEngine
 *              docking shell. Each tab gets its own React component tree (keyed by tab id).
 *
 * Exports:
 *   - TabContent({ fetchJson, omsConfig }) → ReactNode
 *
 * Depends on:
 *   - @obsidian/trading-ui — TradingWorkstation, FetchJsonFn, OmsConfig, Instrument
 *   - ./tab-store — useTabStore
 *   - ../layout-engine/layout-engine — LayoutEngine (Phase 3 docking shell)
 *
 * Side-effects:
 *   - Mounts a fresh TradingWorkstation instance per tab (React key strategy)
 *   - Calls updateTabInstrument on instrument change for label sync
 *
 * Key invariants:
 *   - Only the ACTIVE tab's workstation is rendered — inactive tabs are unmounted
 *   - The `key` prop forces React to create a new component tree when switching tabs
 *   - initialInstrument seeds from INSTRUMENTS mock by matching tab's instrumentSymbol
 *   - LayoutEngine is outside the keyed TradingWorkstation so layout state persists
 *     across tab switches (panel sizes are per-window, not per-tab)
 *
 * Read order:
 *   1. TabContent — workstation rendering + instrument change handler
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { useCallback } from 'react';
import { TradingWorkstation, INSTRUMENTS, type FetchJsonFn, type Instrument, type OmsConfig } from '@obsidian/trading-ui';
import { useTabStore, type Tab } from './tab-store';
import { LayoutEngine } from '../layout-engine/layout-engine';

export function TabContent({
  fetchJson,
  omsConfig,
}: {
  fetchJson: FetchJsonFn;
  omsConfig?: OmsConfig;
}) {
  const activeTabId = useTabStore((s: { activeTabId: string }) => s.activeTabId);
  const tabs = useTabStore((s: { tabs: Tab[] }) => s.tabs);
  const updateTabInstrument = useTabStore(
    (s: { updateTabInstrument: (id: string, symbol: string, label?: string) => void }) =>
      s.updateTabInstrument,
  );

  const activeTab = tabs.find((t: Tab) => t.id === activeTabId);

  const initialInstrument =
    INSTRUMENTS.find((i) => i.symbol === activeTab?.instrumentSymbol) ?? INSTRUMENTS[0] ?? null;

  const handleInstrumentChange = useCallback(
    (instrument: Instrument | null) => {
      if (instrument && activeTabId) {
        updateTabInstrument(activeTabId, instrument.symbol, instrument.symbol);
      }
    },
    [activeTabId, updateTabInstrument],
  );

  if (!activeTab) return null;

  return (
    <div className="tab-content">
      <LayoutEngine>
        <TradingWorkstation
          key={activeTabId}
          fetchJson={fetchJson}
          omsConfig={omsConfig}
          initialInstrument={initialInstrument}
          onInstrumentChange={handleInstrumentChange}
        />
      </LayoutEngine>
    </div>
  );
}
