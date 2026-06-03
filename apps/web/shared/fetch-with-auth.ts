/**
 * File:        apps/web/shared/fetch-with-auth.ts
 * Module:      web · Shared
 * Purpose:     Auth-aware fetch wrapper for REST calls from the trading terminal.
 *              Reads the access_token httpOnly cookie and injects it as a Bearer header.
 *              Also injects CSRF token and tenant ID for all requests.
 *
 * Exports:
 *   - fetchWithAuth(path, init?) → Promise<unknown>   — wraps native fetch with auth headers
 *
 * Depends on:
 *   - @/gql/client/cookie  — getCookie (SSR-safe cookie reader used by auth-link)
 *
 * Side-effects:
 *   - Reads httpOnly cookies from document.cookie
 *   - Makes HTTP requests to the NestJS backend
 *
 * Key invariants:
 *   - Works outside React hooks (inside useEffect, setInterval, etc.) because it reads cookies, not React state
 *   - Throws on non-2xx responses so callers can use try/catch
 *   - Does NOT follow redirects — non-2xx throws immediately
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-01
 */

import { getCookie } from '@/gql/client/cookie';

const CSRF_HEADER = (process.env.NEXT_PUBLIC_CSRF_HEADER_NAME || 'x-csrf-token').toLowerCase();
const CSRF_COOKIE = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME || 'csrf';
const TENANT_HEADER = 'x-tenant-id';
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'acme';

/**
 * Wraps the native fetch with auth headers injected from httpOnly cookies.
 * Safe to call inside useEffect, setInterval, or any async callback.
 */
export function fetchWithAuth(path: string, init?: RequestInit): Promise<unknown> {
  const csrf = getCookie(CSRF_COOKIE) ?? '';
  const token = getCookie('access_token') ?? '';

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    [CSRF_HEADER]: csrf,
    [TENANT_HEADER]: TENANT_ID,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> ?? {}),
  };

  return fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  }).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`);
    return res.json();
  });
}
