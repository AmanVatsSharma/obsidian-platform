/**
 * File:        libs/obsidian-ui/src/react/theme/obsidian-context.tsx
 * Module:      obsidian-ui · Theme
 * Purpose:     React context for Obsidian theme / density with localStorage persistence
 *
 * Exports:
 *   - useObsidian() → ObsidianContextValue   — hook to read and set theme/density
 *   - ObsidianProvider                        — wraps app; reads localStorage on init, writes on change
 *   - ObsidianProviderProps                   — prop types for ObsidianProvider
 *
 * Depends on:
 *   - @radix-ui/react-tooltip — global TooltipProvider (avoids per-component wrapping)
 *
 * Side-effects:
 *   - Reads/writes localStorage key 'obsidian-theme' for persistence across sessions
 *   - Sets document.documentElement.dataset.theme and .dataset.density on every theme/density change
 *   - Listens to prefers-color-scheme media query when theme === 'system'
 *
 * Key invariants:
 *   - SSR safe: initial resolvedTheme defaults to 'dark' on server; useLayoutEffect corrects before paint
 *   - localStorage is only accessed client-side (typeof window checks guard all access)
 *   - Saved localStorage value ('light'|'dark'|'system') takes priority over defaultTheme prop on hydration
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-25
 */

'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import * as React from 'react';

import type { ObsidianContextValue, ObsidianDensity, ObsidianThemeMode } from './types';

const STORAGE_KEY = 'obsidian-theme';
const VALID_MODES = new Set<ObsidianThemeMode>(['light', 'dark', 'system']);

const ObsidianReactContext = React.createContext<ObsidianContextValue | null>(null);

export function useObsidian(): ObsidianContextValue {
  const ctx = React.useContext(ObsidianReactContext);
  if (!ctx) {
    throw new Error('useObsidian must be used within ObsidianProvider');
  }
  return ctx;
}

export type ObsidianProviderProps = {
  children: React.ReactNode;
  /** Initial color theme; `system` follows `prefers-color-scheme`. Default `system`. */
  defaultTheme?: ObsidianThemeMode;
  /** Vertical rhythm; `compact` tightens `--obs-space-unit`. Default `comfortable`. */
  defaultDensity?: ObsidianDensity;
};

function readStoredTheme(fallback: ObsidianThemeMode): ObsidianThemeMode {
  if (typeof window === 'undefined') return fallback;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved && VALID_MODES.has(saved as ObsidianThemeMode)
    ? (saved as ObsidianThemeMode)
    : fallback;
}

function resolveTheme(mode: ObsidianThemeMode): 'light' | 'dark' {
  if (mode === 'system' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode === 'dark' ? 'dark' : 'light';
}

export function ObsidianProvider({
  children,
  defaultTheme = 'system',
  defaultDensity = 'comfortable',
}: ObsidianProviderProps) {
  const [theme, setThemeState] = React.useState<ObsidianThemeMode>(defaultTheme);
  const [density, setDensityState] = React.useState<ObsidianDensity>(defaultDensity);
  // SSR-safe default: 'dark' on server; useLayoutEffect corrects to stored/system value before first paint
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>('dark');

  const applyToDocument = React.useCallback((resolved: 'light' | 'dark', d: ObsidianDensity) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = resolved;
    root.dataset.density = d;
    root.classList.add('obsidian-root');
  }, []);

  // On mount: read localStorage, override defaultTheme prop if a saved value exists
  React.useLayoutEffect(() => {
    const stored = readStoredTheme(defaultTheme);
    setThemeState(stored);
    const resolved = resolveTheme(stored);
    setResolvedTheme(resolved);
    applyToDocument(resolved, density);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useLayoutEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyToDocument(resolved, density);
  }, [theme, density, applyToDocument]);

  React.useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const r = resolveTheme('system');
      setResolvedTheme(r);
      applyToDocument(r, density);
    };
    mq.addEventListener('change', onChange);
    onChange();
    return () => mq.removeEventListener('change', onChange);
  }, [theme, density, applyToDocument]);

  const setTheme = React.useCallback((mode: ObsidianThemeMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
    setThemeState(mode);
  }, []);

  const setDensity = React.useCallback((d: ObsidianDensity) => {
    setDensityState(d);
  }, []);

  const value = React.useMemo<ObsidianContextValue>(
    () => ({ theme, resolvedTheme, density, setTheme, setDensity }),
    [theme, resolvedTheme, density, setTheme, setDensity],
  );

  return (
    <ObsidianReactContext.Provider value={value}>
      <Tooltip.Provider delayDuration={280} skipDelayDuration={120}>
        {children}
      </Tooltip.Provider>
    </ObsidianReactContext.Provider>
  );
}
