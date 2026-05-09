/**
 * File:        libs/trading-ui/src/lib/format-utils.ts
 * Module:      trading-ui · Formatting
 * Purpose:     Number and P&L formatting helpers used across all trading panels.
 *
 * Exports:
 *   - fmt(n, d?) → string        — locale-formatted number with d decimal places
 *   - fmtPrice(n, digits) → string — fixed-decimal price string matching instrument precision
 *   - pnlClass(n) → 'bull'|'bear' — CSS class name for positive/negative values
 *   - pnlSign(n) → string        — '+' prefix for positive, '' for negative
 *
 * Depends on:
 *   - none
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - fmt() returns '—' for undefined input (safe for partially loaded data)
 *   - fmtPrice() precision must match Instrument.digits to avoid display drift
 *
 * Read order:
 *   1. fmt — most used
 *   2. fmtPrice — price-specific formatting
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

export function fmt(n: number | undefined, d = 2): string {
  return n?.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) ?? '—';
}

export function fmtPrice(n: number | undefined, digits: number): string {
  return n?.toFixed(digits) ?? '—';
}

export function pnlClass(n: number): 'bull' | 'bear' {
  return n >= 0 ? 'bull' : 'bear';
}

export function pnlSign(n: number): string {
  return n >= 0 ? '+' : '';
}
