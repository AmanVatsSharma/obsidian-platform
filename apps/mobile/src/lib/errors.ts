/**
 * File:        apps/mobile/src/lib/errors.ts
 * Module:      mobile · Lib · Errors
 * Purpose:     AppError — the single error shape used everywhere in the
 *              mobile app. Mirrors the backend's AppError contract from
 *              `apps/backend/src/common/errors/domain.errors.ts` so the
 *              same `{ code, message }` envelope can be carried through
 *              the network boundary. Per CLAUDE.md §15: never throw a
 *              raw `Error` or a framework-specific error class.
 *
 * Exports:
 *   - AppError                          — class extending Error
 *   - isAppError(value) → boolean       — type guard
 *
 * Depends on:
 *   - none
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - `code` is a stable, machine-readable identifier (e.g. 'AUTH_INVALID_OTP',
 *     'ORDER_REJECTED'). UI text should never live in `code` — it lives in
 *     `message` (or, for i18n, a translation key by convention).
 *   - `meta` is an open-ended bag for transport-level context (status codes,
 *     request ids, etc.) and is NEVER shown to the user without first being
 *     passed through a translator.
 *   - The `name` property is set to 'AppError' so `e.name === 'AppError'`
 *     works for ad-hoc string checks during dev.
 *
 * Read order:
 *   1. AppError    — the class
 *   2. isAppError  — the type guard
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

export type AppErrorMeta = Record<string, unknown> | undefined;

export class AppError extends Error {
  public readonly code: string;
  public readonly meta: AppErrorMeta;

  constructor(code: string, message: string, meta?: AppErrorMeta) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.meta = meta;
    // Maintain a sane stack trace in V8 (Hermes / JSC work without it).
    if (typeof (Error as { captureStackTrace?: unknown }).captureStackTrace === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Error as any).captureStackTrace(this, AppError);
    }
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
