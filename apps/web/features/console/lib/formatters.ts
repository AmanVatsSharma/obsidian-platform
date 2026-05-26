/**
 * File:        apps/web/features/console/lib/formatters.ts
 * Module:      web · Console · Formatters
 * Purpose:     Number / currency / signed-number string formatters used across the
 *              twelve console sections. Mirrors the prototype's `fmt`, `fmtSign`,
 *              and `ccy` helpers so visual output matches the design exactly.
 *
 * Exports:
 *   - fmt(n, decimals=2)        → string  ("48,214.62")    — fixed-decimal grouping
 *   - fmtSign(n, decimals=2)    → string  ("+887.56" / "−1,200.00")
 *   - ccy(amount, code, dec=2)  → string  ("€48,214.62" / "USDT 800.00")
 *
 * Depends on:
 *   - none (uses Intl/toLocaleString)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Locale fixed to 'en-US' so the design's "1,234.56" thousands-separator is
 *     deterministic regardless of the user's browser locale. Per-user locale is a
 *     separate Profile preference and is not yet wired.
 *   - fmtSign uses the typographic minus '−' (U+2212), not the ASCII hyphen, to match
 *     the prototype and CLAUDE.md §12 ("Bull/bear deltas always +/− prefixed, 2 decimals").
 *   - undefined / null → "—" (em-dash) so empty cells render gracefully.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

const CURRENCY_SYMBOL: Readonly<Record<string, string>> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  USDT: '₮',
  USDC: '₮',
};

export function fmt(n: number | null | undefined, decimals = 2): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtSign(n: number | null | undefined, decimals = 2): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  const sign = n >= 0 ? '+' : '−';
  return sign + fmt(Math.abs(n), decimals);
}

export function ccy(amount: number | null | undefined, code: string, decimals = 2): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return '—';
  const sym = CURRENCY_SYMBOL[code] ?? '';
  const body = fmt(amount, decimals);
  return sym ? `${sym}${body}` : `${code} ${body}`;
}
