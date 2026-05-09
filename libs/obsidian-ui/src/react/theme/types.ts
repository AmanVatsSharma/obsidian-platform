/**
 * @file types.ts
 * @module obsidian-ui
 * @description Theme / density types for ObsidianProvider
 * @author BharatERP
 * @created 2026-04-03
 */

export type ObsidianThemeMode = 'light' | 'dark' | 'system';

export type ObsidianDensity = 'comfortable' | 'compact';

export type ObsidianContextValue = {
  theme: ObsidianThemeMode;
  resolvedTheme: 'light' | 'dark';
  density: ObsidianDensity;
  setTheme: (mode: ObsidianThemeMode) => void;
  setDensity: (d: ObsidianDensity) => void;
};
