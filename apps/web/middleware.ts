/**
 * File:        apps/web/middleware.ts
 * Module:      Web · Device Routing
 * Purpose:     Auto-redirects mobile devices to /m/workstation and desktop to /workstation.
 *              Allows override via query params (?desktop=1, ?mobile=1) or cookies.
 *
 * Exports:
 *   - middleware(request) → Response   — Edge function for device detection
 *
 * Depends on:
 *   - next/server   — Next.js Request and Response objects
 *
 * Side-effects:
 *   - Sets device-preference cookie on override
 *   - Redirects to appropriate workstation route
 *
 * Key invariants:
 *   - Runs at edge for all routes — must be fast
 *   - User-agent detection is imperfect; query/cookie overrides always win
 *   - Does not redirect API routes or/_next/static
 *
 * Read order:
 *   1. This file — understand routing logic
 *   2. app/page.tsx — landing page with chooser links
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-08
 */

import { NextRequest, NextResponse } from 'next/server';

// Common mobile device patterns in user-agent
const MOBILE_PATTERNS = [
  /Android/i,
  /webOS/i,
  /iPhone/i,
  /iPad/i,
  /iPod/i,
  /BlackBerry/i,
  /IEMobile/i,
  /Opera Mini/i,
  /Mobile/i,
  /CriOS/i,
  /FxiOS/i,
];

// Workstation routes
const DESKTOP_WORKSTATION = '/workstation';
const MOBILE_WORKSTATION = '/m/workstation';

/**
 * Check if user-agent matches mobile patterns.
 */
function isMobileUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return MOBILE_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * Get device preference from cookie or query param.
 * Query params win over cookies (allows testing).
 */
function getDevicePreference(request: NextRequest): 'desktop' | 'mobile' | null {
  const url = request.nextUrl;

  // Query param override (for testing or explicit choice)
  if (url.searchParams.has('desktop')) return 'desktop';
  if (url.searchParams.has('mobile')) return 'mobile';

  // Cookie preference (persisted choice)
  const cookie = request.cookies.get('device-preference');
  if (cookie?.value === 'desktop') return 'desktop';
  if (cookie?.value === 'mobile') return 'mobile';

  return null;
}

/**
 * Get redirect response with optional cookie.
 */
function createRedirect(url: string, preference?: 'desktop' | 'mobile'): Response {
  // Next.js 15 requires absolute URLs for NextResponse.redirect
  const absoluteUrl = url.startsWith('http') ? url : `https://obsidian.local${url}`;
  const response = NextResponse.redirect(absoluteUrl);

  if (preference) {
    // Set cookie on redirect response
    response.cookies.set('device-preference', preference, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });
  }

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept root path
  if (pathname !== '/') {
    return undefined;
  }

  // Get explicit preference (query wins over cookie)
  const preference = getDevicePreference(request);

  // Detect device if no preference
  const userAgent = request.headers.get('user-agent');
  const isMobile = isMobileUserAgent(userAgent);

  // Determine target route
  let target: string;
  let finalPreference: 'desktop' | 'mobile' | undefined;

  if (preference === 'desktop') {
    target = DESKTOP_WORKSTATION;
    finalPreference = 'desktop';
  } else if (preference === 'mobile') {
    target = MOBILE_WORKSTATION;
    finalPreference = 'mobile';
  } else if (isMobile) {
    target = MOBILE_WORKSTATION;
    // Don't persist auto-detected preference - only explicit choices
    finalPreference = undefined;
  } else {
    target = DESKTOP_WORKSTATION;
    finalPreference = undefined;
  }

  return createRedirect(target, finalPreference);
}

// Configure which routes this middleware runs on
export const config = {
  // Only match root path
  matcher: '/',
};