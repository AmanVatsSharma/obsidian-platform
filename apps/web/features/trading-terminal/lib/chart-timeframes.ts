/**
 * @file chart-timeframes.ts
 * @module web-trading
 * @description Chart timeframe selector options used by the mobile and
 *              desktop chart screens. UI enum — not market data.
 *
 * Exports:
 *   - TIMEFRAMES — readonly array of timeframe labels
 *   - Timeframe  — string-literal type derived from TIMEFRAMES
 *
 * @author BharatERP
 * @created 2026-06-12
 */

/** Allowed timeframe labels for the chart. */
export const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M'] as const;

/** Type of a single timeframe label. */
export type Timeframe = (typeof TIMEFRAMES)[number];
