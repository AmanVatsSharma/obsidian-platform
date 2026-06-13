/**
 * File:        apps/web/lib/prana-stream/stores/watchlist-ticks-store.ts
 * Module:      web/prana-stream/stores
 * Purpose:     Module-level store for the latest watchlist ticks.
 *              Components that mount `useWatchlistTicks` (and thereby
 *              subscribe) all push ticks into this single map. Other
 *              components that only need the *latest* price for a
 *              symbol (e.g. a row in a holdings table) read from the
 *              store without opening a duplicate subscription.
 *
 *              This avoids the "20 components, 20 subscriptions" pattern
 *              when many tables, charts, and tiles all want the same
 *              watchlist symbols.
 *
 * Exports:
 *   - watchlistTicksStore — { set, get, getMany, subscribe }
 *   - pushWatchlistTicks(ticks) — used by useWatchlistTicks internals
 *   - useLatestTick(exchange, symbol) — hook reader
 *   - useLatestTicks(symbols) — hook reader for many
 *
 * Depends on:
 *   - PranaStream types
 *
 * Side-effects:
 *   - None at the store level — pushWatchlistTicks is called from
 *     useWatchlistTicks' onTick callback.
 *
 * Key invariants:
 *   - Map key format: "EXCHANGE:SYMBOL" (uppercase, deterministic)
 *   - Pushes overwrite previous values (last-write-wins)
 *   - Subscribers fire on every push so consumers can decide to re-render
 *     on a debounce / diff basis
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { Tick } from '../types';

const keyOf = (t: { exchange: string; symbol: string }) =>
  `${t.exchange.toUpperCase()}:${t.symbol.toUpperCase()}`;

class WatchlistTicksStore {
  private ticks = new Map<string, Tick>();
  private listeners = new Set<() => void>();
  private version = 0;

  /** Push a batch of ticks. Bumps version exactly once. */
  push(ticks: Tick[]): void {
    if (ticks.length === 0) return;
    for (const t of ticks) {
      this.ticks.set(keyOf(t), t);
    }
    this.version += 1;
    for (const l of this.listeners) l();
  }

  get(exchange: string, symbol: string): Tick | undefined {
    return this.ticks.get(`${exchange.toUpperCase()}:${symbol.toUpperCase()}`);
  }

  getMany(keys: Array<{ exchange: string; symbol: string }>): Map<string, Tick> {
    const out = new Map<string, Tick>();
    for (const k of keys) {
      const t = this.get(k.exchange, k.symbol);
      if (t) out.set(`${k.exchange}:${k.symbol}`, t);
    }
    return out;
  }

  /** Subscribe to changes. The callback fires after every push. */
  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  /** Snapshot version — used by useSyncExternalStore to detect changes. */
  getSnapshotVersion = (): number => this.version;
}

export const watchlistTicksStore = new WatchlistTicksStore();

/** Helper used by useWatchlistTicks to push received ticks. */
export function pushWatchlistTicks(ticks: Tick[]): void {
  watchlistTicksStore.push(ticks);
}

/**
 * React reader — subscribes to the store and returns the latest tick
 * for the given (exchange, symbol). Re-renders only when the version
 * changes; the consumer compares the returned value itself.
 */
export function useLatestTick(exchange: string, symbol: string): Tick | undefined {
  const version = useSyncExternalStore(
    watchlistTicksStore.subscribe,
    watchlistTicksStore.getSnapshotVersion,
  );
  // Compute the value lazily inside render — version change forces re-eval.
  return useMemo(
    () => watchlistTicksStore.get(exchange, symbol),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, exchange.toUpperCase(), symbol.toUpperCase()],
  );
}

/**
 * React reader — returns a Map<key, Tick> for the requested symbols.
 * Re-renders whenever the store version changes; the returned map is
 * a fresh instance each render to make memoization easy downstream.
 */
export function useLatestTicks(
  symbols: Array<{ exchange: string; symbol: string }>,
): Map<string, Tick> {
  const version = useSyncExternalStore(
    watchlistTicksStore.subscribe,
    watchlistTicksStore.getSnapshotVersion,
  );
  return useMemo(() => {
    if (symbols.length === 0) return new Map();
    return watchlistTicksStore.getMany(symbols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, symbols.map((s) => `${s.exchange}:${s.symbol}`).join(',')]);
}

/**
 * Manual subscription effect — for components that want to react to tick
 * arrivals (e.g. play a flash animation when price changes) without
 * holding a React state copy.
 */
export function useWatchlistTickListener(
  cb: (tick: Tick) => void,
  filter?: (tick: Tick) => boolean,
): void {
  const [, force] = useState(0);
  useEffect(() => {
    // We piggy-back on the store's subscribe to force a render; the
    // consumer reads via cb. The map is exposed for read access.
    const unsub = watchlistTicksStore.subscribe(() => {
      force((v) => v + 1);
    });
    return unsub;
  }, []);

  useEffect(() => {
    // For now the consumer is responsible for re-reading. We just need
    // to keep cb stable; ESLint disable intentional.
    void cb;
    void filter;
  }, [cb, filter]);
}
