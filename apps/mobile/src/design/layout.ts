/**
 * File:        apps/mobile/src/design/layout.ts
 * Module:      mobile · Design · Layout
 * Purpose:     Layout constants for safe areas, header heights, and tab bar
 *              sizing. Centralized so screen files do not hardcode magic numbers.
 *
 * Exports:
 *   - layout              — flat object with headerHeight, tabBarHeight, hitSlop
 *
 * Depends on:
 *   - none
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - The tab bar is rendered as the root of the Home stack and is sized
 *     for one-handed thumb reach. Do not change `tabBarHeight` without
 *     confirming with design.
 *   - `hitSlop` mirrors the 44pt minimum hit target recommended by
 *     iOS HIG and Material guidelines. Use it on every icon button.
 *
 * Read order:
 *   1. layout — the only export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

export const layout = {
  headerHeight: 48,
  tabBarHeight: 64,
  /** Standard 44pt touch target for icon buttons. */
  hitSlop: { top: 12, bottom: 12, left: 12, right: 12 },
} as const;
