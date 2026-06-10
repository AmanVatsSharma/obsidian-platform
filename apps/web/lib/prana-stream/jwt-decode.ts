/**
 * File:        apps/web/lib/prana-stream/jwt-decode.ts
 * Module:      web/prana-stream
 * Purpose:     Lightweight JWT payload decoder.
 *              Reads the `sub` (userId) and `tid` (tenantId) claims from the
 *              access token without verifying the signature (the backend has
 *              already verified it during authentication).
 *
 * Exports:
 *   - decodeJwtClaims(token) — parse unverified payload claims
 *
 * Depends on:
 *   - none (browser atob)
 *
 * Side-effects:
 *   - none (pure function)
 *
 * Key invariants:
 *   - Does NOT verify the signature — for display/routing only
 *   - Returns null for malformed tokens (graceful degradation)
 *   - Handles base64url encoding (URL-safe alphabet)
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

export type JwtClaims = {
  sub: string;
  tid: string;
  iat?: number;
  exp?: number;
};

function base64UrlDecode(input: string): string {
  // Replace base64url chars with base64, then pad
  const pad = '='.repeat((4 - (input.length % 4)) % 4);
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  // atob is available in browser; in Node 18+ too
  if (typeof atob !== 'undefined') {
    return atob(b64);
  }
  // Fallback for SSR
  return Buffer.from(b64, 'base64').toString('utf-8');
}

export function decodeJwtClaims(token: string): JwtClaims | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payloadJson = base64UrlDecode(parts[1] ?? '');
    const claims = JSON.parse(payloadJson) as Record<string, unknown>;
    if (typeof claims['sub'] !== 'string' || typeof claims['tid'] !== 'string') {
      return null;
    }
    return {
      sub: claims['sub'],
      tid: claims['tid'],
      iat: typeof claims['iat'] === 'number' ? claims['iat'] : undefined,
      exp: typeof claims['exp'] === 'number' ? claims['exp'] : undefined,
    };
  } catch {
    return null;
  }
}