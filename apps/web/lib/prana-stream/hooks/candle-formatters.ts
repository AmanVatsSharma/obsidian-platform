/**
 * File:        apps/web/lib/prana-stream/hooks/candle-formatters.ts
 * Module:      web/prana-stream/hooks
 * Purpose:     Adapter between our Candle type and lightweight-charts row
 *              types. Centralized so the chart panel and any other consumer
 *              (mini chart, sparkline, depth chart) all share the same
 *              conversion.
 *
 * Exports:
 *   - toCandlestickRows(candles) — CandlestickData<UTCTimestamp>[]
 *   - toHistogramRows(candles)   — HistogramData<UTCTimestamp>[]
 *
 * Depends on:
 *   - lightweight-charts (type-only)
 *   - ./use-candles (Candle type)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Output rows are in ascending time order
 *   - Volume rows are colored by bar direction (green up, red down)
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

import type { CandlestickData, HistogramData, UTCTimestamp } from 'lightweight-charts';
import type { Candle } from './use-candles';

export function toCandlestickRows(candles: Candle[]): CandlestickData<UTCTimestamp>[] {
  return candles.map((c) => ({
    time: c.time as UTCTimestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));
}

export function toHistogramRows(candles: Candle[]): HistogramData<UTCTimestamp>[] {
  return candles.map((c) => ({
    time: c.time as UTCTimestamp,
    value: c.volume,
    color: c.close >= c.open ? 'rgba(16,217,150,0.35)' : 'rgba(255,59,92,0.35)',
  }));
}
