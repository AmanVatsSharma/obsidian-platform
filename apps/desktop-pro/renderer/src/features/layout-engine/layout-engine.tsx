/**
 * File:        apps/desktop-pro/renderer/src/features/layout-engine/layout-engine.tsx
 * Module:      desktop-pro · Renderer · Layout Engine
 * Purpose:     CSS-var-based dockable layout shell for the trading workstation.
 *              Wraps TradingWorkstation, injects panel-dimension CSS custom properties,
 *              renders draggable resize handles, and provides a preset picker toolbar.
 *
 * Exports:
 *   - LayoutEngine({ children }) → ReactNode
 *     Wrap any content (usually TradingWorkstation) and it gains resize / collapse / preset UI.
 *
 * Depends on:
 *   - ./use-layout-store — useLayoutStore
 *   - ./panel-slot       — ResizeHandle
 *   - ./layout-preset    — PRESETS, LayoutPresetId
 *
 * Side-effects:
 *   - none (pointer listeners are in ResizeHandle and cleaned up on pointerup)
 *
 * Key invariants:
 *   - CSS vars (--layout-wl-width etc.) are set on .layout-engine and cascade into
 *     TradingWorkstation's internal CSS without any prop drilling
 *   - When wlCollapsed/rsCollapsed, the effective CSS var is 40px (icon-width only);
 *     the stored wlWidth/rsWidth retain the expanded size for when it is un-collapsed
 *   - The layout toolbar (28px) sits above the canvas; the status bar (24px) sits
 *     inside the workstation — the bottom handle accounts for that 24px offset
 *
 * Read order:
 *   1. LayoutEngine — main component
 *   2. LayoutToolbar — preset buttons + collapse toggles
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import type { ReactNode } from 'react';
import { ResizeHandle } from './panel-slot';
import { useLayoutStore } from './use-layout-store';
import { PRESETS, type LayoutPresetId } from './layout-preset';

export function LayoutEngine({ children }: { children: ReactNode }) {
  const {
    preset, wlWidth, rsWidth, bottomH,
    wlCollapsed, rsCollapsed,
    setPreset, setWlWidth, setRsWidth, setBottomH,
    toggleWl, toggleRs,
  } = useLayoutStore();

  const effectiveWlWidth = wlCollapsed ? 40 : wlWidth;
  const effectiveRsWidth = rsCollapsed ? 40 : rsWidth;

  return (
    <div
      className="layout-engine"
      style={{
        '--layout-wl-width': `${effectiveWlWidth}px`,
        '--layout-rs-width': `${effectiveRsWidth}px`,
        '--layout-bottom-h': `${bottomH}px`,
      } as React.CSSProperties}
    >
      <LayoutToolbar
        preset={preset}
        wlCollapsed={wlCollapsed}
        rsCollapsed={rsCollapsed}
        onPresetChange={setPreset}
        onToggleWl={toggleWl}
        onToggleRs={toggleRs}
      />

      <div className="layout-engine-canvas">
        {children}

        {!wlCollapsed && (
          <ResizeHandle
            axis="x"
            side="left"
            value={effectiveWlWidth}
            min={120}
            max={400}
            onResize={setWlWidth}
          />
        )}
        {!rsCollapsed && (
          <ResizeHandle
            axis="x"
            side="right"
            value={effectiveRsWidth}
            min={180}
            max={420}
            onResize={setRsWidth}
          />
        )}
        <ResizeHandle
          axis="y"
          side="bottom"
          value={bottomH}
          min={100}
          max={520}
          onResize={setBottomH}
        />
      </div>
    </div>
  );
}

function LayoutToolbar({
  preset, wlCollapsed, rsCollapsed,
  onPresetChange, onToggleWl, onToggleRs,
}: {
  preset: LayoutPresetId;
  wlCollapsed: boolean;
  rsCollapsed: boolean;
  onPresetChange: (id: LayoutPresetId) => void;
  onToggleWl: () => void;
  onToggleRs: () => void;
}) {
  return (
    <div className="layout-toolbar">
      <span className="layout-toolbar-label">LAYOUT</span>

      <div className="layout-preset-group">
        {(Object.keys(PRESETS) as LayoutPresetId[]).map((id) => (
          <button
            key={id}
            className={`layout-preset-btn ${preset === id ? 'active' : ''}`}
            onClick={() => onPresetChange(id)}
            title={`Apply ${PRESETS[id].label} layout`}
          >
            {PRESETS[id].label}
          </button>
        ))}
      </div>

      <div className="layout-toolbar-sep" />

      <button
        className={`layout-collapse-btn ${wlCollapsed ? 'collapsed' : ''}`}
        onClick={onToggleWl}
        title={wlCollapsed ? 'Expand Watchlist' : 'Collapse Watchlist'}
      >
        WL
      </button>

      <button
        className={`layout-collapse-btn ${rsCollapsed ? 'collapsed' : ''}`}
        onClick={onToggleRs}
        title={rsCollapsed ? 'Expand Order Entry' : 'Collapse Order Entry'}
      >
        OE
      </button>
    </div>
  );
}
