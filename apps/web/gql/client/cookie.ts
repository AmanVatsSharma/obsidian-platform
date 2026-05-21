/**
 * File:        apps/web/gql/client/cookie.ts
 * Module:      web · GraphQL · Client
 * Purpose:     SSR-safe cookie reader — abstracts across Next.js server components
 *              (where headers() is the API) and browser clients (where document.cookie
 *              is the API). Returns null when cookies cannot be read (e.g., no cookie
 *              header present in server context).
 *
 * Exports:
 *   - getCookie(name) → string | null   — reads cookie by name from client or server
 *
 * Depends on:
 *   - next/headers   — server-only cookie headers API
 *
 * Side-effects:
 *   - none (pure read — no side-effects)
 *
 * Key invariants:
 *   - getCookie may return null at call time on server components when the cookie
 *     header is absent. Callers must handle null gracefully.
 *   - Never used to WRITE cookies — Apollo auth-link only reads.
 *
 * Read order:
 *   1. getCookie — entry point for both server and client contexts
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

function getCookie(name: string): string | null {
  // Server component — use Next.js headers API
  if (typeof window === 'undefined') {
    try {
      // Dynamic require keeps this server-only
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { cookies } = require('next/headers');
      const cookieStore = cookies();
      const cookie = cookieStore.get(name);
      return cookie?.value ?? null;
    } catch {
      // Fallback: try to parse from headers manually
      return null;
    }
  }

  // Browser client
  if (typeof document !== 'undefined' && document.cookie) {
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  return null;
}

export { getCookie };