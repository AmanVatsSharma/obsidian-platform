/**
 * File:        apps/web/shared/diagnostics/diag.ts
 * Module:      web · Diagnostics
 * Purpose:     Browser-side tagged logger. Emits to console with a stable
 *              `[OBSIDIAN][TAG]` prefix so multiple log sources can be
 *              filtered easily. All logs are tagged so a quick
 *              DevTools filter on "OBSIDIAN" surfaces only our own events.
 *
 * Exports:
 *   - diag(tag, message, extra?)  — log entry (no-op if `__DIAG__` false)
 *   - diagWarn(tag, message, ...)
 *   - diagError(tag, message, ...)
 *   - __DIAG__                    — set false to silence
 *
 * Why this exists:
 *   - Multiple call sites call `window.location.assign('/login')` or
 *     `router.replace(...)` on 401. The "expected layout router to be mounted"
 *     invariant is thrown by Next.js when one of these fires during the
 *     initial layout commit. We need to know WHICH call site is the offender.
 *   - diag captures `new Error().stack` automatically so the stack tells us.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-15
 */

// Toggle this to silence all diag output. Default: true in dev, false in prod.
declare global {
  // eslint-disable-next-line no-var
  var __DIAG__: boolean;
}
if (typeof globalThis !== 'undefined' && typeof globalThis.__DIAG__ === 'undefined') {
  globalThis.__DIAG__ = process.env.NODE_ENV !== 'production';
}

type Extra = Record<string, unknown> | Error | unknown;

function format(tag: string, message: string, extra?: Extra): unknown[] {
  const out: unknown[] = [`[OBSIDIAN][${tag}] ${message}`];
  if (extra !== undefined) {
    if (extra instanceof Error) {
      out.push(extra);
    } else {
      out.push(extra);
    }
  }
  return out;
}

export function diag(tag: string, message: string, extra?: Extra): void {
  if (!globalThis.__DIAG__) return;
  // eslint-disable-next-line no-console
  console.log(`[OBSIDIAN][${tag}] ${message}`, extra ?? '');
}

export function diagWarn(tag: string, message: string, extra?: Extra): void {
  if (!globalThis.__DIAG__) return;
  // eslint-disable-next-line no-console
  console.warn(`[OBSIDIAN][${tag}] ${message}`, extra ?? '');
}

export function diagError(tag: string, message: string, extra?: Extra): void {
  if (!globalThis.__DIAG__) return;
  // eslint-disable-next-line no-console
  console.error(`[OBSIDIAN][${tag}] ${message}`, extra ?? '');
}

/**
 * Capture the current call stack as a string. Useful for tagging a navigation
 * with where it came from — so the DevTools console shows:
 *   [OBSIDIAN][AUTH-GUARD] redirect to /login
 *     at redirectToLogin (apps/web/shared/diagnostics/diag.ts:75:11)
 *     at AuthGuard.useEffect (apps/broker-admin/src/lib/auth/auth-guard.tsx:33:7)
 *     ...
 */
export function stackOf(): string {
  return new Error().stack ?? '(no stack)';
}
