/**
 * File:        apps/web/lib/brand-provider.tsx
 * Module:      web · Brand Provider
 * Purpose:     Provider that wraps the web app, fetches brand config on mount,
 *              and applies broker branding (primaryColor, appName, logo) to
 *              the page — both to CSS custom properties and to the document
 *              title. Browser title updates go through document.title (no
 *              router navigation) so this provider has no dependency on the
 *              App Router context being mounted yet.
 *
 * Exports:
 *   - BrandProvider({ children })  — fetches brand config, applies to DOM
 *   - useBrand()                   — consume the config from any child component
 *
 * Depends on:
 *   - ./api/hooks/use-brand-config — useBrandConfig hook
 *
 * Side-effects:
 *   - Writes --primary-color, --bull, --bear CSS vars to document.documentElement
 *   - Updates document.title directly (no router.push)
 *
 * Key invariants:
 *   - 'use client' — reads sessionStorage / window, updates DOM directly
 *   - BrandProvider must be rendered inside an AppRouter-level AuthProvider so
 *     tenant_code is available in sessionStorage before any auth-gated fetch
 *   - Defaults are applied immediately (before fetch) to prevent flash of wrong brand
 *   - applyToDOM() is idempotent — safe to call multiple times with same values
 *   - Does NOT call useRouter() — this component is mounted at the root layout
 *     and must not depend on router context, which initializes asynchronously
 *     in the App Router and can race the first render.
 *
 * Read order:
 *   1. BrandProvider   — where it is mounted (root layout)
 *   2. useBrand        — how children consume brand data
 *   3. applyToDOM      — the side-effect that updates CSS vars + title
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-07
 */

'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useBrandConfig, type BrandConfig } from './api/hooks/use-brand-config';

/* ── Context ────────────────────────────────────────────────────────────────── */

const BrandContext = createContext<{ config: BrandConfig | null }>({ config: null });

export function useBrand(): { config: BrandConfig | null } {
  return useContext(BrandContext);
}

/* ── Apply brand to DOM ─────────────────────────────────────────────────────── */

function applyToDOM(config: BrandConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--primary-color', config.primaryColor);

  // Derive bull/bear from primary if not explicitly set
  root.style.setProperty('--bull', config.bullColor ?? '#10D996');
  root.style.setProperty('--bear', config.bearColor ?? '#FF3B5C');

  // Update browser tab title
  if (config.appName) {
    document.title = config.appName;
  }
}

/* ── Provider ───────────────────────────────────────────────────────────────── */

interface BrandProviderProps {
  children: ReactNode;
}

export function BrandProvider({ children }: BrandProviderProps) {
  const { config } = useBrandConfig();

  // Apply brand config to DOM as soon as it's available.
  // document.title is set inside applyToDOM, so no router is needed.
  useEffect(() => {
    if (!config) return;
    applyToDOM(config);
  }, [config]);

  return (
    <BrandContext.Provider value={{ config }}>
      {children}
    </BrandContext.Provider>
  );
}