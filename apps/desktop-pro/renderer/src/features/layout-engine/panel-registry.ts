/**
 * File:        apps/desktop-pro/renderer/src/features/layout-engine/panel-registry.ts
 * Module:      desktop-pro · Renderer · Layout Engine · Panel Registry
 * Purpose:     Canonical panel ID list and display metadata — wires panel identifiers to
 *              human-readable labels for preset configs and Phase 4 tear-off support.
 *
 * Exports:
 *   - PANEL_IDS: readonly string[]          — stable panel identifiers
 *   - PanelId                               — union type of valid panel IDs
 *   - PANEL_LABELS: Record<PanelId, string> — display names (ALL CAPS per design system)
 *
 * Depends on:
 *   - none
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - These IDs are stable across versions — they are persisted in layout.json
 *   - In Phase 3 panels are rendered inside TradingWorkstation; in Phase 4 they become
 *     standalone BrowserWindow targets identified by these same IDs
 *
 * Read order:
 *   1. PANEL_IDS — authoritative list
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

export const PANEL_IDS = [
  'chart',
  'dom',
  'watchlist',
  'orderEntry',
  'account',
  'bottomTabs',
] as const;

export type PanelId = (typeof PANEL_IDS)[number];

export const PANEL_LABELS: Record<PanelId, string> = {
  chart: 'CHART',
  dom: 'DEPTH',
  watchlist: 'WATCHLIST',
  orderEntry: 'ORDER ENTRY',
  account: 'ACCOUNT',
  bottomTabs: 'POSITIONS',
};
