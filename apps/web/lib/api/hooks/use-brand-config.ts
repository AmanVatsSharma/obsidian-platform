/**
 * File:        apps/web/lib/api/hooks/use-brand-config.ts
 * Module:      web · Brand Config API Hook
 * Purpose:     Fetches the broker's white-label brand config on mount (appName,
 *              primaryColor, logoUrl, tagline, etc.) from GET /tenancy/brand-config.
 *              Returns a BrandConfig object or null while loading.
 *
 * Exports:
 *   - BrandConfig       — shape returned by the backend
 *   - useBrandConfig() — { config, isLoading, error }
 *
 * Depends on:
 *   - ../client — apiRequest (GET /tenancy/brand-config?slug=...)
 *
 * Side-effects:
 *   - Calls GET /tenancy/brand-config?slug=<tenantCode> on mount
 *
 * Key invariants:
 *   - 'use client' — only uses browser APIs via apiRequest
 *   - slug is derived from the subdomain via resolveTenantFromHostname()
 *   - config is null until API responds; callers should show brand defaults
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-19
 */

import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../client';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export interface BrandConfig {
  appName: string;
  tagline: string;
  primaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  supportEmail: string;
  supportPhone: string;
  customDomain: string;
  bullColor?: string;
  bearColor?: string;
  features?: Record<string, boolean>;
}

export interface UseBrandConfigResult {
  config: BrandConfig | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const DEFAULTS: BrandConfig = {
  appName: 'Obsidian Trading',
  tagline: 'Professional FX & CFD Trading',
  primaryColor: '#3B82F6',
  logoUrl: '',
  faviconUrl: '',
  supportEmail: '',
  supportPhone: '',
  customDomain: '',
  bullColor: '#10D996',
  bearColor: '#FF3B5C',
};

/* ── Tenant resolution ──────────────────────────────────────────────────────── */

/** Extracts the tenant code from the current hostname's subdomain.
 *  "acme-brokers.localhost" → "acme-brokers"
 *  "acme.obsidian.io"      → "acme"
 *  Falls back to NEXT_PUBLIC_DEFAULT_TENANT env var. */
export function resolveTenantFromHostname(): string {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  // subdomain.localhost | subdomain.obsidian.io → parts[0]
  if (parts.length >= 2 && parts[0] !== 'www') {
    return parts[0];
  }
  return process.env.NEXT_PUBLIC_DEFAULT_TENANT ?? '';
}

/* ── Hook ──────────────────────────────────────────────────────────────────── */

export function useBrandConfig(): UseBrandConfigResult {
  const [config, setConfig] = useState<BrandConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    const tenantCode = resolveTenantFromHostname();
    if (!tenantCode) {
      setConfig(DEFAULTS);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiRequest<BrandConfig | null>(`/tenancy/brand-config?slug=${encodeURIComponent(tenantCode)}`)
      .then(data => {
        if (cancelled) return;
        setConfig(data && Object.keys(data).length > 0
          ? { ...DEFAULTS, ...data }
          : DEFAULTS);
      })
      .catch(() => {
        if (!cancelled) setConfig(DEFAULTS);
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [tick]);

  return { config, isLoading, error, refetch };
}