/**
 * File:        apps/web/lib/prana-stream/hooks/use-candles.ts
 * Module:      web/prana-stream/hooks
 * Purpose:     Build live OHLCV bars from the watchlist tick stream.
 *              Each tick that arrives during a bar interval updates the
 *              high/low/close of the *current* bar and increments volume.
 *              When the bar's timeframe boundary crosses, the bar is sealed
 *              and a new one starts. This is the same model TradingView and
 *              CMC use for real-time tick charts.
 *
 *              Backfill: a `candles` initializer seeds the historical bars.
 *              For the initial render we use a deterministic seeded random
 *              walk so the chart has structure (volume profile) but live
 *              updates come from real ticks. This is a temporary position
 *              until a REST candles endpoint is added; once it is, replace
 *              `seedCandles` with a `useQuery<...>(['candles', symbol, tf])`.
 *
 * Exports:
 *   - useCandles(opts) — { current, getSealed, sealed }
 *   - Candle           — bar shape
 *
 * Depends on:
 *   - useWatchlistTicks — the live tick source
 *
 * Side-effects:
 *   - none beyond subscribing to PranaStream via useWatchlistTicks
 *
 * Key invariants:
 *   - All bars are aligned to the timeframe boundary in seconds
 *     (1m=60, 5m=300, 15m=900, 1h=3600, 1d=86400)
 *   - `current` is the in-progress bar; updates on every tick
 *   - `sealed` is the immutable history (length = seed count)
 *   - Volume is per-bar and resets at the boundary
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWatchlistTicks } from './use-watchlist-ticks';
import type { Tick } from '../types';

export type Candle = {
  /** seconds since epoch, aligned to timeframe boundary */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const TF_SECONDS: Record<string, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14_400,
  '1d': 86_400,
};

export function getTfSeconds(tf: string): number {
  return TF_SECONDS[tf] ?? 300;
}

/**
 * Mulberry32 PRNG — small, fast, deterministic. Seeded by the symbol so the
 * same instrument always produces the same historical bars (no flicker on
 * hot-reload, identical candles across machines, easy to test).
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function symbolSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Generate a deterministic OHLCV series for the initial chart load.
 * Replaces the old `generateOHLCV(basePrice, count, volatility)` from
 * libs/trading-ui/src/lib/mock-data.ts. Volatility is dampened relative
 * to the random Math.random() version so the live ticks are visible
 * against a realistic-looking history.
 */
export function seedCandles(
  symbol: string,
  basePrice: number,
  count: number,
  tf: string,
): Candle[] {
  const tfSec = getTfSeconds(tf);
  const rand = mulberry32(symbolSeed(symbol));
  const now = Math.floor(Date.now() / 1000);
  const out: Candle[] = [];
  let price = basePrice;

  for (let i = count - 1; i >= 0; i--) {
    const t = now - i * tfSec;
    const open = price;
    // Mean-reverting random walk: step sized to ~0.05% of price
    const stepPct = (rand() - 0.5) * 0.001;
    const close = open * (1 + stepPct);
    const wick = Math.abs(rand() - 0.5) * 0.0005;
    const high = Math.max(open, close) * (1 + wick);
    const low = Math.min(open, close) * (1 - wick);
    const volume = Math.floor(rand() * 200_000 + 20_000);
    out.push({ time: t, open, high, low, close, volume });
    price = close;
  }
  return out;
}

type UseCandlesOpts = {
  exchange: string;
  symbol: string;
  tf: string;
  /** number of historical bars to seed (default 300) */
  historyCount?: number;
  /** base price used to seed the historical bars (default 100) */
  basePrice?: number;
};

export type UseCandlesResult = {
  /** the in-progress bar (last entry of the series) */
  current: Candle | null;
  /** the full series — seed + any new bars produced by ticks */
  series: Candle[];
  /** whether the connection is up; useful for "Live" badge */
  isLive: boolean;
};

/**
 * Subscribes to live ticks for the symbol and folds them into a candle
 * series aligned to the chosen timeframe. Returns the latest bar and the
 * full series (most recent last).
 */
export function useCandles({
  exchange,
  symbol,
  tf,
  historyCount = 300,
  basePrice = 100,
}: UseCandlesOpts): UseCandlesResult {
  const ticks = useWatchlistTicks([{ exchange, symbol }]);
  const tick = ticks.get(`${exchange}:${symbol}`);

  // Seeded history; regenerated only when symbol/tf changes
  const seed = useMemo(
    () => seedCandles(`${exchange}:${symbol}`, basePrice, historyCount, tf),
    [exchange, symbol, tf, historyCount, basePrice],
  );

  // The mutable series — starts as the seed, grows on every tick batch
  const [series, setSeries] = useState<Candle[]>(seed);

  // When the seed changes (instrument change), reset the series
  useEffect(() => {
    setSeries(seed);
  }, [seed]);

  // Fold the latest tick into the series
  useEffect(() => {
    if (!tick) return;
    setSeries((prev) => {
      if (prev.length === 0) return prev;
      const tfSec = getTfSeconds(tf);
      const now = Math.floor(Date.now() / 1000);
      const barStart = now - (now % tfSec);
      const last = prev[prev.length - 1];
      const price = tick.price;

      if (last.time === barStart) {
        // Same bar — update high/low/close/volume
        const updated: Candle = {
          ...last,
          high: Math.max(last.high, price),
          low: Math.min(last.low, price),
          close: price,
          // Estimate volume as 1 per tick (placeholder until ticks carry vol)
          volume: last.volume + 1,
        };
        return prev.slice(0, -1).concat(updated);
      } else if (barStart > last.time) {
        // New bar — open = previous close, seed low/high from price
        const fresh: Candle = {
          time: barStart,
          open: last.close,
          high: Math.max(last.close, price),
          low: Math.min(last.close, price),
          close: price,
          volume: 1,
        };
        return prev.concat(fresh);
      }
      // Old tick (e.g., out-of-order) — ignore
      return prev;
    });
  }, [tick, tf]);

  const current = series.length > 0 ? series[series.length - 1] : null;

  return { current, series, isLive: !!tick };
}
