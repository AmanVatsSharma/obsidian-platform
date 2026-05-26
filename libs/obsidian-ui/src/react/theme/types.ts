/**
 * File:        libs/obsidian-ui/src/react/theme/types.ts
 * Module:      obsidian-ui · Theme
 * Purpose:     Type contracts for the Obsidian theme system: colour mode, density, and accent.
 *
 * Exports:
 *   - ObsidianThemeMode    — 'light' | 'dark' | 'system'
 *   - ObsidianDensity      — 'compact' | 'regular' | 'comfortable'
 *   - ObsidianAccent       — 'blue' | 'mint' | 'violet' | 'amber'
 *   - ObsidianContextValue — full shape consumed via useObsidian()
 *
 * Depends on:
 *   - none (type-only file)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - 'regular' is the default density for product surfaces (e.g. the Account Console).
 *     'comfortable' (the legacy default) is preserved so existing consumers that pass
 *     defaultDensity="comfortable" continue to work.
 *   - Accent values map to a fixed 4-colour palette that ObsidianProvider applies as
 *     CSS custom properties (--accent / --accent-dim / --accent-glow) on <html>.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

export type ObsidianThemeMode = 'light' | 'dark' | 'system';

export type ObsidianDensity = 'compact' | 'regular' | 'comfortable';

export type ObsidianAccent = 'blue' | 'mint' | 'violet' | 'amber';

export type ObsidianContextValue = {
  theme: ObsidianThemeMode;
  resolvedTheme: 'light' | 'dark';
  density: ObsidianDensity;
  accent: ObsidianAccent;
  setTheme: (mode: ObsidianThemeMode) => void;
  setDensity: (d: ObsidianDensity) => void;
  setAccent: (a: ObsidianAccent) => void;
};
