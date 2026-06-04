/**
 * File:        apps/mobile/src/design/tokens.ts
 * Module:      mobile · Design · Tokens
 * Purpose:     Obsidian Design System tokens mirrored as a React Native object.
 *              Source of truth is `libs/obsidian-ui/src/tokens/semantic-tokens.json`
 *              and `libs/obsidian-ui/src/styles/tokens.css`. NEVER inline a hex
 *              value in a component — read from this module instead.
 *
 * Exports:
 *   - tokens               — flat object with all Obsidian token values
 *   - color(name)          — typed accessor for a single token by name
 *   - fontFamily(role)     — font family for 'display' | 'ui' | 'data'
 *   - fontFamilyMono       — direct mono family (IBM Plex Mono) for numbers
 *   - motion.durFast/dur/durSlow — durations (ms)
 *   - motion.ease          — easing curve string
 *
 * Depends on:
 *   - libs/obsidian-ui/src/tokens/semantic-tokens.json — the canonical palette
 *
 * Side-effects:
 *   - none (pure data + accessors)
 *
 * Key invariants:
 *   - Token values MUST stay in sync with the canonical semantic-tokens.json.
 *     On drift, the Obsidian UI library is updated FIRST and this file is a
 *     mechanical mirror — never the other way around.
 *   - Numbers/prices/timestamps are ALWAYS rendered in `fontFamilyMono` with
 *     `fontVariant: ['tabular-nums']` (or the `monoNumber` style preset).
 *   - Panel titles / column headers MUST be in `fontFamilyDisplay` UPPERCASE
 *     with `letterSpacing: 0.08em` (see `textStyles.sectionTitle`).
 *   - Structure uses 1px `color.border` hairlines, never shadows.
 *   - BUY / SELL call-to-action text is UPPERCASE bold (see `textStyles.action`).
 *
 * Read order:
 *   1. tokens     — the flat token map
 *   2. color()    — typed accessor
 *   3. textStyles — pre-composed typography presets
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import type { TextStyle } from 'react-native';

/**
 * Obsidian palette mirrored from libs/obsidian-ui/src/tokens/semantic-tokens.json.
 * Keys are stable identifiers so component code never references hex literals.
 */
export const tokens = {
  bg: {
    base: '#06080A',
    surface: '#0C0E12',
    panel: '#0F1216',
    elevated: '#141820',
    hover: '#1A1F28',
    active: '#1E2530',
  },
  border: {
    default: '#1C2028',
    mid: '#252C38',
    high: '#2E3847',
  },
  fg: {
    primary: '#E2E8F0',
    secondary: '#8B95A3',
    muted: '#4A5568',
    disabled: '#2D3748',
  },
  sem: {
    bull: '#10D996',
    bear: '#FF3B5C',
    accent: '#3B82F6',
    warn: '#F59E0B',
    purple: '#A855F7',
    gold: '#EAB308',
  },
  radii: {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
  },
  space: {
    '1': 4,
    '2': 8,
    '3': 12,
    '4': 16,
    '5': 20,
    '6': 24,
    '8': 32,
    '10': 40,
  },
} as const;

export type TokenColorKey =
  | keyof typeof tokens.bg
  | keyof typeof tokens.border
  | keyof typeof tokens.fg
  | keyof typeof tokens.sem;

/**
 * Typed accessor — `color('bull')` returns the bull hex.
 * Throws in dev if the key is missing so a typo is caught at first render.
 */
export function color(key: TokenColorKey): string {
  const value =
    (tokens.bg as Record<string, string>)[key] ??
    (tokens.border as Record<string, string>)[key] ??
    (tokens.fg as Record<string, string>)[key] ??
    (tokens.sem as Record<string, string>)[key];
  if (value === undefined) {
    throw new Error(`[obsidian-tokens] unknown token key: ${String(key)}`);
  }
  return value;
}

/**
 * Font family. The Obsidian web app uses Syne / DM Sans / IBM Plex Mono
 * injected by next/font. React Native does not have first-class web font
 * fallbacks in our setup, so we rely on system equivalents that match
 * the visual rhythm: display and ui fall back to the platform sans-serif,
 * data falls back to the platform monospace.
 *
 * If/when we add custom fonts via expo-font, replace the family strings
 * here and the rest of the app picks them up.
 */
export const fontFamilyDisplay = 'System';
export const fontFamilyUi = 'System';
export const fontFamilyMono = 'Menlo';

export function fontFamily(role: 'display' | 'ui' | 'data'): string {
  if (role === 'display') return fontFamilyDisplay;
  if (role === 'data') return fontFamilyMono;
  return fontFamilyUi;
}

/**
 * Easing and durations — mirrors the CSS `cubic-bezier(0.4, 0, 0.2, 1)`
 * custom curve and the 120/180/300ms triplet from semantic-tokens.json.
 * Reanimated's `Easing.bezier(...)` factory is the closest native equivalent.
 */
export const motion = {
  durFast: 120,
  dur: 180,
  durSlow: 300,
  // Approximation of cubic-bezier(0.4, 0, 0.2, 1)
  ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * Composed typography presets — these embody the design rules from
 * CLAUDE.md §12 (panel titles ALL CAPS in display font, numbers in mono,
 * BUY/SELL UPPERCASE bold).
 *
 * Components SHOULD pull from these rather than constructing `TextStyle`
 * objects inline.
 */
export const textStyles = {
  // Section / panel title — ALL CAPS, display font, 0.08em tracking.
  // Per CLAUDE.md §12: never sentence-case a panel title.
  sectionTitle: {
    fontFamily: fontFamilyDisplay,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8, // 0.08em at 10pt-ish visual scale
    textTransform: 'uppercase',
    color: tokens.fg.secondary,
  } satisfies TextStyle,
  // Body text — UI font, primary foreground.
  body: {
    fontFamily: fontFamilyUi,
    fontSize: 14,
    fontWeight: '400',
    color: tokens.fg.primary,
  } satisfies TextStyle,
  // Body secondary — UI font, muted foreground.
  bodyMuted: {
    fontFamily: fontFamilyUi,
    fontSize: 13,
    fontWeight: '400',
    color: tokens.fg.secondary,
  } satisfies TextStyle,
  // Numeric / data — monospace + tabular figures for prices and quantities.
  // Apply this to ANY number, price, or timestamp. Per CLAUDE.md §12.
  monoNumber: {
    fontFamily: fontFamilyMono,
    fontSize: 14,
    fontWeight: '500',
    color: tokens.fg.primary,
    // RN does not have a `tabular-nums` shorthand — `Menlo` is monospaced
    // by default and renders as a tabular grid on iOS and Android.
  } satisfies TextStyle,
  // Mono number — large (price tickers, account equity).
  monoNumberLarge: {
    fontFamily: fontFamilyMono,
    fontSize: 22,
    fontWeight: '600',
    color: tokens.fg.primary,
  } satisfies TextStyle,
  // BUY / SELL action label — UPPERCASE bold per CLAUDE.md §12.
  action: {
    fontFamily: fontFamilyDisplay,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: tokens.fg.primary,
  } satisfies TextStyle,
} as const;
