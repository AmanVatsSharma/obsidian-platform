/**
 * File:        libs/mobile-ui-kit/src/lib/format.ts
 * Module:      mobile-ui-kit · Format
 * Purpose:     Tiny formatting helpers used by mobile primitives. Mirrors
 *              the conventions from apps/web (fmt, fmtPrice, pnlSign, pnlClass)
 *              so the mobile UI looks the same as the web trader terminal.
 *
 * Exports:
 *   - fmt(n, digits?)            → string     — group-thousands, 2-decimal default
 *   - fmtPrice(n, digits)        → string     — price-precision formatting
 *   - pnlSign(n)                 → '+' | '−'  — sign glyph for deltas
 *   - pnlClass(n)                → 'bull' | 'bear' | ''
 *
 * Depends on:
 *   - none
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Deltas always carry an explicit sign ('+' or '−') per CLAUDE.md §12.
 *   - pnlClass returns '' for exactly zero so the caller can apply a muted
 *     color without forcing red or green on a flat line.
 *
 * Read order:
 *   1. fmt → fmtPrice → pnlSign → pnlClass
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

export function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtPrice(n: number, digits = 5): string {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(Math.max(0, Math.min(10, digits)));
}

export function pnlSign(n: number): '+' | '−' {
  return n >= 0 ? '+' : '−';
}

export function pnlClass(n: number): 'bull' | 'bear' | '' {
  if (n > 0) return 'bull';
  if (n < 0) return 'bear';
  return '';
}
