/**
 * File:        apps/web/lib/prana-stream/stores/tick-listener-store.ts
 * Module:      web/prana-stream/stores
 * Purpose:     Lightweight tick-change detector hook.
 *              Components that want to react to a specific price change
 *              (flash, sound, toast) use this to know "the tick for
 *              {EXCHANGE}:{SYMBOL} has changed since I last looked".
 *
 * Exports:
 *   - useTickChange(exchange, symbol) — { changed, tick, change } where
 *     `change` is the percent change vs. the previous observed tick
 *     (0 when no prior tick exists)
 *   - useLatestTickPrice(exchange, symbol) — number | null
 *
 * Depends on:
 *   - watchlistTicksStore
 *
 * Side-effects:
 *   - None beyond subscribing to the store's version counter
 *
 * Key invariants:
 *   - First render returns `change === 0` and `changed === false` (no
 *     prior tick to compare against)
 *   - The hook DOES NOT push into the store; it only reads
 *   - useLatestTickPrice returns null when no tick has arrived
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { watchlistTicksStore } from './watchlist-ticks-store';
import type { Tick } from '../types';

export function useLatestTickPrice(exchange: string, symbol: string): number | null {
  const version = useSyncExternalStore(
    watchlistTicksStore.subscribe,
    watchlistTicksStore.getSnapshotVersion,
  );
  // Recompute the price on every version change
  return getPrice(version, exchange, symbol);
}

function getPrice(version: number, exchange: string, symbol: string): number | null {
  // Touch version to mark dependency
  void version;
  const tick = watchlistTicksStore.get(exchange, symbol);
  return tick ? tick.price : null;
}

export function useTickChange(
  exchange: string,
  symbol: string,
): { changed: boolean; tick: Tick | undefined; change: number } {
  const version = useSyncExternalStore(
    watchlistTicksStore.subscribe,
    watchlistTicksStore.getSnapshotVersion,
  );
  const prevRef = useRef<Tick | undefined>(undefined);
  const tick = watchlistTicksStore.get(exchange, symbol);

  // Detect change since the previous render
  const changed = !!(
    prevRef.current &&
    tick &&
    (prevRef.current.price !== tick.price || prevRef.current.ts !== tick.ts)
  );

  // Percent change vs. the previous observed tick. Returns 0 when there
  // is no prior tick (first render) or the previous price was 0 (avoid
  // divide-by-zero). Fractional; consumers multiply by 100 for display.
  let change = 0;
  if (prevRef.current && tick && prevRef.current.price !== 0) {
    change = (tick.price - prevRef.current.price) / prevRef.current.price;
  }

  useEffect(() => {
    // Defer to next tick so the consumer can read `changed === true`
    // once on the same render
    prevRef.current = tick;
  });

  return {
    changed,
    tick,
    change,
  };
}

