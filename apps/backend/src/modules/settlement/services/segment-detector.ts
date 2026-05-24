/**
 * File:        apps/backend/src/modules/settlement/services/segment-detector.ts
 * Module:      settlement
 * Purpose:     Heuristic segment detection from instrumentId string patterns.
 *              Used to determine settlement T+N cycle without a market-data lookup.
 *
 * Exports:
 *   - detectSegment(instrumentId: string): Segment
 *   - Segment (type alias)
 *
 * Depends on:
 *   - none
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - CRYPTO instruments always detected first (highest T+N variance)
 *   - FOREX detected before EQUITY (CFD is a subset of FOREX)
 *   - FNO detected as EQUITY subgroup (same T+2 cycle, different segment code)
 *   - Default fallback is EQUITY
 *
 * Read order:
 *   1. detectSegment() — single entry point
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

export type Segment = 'CRYPTO' | 'FOREX' | 'EQUITY' | 'COMMODITY';

/**
 * Detects settlement segment from an instrumentId string.
 *
 * Heuristic rules (checked in priority order):
 *   - Contains 'CRYPTO:' or 'PERP'           → CRYPTO  (T+0)
 *   - Contains 'FX:' or 'CFD'               → FOREX   (T+1)
 *   - Contains 'FNO' or 'OPTION' or 'FUT'    → EQUITY  (T+2, F&O subgroup)
 *   - Contains 'MCX' or 'COMMO'              → COMMODITY (T+2)
 *   - Default                               → EQUITY  (T+2)
 */
export function detectSegment(instrumentId: string): Segment {
  const upper = instrumentId.toUpperCase();

  if (upper.includes('CRYPTO:') || upper.includes('PERP')) return 'CRYPTO';
  if (upper.includes('FX:') || upper.includes('CFD')) return 'FOREX';
  if (upper.includes('FNO') || upper.includes('OPTION') || upper.includes('FUT')) return 'EQUITY';
  if (upper.includes('MCX') || upper.includes('COMMO')) return 'COMMODITY';

  return 'EQUITY';
}