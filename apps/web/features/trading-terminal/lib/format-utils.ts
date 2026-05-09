/**
 * @file format-utils.ts
 * @module web-trading
 * @description Number and P&amp;L formatting helpers for workstation tables and tickets.
 * @author BharatERP
 * @created 2026-04-03
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
