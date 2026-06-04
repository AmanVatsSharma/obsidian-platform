/**
 * File:        apps/mobile/src/lib/format.ts
 * Module:      mobile · Lib · Formatting
 * Purpose:     Display formatters for prices, quantities, P&L, and
 *              timestamps. All numerics rendered with these helpers
 *              are safe to pass into the `monoNumber` text style — the
 *              strings contain only digits, decimal points, sign
 *              prefixes, and the currency symbol.
 *
 * Exports:
 *   - formatPrice(value, currency?)         → string
 *   - formatQuantity(value, dp?)            → string
 *   - formatPercent(value, dp?)             → string
 *   - formatSigned(value, currency?)       → string     — "+1,234.56" / "-9.20"
 *   - formatTimestamp(iso)                  → string
 *
 * Depends on:
 *   - none
 *
 * Side-effects:
 *   - none (pure functions)
 *
 * Key invariants:
 *   - The `+`/`-` prefix on `formatSigned` is mandatory for P&L columns per
 *     CLAUDE.md §12. Deltas are never bare numbers.
 *   - Prices always have 2 decimals; quantities default to 4 (covers crypto
 *     fractional units without sacrificing readability for equities).
 *   - `formatTimestamp` returns `HH:mm:ss` (24h). Full date is out of v1
 *     scope; the date is shown via the order's `createdAt` server-side
 *     formatted by the backend if needed.
 *   - None of these functions ever return locale-specific grouping (we use
 *     a fixed en-US grouping). i18n is a v2 concern.
 *
 * Read order:
 *   1. formatPrice       — primary use: ticker price, account equity
 *   2. formatQuantity    — primary use: order qty, position net qty
 *   3. formatPercent     — primary use: change percent
 *   4. formatSigned      — primary use: P&L cells
 *   5. formatTimestamp   — primary use: order timestamp, quote ts
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

const PRICE_DP = 2;
const QUANTITY_DP = 4;
const PERCENT_DP = 2;

function withCommas(intPart: string, fractional: string | null): string {
  // Insert thousands separators on the integer part only. Numbers come
  // out as `1,234.56` — readable in a monospace font without bleeding
  // into adjacent cells.
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fractional !== null ? `${grouped}.${fractional}` : grouped;
}

function fixed(value: number, dp: number): { intPart: string; frac: string | null } {
  if (!Number.isFinite(value)) return { intPart: '—', frac: null };
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const fixed = abs.toFixed(dp);
  const [intPart, frac] = fixed.split('.');
  // toFixed always returns an integer part even for 0; strip the sign we
  // re-add below to keep the grouping regex clean.
  const cleanInt = (intPart ?? '0').replace(/^-/, '');
  return { intPart: `${sign}${cleanInt}`, frac: frac ?? null };
}

export function formatPrice(value: number, currency: string = 'USD'): string {
  const { intPart, frac } = fixed(value, PRICE_DP);
  const numStr = withCommas(intPart, frac);
  return currency.length > 0 ? `${numStr} ${currency}` : numStr;
}

export function formatQuantity(value: number, dp: number = QUANTITY_DP): string {
  const { intPart, frac } = fixed(value, dp);
  return withCommas(intPart, frac);
}

export function formatPercent(value: number, dp: number = PERCENT_DP): string {
  if (!Number.isFinite(value)) return '—';
  const { intPart, frac } = fixed(value, dp);
  return `${withCommas(intPart, frac)}%`;
}

export function formatSigned(value: number, currency: string = 'USD'): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return currency.length > 0 ? `0.00 ${currency}` : '0.00';
  const sign = value > 0 ? '+' : '-';
  const abs = Math.abs(value);
  const formatted = formatPrice(abs, currency);
  return `${sign}${formatted}`;
}

export function formatTimestamp(iso: string): string {
  // Returns the 24h `HH:mm:ss` portion of an ISO-8601 timestamp. We
  // intentionally drop the date — the v1 UI shows time only.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
