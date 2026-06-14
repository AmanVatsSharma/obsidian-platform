/**
 * File:        apps/broker-admin/middleware.ts
 * Module:      broker-admin · Edge Middleware
 * Purpose:     Defense-in-depth auth gate. Runs on the Next.js edge for every
 *              request *before* the page is rendered, so unauthenticated users
 *              never see admin HTML and unauthenticated API calls are rejected.
 *
 *              The token lives in a non-httpOnly cookie (`ba_session`) that the
 *              client auth-context writes on login. It is only a *presence* check
 *              here — the backend re-validates the JWT and `x-tenant-id` on
 *              every API call. We do not trust the cookie for authorization.
 *
 * Public paths (always allowed):
 *   - /login
 *   - /setup
 *   - /kite-login
 *   - /api/auth/* (login, dev login, otp)
 *   - /api/tenancy/brand-config (used by login page for branding)
 *   - /_next/static, /_next/image, /favicon.ico
 *
 * Exports:
 *   - middleware  — Next.js edge middleware
 *   - config      — matcher (skips static assets to keep latency down)
 *
 * Key invariants:
 *   - Cookie is `Path=/; SameSite=Lax` — never `Secure: false` in prod, but we
 *     leave SameSite=Lax to keep dev (http://localhost) working.
 *   - On 401 from the backend, the api proxy will set a `ba_session=; Max-Age=0`
 *     and the next render will redirect to /login.
 *   - Matcher excludes `/_next/*` and `/api/auth/*` to avoid an infinite loop.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/setup', '/kite-login'];
const PUBLIC_API_PREFIXES = ['/api/auth/', '/api/tenancy/brand-config'];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/favicon.ico' || pathname === '/robots.txt') return true;
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const hasSession = req.cookies.has('ba_session');

  if (!hasSession) {
    // For API routes, return 401 instead of redirecting — clients handle JSON.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { code: 'UNAUTHENTICATED', message: 'Missing session cookie' },
        { status: 401 },
      );
    }

    // For page routes, redirect to /login and preserve the original target.
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Session present — let the request through. The backend still validates.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on every request except static assets. We still pass /_next/* through
     * isPublic() above as a belt-and-braces guard.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
