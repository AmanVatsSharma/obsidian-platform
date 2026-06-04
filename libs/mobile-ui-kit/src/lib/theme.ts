/**
 * File:        libs/mobile-ui-kit/src/lib/theme.ts
 * Module:      mobile-ui-kit · Theme tokens
 * Purpose:     Mobile-side mirror of the Obsidian Design System tokens.
 *              Values come from `libs/obsidian-ui/src/styles/tokens.css`
 *              and are pinned here so React Native (which cannot read CSS
 *              custom properties) can render the same palette. Re-wrap,
 *              do not invent — colors must match the design system.
 *
 * Exports:
 *   - colors          — semantic palette (bg/fg/bull/bear/etc.)
 *   - radius          — 4/6/8/12 step radii
 *   - spacing         — 4/8/12/16/24/32 step spacing
 *   - motion          — easing + duration tokens
 *   - typography      — font families + sizes for mono / display / ui
 *
 * Depends on:
 *   - none
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Bull (#10D996) and Bear (#FF3B5C) match tokens.css exactly.
 *   - Font families fall back to platform defaults when Syne / DM Sans /
 *     IBM Plex Mono are not loaded. Mobile apps ship the Google Fonts
 *     via expo-font in apps/mobile/app/_layout.tsx.
 *
 * Read order:
 *   1. colors → radius → spacing → motion → typography
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

export const colors = {
  bgBase: '#06080A',
  bgSurface: '#0C0E12',
  bgPanel: '#0F1216',
  bgElevated: '#141820',
  bgHover: '#1A1F28',
  bgActive: '#1E2530',

  border: '#1C2028',
  borderMd: '#252C38',
  borderHi: '#2E3847',

  fg1: '#E2E8F0',
  fg2: '#8B95A3',
  fg3: '#4A5568',
  fg4: '#2D3748',

  bull: '#10D996',
  bullDim: 'rgba(16,217,150,0.10)',
  bear: '#FF3B5C',
  bearDim: 'rgba(255,59,92,0.10)',
  accent: '#3B82F6',
  warn: '#F59E0B',
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
} as const;

export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 24,
  s6: 32,
} as const;

export const motion = {
  ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
  durFast: 120,
  dur: 180,
  durSlow: 300,
} as const;

export const typography = {
  display: 'Syne',
  ui: 'DM Sans',
  mono: 'IBM Plex Mono',
  size10: 10,
  size11: 11,
  size12: 12,
  size13: 13,
  size14: 14,
  size16: 16,
  size18: 18,
  size22: 22,
} as const;
