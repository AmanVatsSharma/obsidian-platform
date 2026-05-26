/**
 * File:        apps/web/lib/api/client.ts
 * Module:      web · API Client
 * Purpose:     Thin fetch wrapper for the Obsidian backend. Reads auth token
 *              from sessionStorage, attaches Authorization + x-tenant-id headers.
 *              The tenant code is resolved from the subdomain via TenantContext.
 *
 * Exports:
 *   - ApiError                      — typed error with code, requestId, status
 *   - apiRequest<T>(path, init)     — fetch with JSON serialization
 *
 * Depends on:
 *   - next.config.js rewrites       — proxies /api/:path* → localhost:3000/:path*
 *
 * Side-effects:
 *   - Reads 'access_token' and 'tenant_code' from sessionStorage
 *
 * Key invariants:
 *   - path must NOT include /api prefix — it is added internally
 *   - sessionStorage guarded by typeof window check (SSR-safe)
 *   - x-tenant-id carries the slug (not UUID) to match TenantGuard expectations
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-19
 */

export class ApiError extends Error {
  constructor(
    public override readonly message: string,
    public readonly code: string,
    public readonly requestId?: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
  const tenantCode =
    typeof window !== 'undefined' ? sessionStorage.getItem('tenant_code') : null;

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };

  if (token) headers['authorization'] = `Bearer ${token}`;
  if (tenantCode) headers['x-tenant-id'] = tenantCode;

  const res = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    let code = 'UNKNOWN_ERROR';
    let message = `HTTP ${res.status}`;
    let requestId: string | undefined;
    try {
      const body = await res.json();
      code = body.code ?? code;
      message = body.message ?? message;
      requestId = body.requestId;
    } catch {
      // non-JSON body — use defaults
    }
    throw new ApiError(message, code, requestId, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}