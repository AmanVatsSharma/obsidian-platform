/**
 * File:        libs/obsidian-ui/src/react/theme/obsidian-context.tsx
 * Module:      obsidian-ui · Theme
 * Purpose:     React context that owns colour theme, density, and accent — with
 *              localStorage persistence and DOM mirroring (data-attrs + CSS vars).
 *
 * Exports:
 *   - useObsidian() → ObsidianContextValue        — hook to read/set theme, density, accent
 *   - ObsidianProvider                            — wraps app; reads localStorage on mount,
 *                                                   writes on change, paints <html> attributes
 *                                                   and accent CSS variables
 *   - ObsidianProviderProps                       — prop types for ObsidianProvider
 *
 * Depends on:
 *   - @radix-ui/react-tooltip — global TooltipProvider (avoids per-component wrapping)
 *
 * Side-effects:
 *   - Reads/writes three localStorage keys: 'obsidian-theme', 'obsidian-density', 'obsidian-accent'
 *   - Sets document.documentElement.dataset.theme / .dataset.density on every change
 *   - Sets document.documentElement.style for --accent / --accent-dim / --accent-glow
 *   - Adds .obsidian-root class to <html>
 *   - Listens to prefers-color-scheme media query when theme === 'system'
 *
 * Key invariants:
 *   - SSR safe: initial resolvedTheme defaults to 'dark' on server; useLayoutEffect corrects
 *     to stored/system value before first paint.
 *   - localStorage is only accessed client-side (typeof window guards every access).
 *   - Saved values take priority over the corresponding default*Theme/Density/Accent prop
 *     on hydration.
 *   - Accent CSS variables are inline-style on <html>, which beats the :root sheet rule by
 *     specificity, so the active accent persists even if Tailwind/CSS layers are reordered.
 *   - Light-mode accent palette uses deeper hex (WCAG AA on white); dark-mode uses brighter.
 *
 * Read order:
 *   1. ACCENT_HEX_DARK / ACCENT_HEX_LIGHT  — palette source of truth
 *   2. resolveAccentHex / withAlpha        — palette → CSS-var conversion
 *   3. ObsidianProvider                    — state, effects, applyToDocument
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as Tooltip from '@radix-ui/react-tooltip';
import * as React from 'react';

import type {
  ObsidianAccent,
  ObsidianContextValue,
  ObsidianDensity,
  ObsidianThemeMode,
} from './types';

const STORAGE_KEY_THEME = 'obsidian-theme';
const STORAGE_KEY_DENSITY = 'obsidian-density';
const STORAGE_KEY_ACCENT = 'obsidian-accent';

const VALID_MODES: ReadonlySet<ObsidianThemeMode> = new Set(['light', 'dark', 'system']);
const VALID_DENSITIES: ReadonlySet<ObsidianDensity> = new Set(['compact', 'regular', 'comfortable']);
const VALID_ACCENTS: ReadonlySet<ObsidianAccent> = new Set(['blue', 'mint', 'violet', 'amber']);

const ACCENT_HEX_DARK: Record<ObsidianAccent, string> = {
  blue: '#3B82F6',
  mint: '#10D996',
  violet: '#A855F7',
  amber: '#F59E0B',
};
const ACCENT_HEX_LIGHT: Record<ObsidianAccent, string> = {
  blue: '#2563EB',
  mint: '#058E65',
  violet: '#7C3AED',
  amber: '#B45309',
};

function resolveAccentHex(accent: ObsidianAccent, resolved: 'light' | 'dark'): string {
  return (resolved === 'light' ? ACCENT_HEX_LIGHT : ACCENT_HEX_DARK)[accent];
}

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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
  /** Initial colour theme; `system` follows `prefers-color-scheme`. Default `system`. */
  defaultTheme?: ObsidianThemeMode;
  /** Vertical rhythm density. Default `regular`. */
  defaultDensity?: ObsidianDensity;
  /** Brand accent colour. Default `blue`. */
  defaultAccent?: ObsidianAccent;
};

function readStored<T extends string>(
  key: string,
  valid: ReadonlySet<T>,
  fallback: T,
): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved && valid.has(saved as T) ? (saved as T) : fallback;
  } catch {
    return fallback;
  }
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
  defaultDensity = 'regular',
  defaultAccent = 'blue',
}: ObsidianProviderProps) {
  const [theme, setThemeState] = React.useState<ObsidianThemeMode>(defaultTheme);
  const [density, setDensityState] = React.useState<ObsidianDensity>(defaultDensity);
  const [accent, setAccentState] = React.useState<ObsidianAccent>(defaultAccent);
  // SSR-safe default: 'dark' on server; useLayoutEffect corrects before first paint.
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>('dark');

  const applyToDocument = React.useCallback(
    (resolved: 'light' | 'dark', d: ObsidianDensity, a: ObsidianAccent) => {
      if (typeof document === 'undefined') return;
      const root = document.documentElement;
      root.dataset.theme = resolved;
      root.dataset.density = d;
      root.classList.add('obsidian-root');
      const hex = resolveAccentHex(a, resolved);
      root.style.setProperty('--accent', hex);
      root.style.setProperty('--accent-dim', withAlpha(hex, 0.10));
      root.style.setProperty('--accent-glow', withAlpha(hex, 0.20));
    },
    [],
  );

  // On mount: hydrate from localStorage and paint before first browser paint.
  React.useLayoutEffect(() => {
    const storedTheme = readStored<ObsidianThemeMode>(STORAGE_KEY_THEME, VALID_MODES, defaultTheme);
    const storedDensity = readStored<ObsidianDensity>(
      STORAGE_KEY_DENSITY,
      VALID_DENSITIES,
      defaultDensity,
    );
    const storedAccent = readStored<ObsidianAccent>(
      STORAGE_KEY_ACCENT,
      VALID_ACCENTS,
      defaultAccent,
    );
    setThemeState(storedTheme);
    setDensityState(storedDensity);
    setAccentState(storedAccent);
    const resolved = resolveTheme(storedTheme);
    setResolvedTheme(resolved);
    applyToDocument(resolved, storedDensity, storedAccent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useLayoutEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyToDocument(resolved, density, accent);
  }, [theme, density, accent, applyToDocument]);

  React.useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const r = resolveTheme('system');
      setResolvedTheme(r);
      applyToDocument(r, density, accent);
    };
    mq.addEventListener('change', onChange);
    onChange();
    return () => mq.removeEventListener('change', onChange);
  }, [theme, density, accent, applyToDocument]);

  const setTheme = React.useCallback((mode: ObsidianThemeMode) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_THEME, mode);
      } catch {
        // Storage unavailable (private mode, quota) — fall through; in-memory still works.
      }
    }
    setThemeState(mode);
  }, []);

  const setDensity = React.useCallback((d: ObsidianDensity) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_DENSITY, d);
      } catch {
        // see setTheme
      }
    }
    setDensityState(d);
  }, []);

  const setAccent = React.useCallback((a: ObsidianAccent) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_ACCENT, a);
      } catch {
        // see setTheme
      }
    }
    setAccentState(a);
  }, []);

  const value = React.useMemo<ObsidianContextValue>(
    () => ({ theme, resolvedTheme, density, accent, setTheme, setDensity, setAccent }),
    [theme, resolvedTheme, density, accent, setTheme, setDensity, setAccent],
  );

  return (
    <ObsidianReactContext.Provider value={value}>
      <Tooltip.Provider delayDuration={280} skipDelayDuration={120}>
        {children}
      </Tooltip.Provider>
    </ObsidianReactContext.Provider>
  );
}
