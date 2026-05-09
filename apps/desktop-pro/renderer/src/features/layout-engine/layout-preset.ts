/**
 * File:        apps/desktop-pro/renderer/src/features/layout-engine/layout-preset.ts
 * Module:      desktop-pro · Renderer · Layout Engine · Presets
 * Purpose:     Named layout configurations for the three trader archetypes.
 *
 * Exports:
 *   - LayoutPresetId                              — 'scalper' | 'swing' | 'macro'
 *   - LayoutPreset                                — full preset shape
 *   - PRESETS: Record<LayoutPresetId, LayoutPreset> — canonical preset definitions
 *
 * Depends on:
 *   - none
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - wlWidth / rsWidth are the expanded widths; collapse is a separate boolean flag
 *   - macro preset collapses the right sidebar (order entry hidden) to maximize news/positions
 *
 * Read order:
 *   1. LayoutPreset — data shape
 *   2. PRESETS — preset values
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

export type LayoutPresetId = 'scalper' | 'swing' | 'macro';

export type LayoutPreset = {
  id: LayoutPresetId;
  label: string;
  wlWidth: number;
  rsWidth: number;
  bottomH: number;
  wlCollapsed: boolean;
  rsCollapsed: boolean;
};

export const PRESETS: Record<LayoutPresetId, LayoutPreset> = {
  scalper: {
    id: 'scalper',
    label: 'SCALPER',
    wlWidth: 180,
    rsWidth: 240,
    bottomH: 200,
    wlCollapsed: false,
    rsCollapsed: false,
  },
  swing: {
    id: 'swing',
    label: 'SWING',
    wlWidth: 220,
    rsWidth: 260,
    bottomH: 300,
    wlCollapsed: false,
    rsCollapsed: false,
  },
  macro: {
    id: 'macro',
    label: 'MACRO',
    wlWidth: 180,
    rsWidth: 260,
    bottomH: 380,
    wlCollapsed: false,
    rsCollapsed: true,
  },
};
