/**
 * File:        apps/platform-owner/src/lib/api/client.ts
 * Module:      platform-owner · API Client
 * Purpose:     Typed fetch wrapper that attaches auth headers and normalises error responses.
 *              Always sends x-tenant-id: 'platform' since PO is always the platform tenant.
 *
 * Exports:
 *   - apiRequest<T>(path, init?) → Promise<T>  — base request helper
 *   - ApiError                                  — typed error with code + requestId
 *
 * Depends on:
 *   - sessionStorage (browser) — for access token retrieval
 *
 * Side-effects:
 *   - Browser sessionStorage reads (token retrieval)
 *
 * Key invariants:
 *   - Base URL: /api (Next.js rewrite proxies to http://localhost:3000 in dev)
 *   - x-tenant-id is always 'platform' — PO app never crosses tenant contexts.
 *   - Throws ApiError on non-2xx responses; caller handles display logic.
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

export class ApiError extends Error {
  readonly code: string;
  readonly requestId?: string;
  readonly status: number;

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message);
    this.code = code;
    this.requestId = requestId;
    this.status = status;
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('po_access_token') : null;

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-tenant-id': 'platform',
    ...(init.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json(); } catch { /* empty body */ }
    throw new ApiError(
      res.status,
      String(body['code'] ?? 'UNKNOWN_ERROR'),
      String(body['message'] ?? res.statusText),
      body['requestId'] as string | undefined,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
