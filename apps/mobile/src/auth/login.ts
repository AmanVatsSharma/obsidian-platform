/**
 * File:        apps/mobile/src/auth/login.ts
 * Module:      mobile · Auth
 * Purpose:     Login API — wraps the NestJS `/auth/otp/request` and
 *              `/auth/otp/verify` endpoints. The dev-only `/auth/dev/login`
 *              path is also exposed so the mobile app can self-bootstrap
 *              against the same dev fixtures the trader terminal uses.
 *
 * Exports:
 *   - requestOtp(args)             → Promise<RequestOtpResponse>
 *   - verifyOtp(args)              → Promise<VerifyOtpResponse>
 *   - devLogin(args)               → Promise<DevLoginResponse>     (dev only)
 *   - loginErrorToMessage(err)     → string      — translate API errors
 *
 * Depends on:
 *   - @obsidian/mobile-api-client  — ApiConfig.baseUrl
 *   - ../../lib/logger             — warn-on-error
 *   - ../../lib/errors             — AppError-shaped errors
 *
 * Side-effects:
 *   - Network I/O to the backend OTP / dev-login endpoints.
 *
 * Key invariants:
 *   - `baseUrl` MUST be the configured `EXPO_PUBLIC_API_BASE` (or a
 *     localhost fallback in dev). All URLs are joined with a single
 *     forward slash to avoid `https://api//auth/...` double-slash bugs.
 *   - Errors are translated into `AppError` so the rest of the app has
 *     one error shape to handle. Per CLAUDE.md §15: never throw raw
 *     `Error` / `HttpException`.
 *   - The dev-login path is gated on `__DEV__` so it cannot ship to
 *     production builds. The backend additionally refuses it when
 *     `NODE_ENV=production` (defence in depth).
 *   - Responses are parsed as JSON; non-2xx responses throw an
 *     `AppError` with the status and the server's `{ code, message }`
 *     envelope.
 *
 * Read order:
 *   1. LoginError          — error types
 *   2. requestOtp          — request OTP
 *   3. verifyOtp           — verify OTP
 *   4. devLogin            — dev-only direct login
 *   5. loginErrorToMessage — UI translation
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import type { ApiConfig } from '@obsidian/mobile-api-client';
import { logWarn } from '../lib/logger';
import { AppError } from '../lib/errors';

export type RequestOtpArgs = {
  tenantId: string;
  mobileE164: string;
};

export type RequestOtpResponse = {
  success: boolean;
};

export type VerifyOtpArgs = {
  tenantId: string;
  mobileE164: string;
  otp: string;
};

export type VerifyOtpResponse = {
  accessToken: string;
  refreshToken: string;
  tokenId: string;
  userId: string;
};

export type DevLoginArgs = {
  tenantId: string;
  mobileE164: string;
  password?: string;
};

export type DevLoginResponse = VerifyOtpResponse;

function resolveBaseUrl(api: ApiConfig): string {
  // `EXPO_PUBLIC_*` env vars are statically substituted at bundle time.
  const envBase = process.env['EXPO_PUBLIC_API_BASE'];
  return envBase && envBase.length > 0 ? envBase : api.baseUrl;
}

async function postJson<TResponse>(
  baseUrl: string,
  path: string,
  body: unknown,
): Promise<TResponse> {
  const url = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    logWarn('[auth] network error', { url, cause });
    throw new AppError('AUTH_NETWORK_ERROR', 'Could not reach the auth server', {
      cause: String(cause),
    });
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!res.ok) {
    const envelope = (parsed ?? {}) as { code?: string; message?: string };
    throw new AppError(
      envelope.code ?? `HTTP_${res.status}`,
      envelope.message ?? `Auth request failed (${res.status})`,
      { status: res.status, path },
    );
  }

  return (parsed ?? {}) as TResponse;
}

export function requestOtp(api: ApiConfig, args: RequestOtpArgs): Promise<RequestOtpResponse> {
  return postJson<RequestOtpResponse>(resolveBaseUrl(api), 'auth/otp/request', args);
}

export function verifyOtp(api: ApiConfig, args: VerifyOtpArgs): Promise<VerifyOtpResponse> {
  return postJson<VerifyOtpResponse>(resolveBaseUrl(api), 'auth/otp/verify', args);
}

/**
 * Dev-only direct login. Mirrors the backend `POST /auth/dev/login` shape.
 * The backend refuses this route when `NODE_ENV=production`; we additionally
 * gate it on `__DEV__` so a stray call from a production bundle is impossible.
 */
export function devLogin(api: ApiConfig, args: DevLoginArgs): Promise<DevLoginResponse> {
  if (!__DEV__) {
    return Promise.reject(
      new AppError('FORBIDDEN', 'devLogin is not available outside development builds'),
    );
  }
  return postJson<DevLoginResponse>(resolveBaseUrl(api), 'auth/dev/login', args);
}

/**
 * Translate an unknown error from the login API into a string suitable for
 * rendering in the login screen. Keeps error-text i18n out of the network
 * layer.
 */
export function loginErrorToMessage(err: unknown): string {
  if (err instanceof AppError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Login failed. Please try again.';
}
