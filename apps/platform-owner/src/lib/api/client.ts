/**
 * File:        apps/platform-owner/src/lib/api/client.ts
 * Module:      platform-owner · API Client
 * Purpose:     Typed fetch wrapper with timeout, retry, and auth header injection.
 *              Always sends x-tenant-id: 'platform' since PO is always the platform tenant.
 *
 * Exports:
 *   - apiRequest<T>(path, init?) → Promise<T>  — base request helper with timeout + retry
 *   - apiRequestNoRetry<T>(path, init?)        — single-shot request without retry
 *   - ApiError                              — typed error with code + requestId + status
 *
 * Depends on:
 *   - sessionStorage (browser) — for access token retrieval
 *
 * Side-effects:
 *   - Browser sessionStorage reads (token retrieval)
 *   - AbortController for timeout enforcement
 *
 * Key invariants:
 *   - Base URL: /api (Next.js rewrite proxies to http://localhost:3000 in dev)
 *   - x-tenant-id is always 'platform' — PO app never crosses tenant contexts.
 *   - Throws ApiError on non-2xx responses; caller handles display logic.
 *   - Retry fires on 5xx only — 4xx are client errors and must not retry.
 *   - Timeout defaults to 10s; caller can override via signal or timeoutMs option.
 *
 * Read order:
 *   1. ApiError — error shape
 *   2. apiRequest — main entry point (timeout + retry)
 *   3. apiRequestNoRetry — simple wrapper without retry
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-14
 */

export class ApiError extends Error {
  readonly code: string;
  readonly requestId?: string;
  readonly status: number;

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.requestId = requestId;
    this.status = status;
  }
}

/** Retry configuration — applied per-request or via global default */
interface RetryConfig {
  attempts: number;         // max retry attempts (default 3)
  initialDelayMs: number;    // first delay in ms (default 1000)
  maxDelayMs: number;        // cap on backoff delay (default 8000)
}

/** Request configuration extending standard RequestInit */
interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;        // request timeout in ms (default 10000)
  retry?: Partial<RetryConfig>; // retry options (default { attempts: 3, initialDelayMs: 1000, maxDelayMs: 8000 })
}

const DEFAULT_RETRY: RetryConfig = {
  attempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
};

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Core request helper with AbortController timeout and exponential backoff retry.
 * Retries on 5xx responses only; does not retry 4xx client errors.
 */
export async function apiRequest<T = unknown>(
  path: string,
  init: ApiRequestOptions = {},
): Promise<T> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('po_access_token') : null;
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retry = { ...DEFAULT_RETRY, ...init.retry };
  delete init.timeoutMs;
  delete init.retry;

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-tenant-id': 'platform',
    ...(init.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }

  let lastError: Error = new Error('Request never attempted');

  for (let attempt = 0; attempt < retry.attempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`/api${path}`, {
        ...init,
        credentials: 'include',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        if (res.status === 204) return undefined as T;
        return res.json() as Promise<T>;
      }

      // 4xx: client error — do not retry, throw immediately
      if (res.status >= 400 && res.status < 500) {
        let body: Record<string, unknown> = {};
        try { body = await res.json(); } catch { /* empty body */ }
        throw new ApiError(
          res.status,
          typeof body['code'] === 'string' ? body['code'] : 'UNKNOWN_ERROR',
          typeof body['message'] === 'string' ? body['message'] : res.statusText,
          typeof body['requestId'] === 'string' ? body['requestId'] : undefined,
        );
      }

      // 5xx: server error — retry with backoff (unless last attempt)
      if (attempt < retry.attempts - 1) {
        const delay = Math.min(retry.initialDelayMs * Math.pow(2, attempt), retry.maxDelayMs);
        await sleep(delay);
        continue;
      }

      // Last attempt failed — throw
      let body: Record<string, unknown> = {};
      try { body = await res.json(); } catch { /* empty body */ }
      throw new ApiError(
        res.status,
        typeof body['code'] === 'string' ? body['code'] : 'SERVER_ERROR',
        typeof body['message'] === 'string' ? body['message'] : res.statusText,
        typeof body['requestId'] === 'string' ? body['requestId'] : undefined,
      );

    } catch (err) {
      clearTimeout(timeout);

      // AbortError means timeout — retry unless exhausted
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (attempt < retry.attempts - 1) {
          const delay = Math.min(retry.initialDelayMs * Math.pow(2, attempt), retry.maxDelayMs);
          await sleep(delay);
          lastError = new ApiError(408, 'REQUEST_TIMEOUT', `Request timed out after ${timeoutMs}ms`);
          continue;
        }
        throw new ApiError(408, 'REQUEST_TIMEOUT', `Request timed out after ${timeoutMs}ms`);
      }

      // Network error (no response) — retry unless exhausted
      if (err instanceof TypeError && err.message.includes('fetch')) {
        if (attempt < retry.attempts - 1) {
          const delay = Math.min(retry.initialDelayMs * Math.pow(2, attempt), retry.maxDelayMs);
          await sleep(delay);
          lastError = new ApiError(0, 'NETWORK_ERROR', err.message);
          continue;
        }
        throw new ApiError(0, 'NETWORK_ERROR', err.message);
      }

      // Re-throw ApiError as-is
      if (err instanceof ApiError) throw err;

      // Unexpected error — don't retry, throw as ApiError
      throw new ApiError(500, 'UNEXPECTED_ERROR', err instanceof Error ? err.message : String(err));
    }
  }

  // Should not reach here, but safety fallback
  throw lastError;
}

/**
 * Single-shot request without retry. Useful for one-time mutations where
 * the caller handles errors explicitly.
 */
export async function apiRequestNoRetry<T = unknown>(
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`/api${path}`, {
      ...init,
      credentials: 'include',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      let body: Record<string, unknown> = {};
      try { body = await res.json(); } catch { /* empty body */ }
      throw new ApiError(
        res.status,
        typeof body['code'] === 'string' ? body['code'] : 'UNKNOWN_ERROR',
        typeof body['message'] === 'string' ? body['message'] : res.statusText,
        typeof body['requestId'] === 'string' ? body['requestId'] : undefined,
      );
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(408, 'REQUEST_TIMEOUT', `Request timed out after ${DEFAULT_TIMEOUT_MS}ms`);
    }
    throw err;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
