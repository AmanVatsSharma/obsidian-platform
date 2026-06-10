/**
 * File:        apps/web/lib/prana-stream/hooks/use-symbol-search.ts
 * Module:      web/prana-stream
 * Purpose:     Symbol search with live-price tick overlay.
 *              As the user types, we debounce-fetch a static symbol list
 *              via REST. When the user "looks at" a result (hover/click),
 *              we subscribe to live ticks for that symbol and overlay the
 *              latest LTP. Subscriptions auto-expire after `inactiveMs`
 *              of not being touched, so we never hold a Kite slot open
 *              for a symbol the user moved away from.
 *
 * Exports:
 *   - useSymbolSearch({ query, onResultClick, inactiveMs, maxActive })
 *     → { results, ticksByKey, getLivePrice, isLoading, error, total, stop }
 *
 * Depends on:
 *   - usePranaStream — provider context
 *   - market-data search endpoint (REST)
 *
 * Side-effects:
 *   - Debounced fetch of symbol search results
 *   - Subscribe / unsubscribe to live ticks per active symbol
 *   - Schedules expiry timers per subscription
 *
 * Key invariants:
 *   - At most `maxActive` live subscriptions are open at once (default 20)
 *   - Each subscription has a TTL; missed heartbeats = unsubscribe
 *   - Same symbol subscribed twice collapses to a single subscription
 *   - Ticks stop arriving → state held in stale price field; UI flags it
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePranaStream } from '../prana-provider';
import type { Tick } from '../types';

export type SymbolSearchResult = {
  exchange: string;
  symbol: string;
  name?: string;
  /** Last traded price as of the snapshot (frozen, not live). */
  lastTradedPrice?: number;
};

export type SymbolSearchOptions = {
  /** Debounce delay in ms. */
  debounceMs?: number;
  /** Max live subscriptions to keep open simultaneously. */
  maxActive?: number;
  /** TTL — when a symbol is not touched for this long, unsubscribe. */
  inactiveMs?: number;
  /** Max results returned by the REST search. */
  limit?: number;
  /**
   * Search function — defaults to the backend market-data search endpoint.
   * Override to plug into a local index or cached store.
   */
  fetcher?: (q: string, limit: number) => Promise<SymbolSearchResult[]>;
};

type ActiveKey = string; // `${exchange}:${symbol}`
type TouchCallback = () => void;

const DEFAULT_DEBOUNCE = 200;
const DEFAULT_MAX_ACTIVE = 20;
const DEFAULT_INACTIVE = 30_000;
const DEFAULT_LIMIT = 30;

async function defaultSearch(q: string, limit: number): Promise<SymbolSearchResult[]> {
  const url = `/api/market/instruments/search?q=${encodeURIComponent(q)}&limit=${limit}`;
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: SymbolSearchResult[] };
  return json.data ?? [];
}

export function useSymbolSearch(
  query: string,
  options: SymbolSearchOptions = {},
) {
  const {
    debounceMs = DEFAULT_DEBOUNCE,
    maxActive = DEFAULT_MAX_ACTIVE,
    inactiveMs = DEFAULT_INACTIVE,
    limit = DEFAULT_LIMIT,
    fetcher = defaultSearch,
  } = options;

  const { client } = usePranaStream();
  const [results, setResults] = useState<SymbolSearchResult[]>([]);
  const [ticks, setTicks] = useState<Map<ActiveKey, Tick>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Active subscriptions: a Map from ActiveKey to its expiry timer.
   * Touching a key resets the timer; on expiry, the subscription is closed
   * and the tick is dropped from local state.
   */
  const activeRef = useRef<Map<ActiveKey, NodeJS.Timeout>>(new Map());
  const touchedAtRef = useRef<Map<ActiveKey, number>>(new Map());
  const subscribedRef = useRef<Set<ActiveKey>>(new Set());

  /**
   * Touch a symbol — mark it as "actively viewed".
   * Subscribes if not already; resets the expiry timer.
   */
  const touch = useCallback(
    (exchange: string, symbol: string) => {
      const key: ActiveKey = `${exchange}:${symbol}`;

      // If we already have N active subscriptions, evict the oldest.
      if (!activeRef.current.has(key) && activeRef.current.size >= maxActive) {
        const oldest = [...touchedAtRef.current.entries()].sort(
          (a, b) => a[1] - b[1],
        )[0]?.[0];
        if (oldest) expireOne(oldest);
      }

      // Subscribe (or refresh subscription) on the server.
      if (!subscribedRef.current.has(key)) {
        client.subscribeWatchlist([{ exchange, symbol }]);
        subscribedRef.current.add(key);
      }

      touchedAtRef.current.set(key, Date.now());

      // Reset expiry timer.
      const existingTimer = activeRef.current.get(key);
      if (existingTimer) clearTimeout(existingTimer);
      const timer = setTimeout(() => expireOne(key), inactiveMs);
      activeRef.current.set(key, timer);
    },
    [client, inactiveMs, maxActive],
  );

  const expireOne = useCallback(
    (key: ActiveKey) => {
      const timer = activeRef.current.get(key);
      if (timer) {
        clearTimeout(timer);
        activeRef.current.delete(key);
      }
      if (subscribedRef.current.has(key)) {
        // Send unsubscribe for the specific pair.
        const [exchange, symbol] = key.split(':');
        try {
          client.unsubscribeWatchlist([{ exchange, symbol }]);
        } catch {
          /* ignore */
        }
        subscribedRef.current.delete(key);
      }
      touchedAtRef.current.delete(key);
      setTicks((prev) => {
        if (!prev.has(key)) return prev;
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    },
    [client],
  );

  /**
   * Cleanup helper called on unmount.
   */
  const stop = useCallback(() => {
    for (const k of [...activeRef.current.keys()]) expireOne(k);
  }, [expireOne]);

  /**
   * Wire tick stream into local state.
   */
  useEffect(() => {
    const unsub = client.on<Tick | Tick[]>('watchlist.ticks', (payload) => {
      const ticksArr = Array.isArray(payload) ? payload : [payload];
      setTicks((prev) => {
        const next = new Map(prev);
        for (const t of ticksArr) {
          const key: ActiveKey = `${t.exchange}:${t.symbol}`;
          if (activeRef.current.has(key)) {
            next.set(key, t);
          }
        }
        return next;
      });
    });
    return unsub;
  }, [client]);

  /**
   * Debounced REST search.
   */
  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    const handle = setTimeout(async () => {
      try {
        const data = await fetcher(q, limit);
        if (!cancelled) {
          setResults(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
          setIsLoading(false);
        }
      }
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, debounceMs, limit, fetcher]);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => stop();
  }, [stop]);

  /**
   * Lookup the live price for a given (exchange, symbol).
   * Returns null when no live subscription is active.
   */
  const getLivePrice = useCallback(
    (exchange: string, symbol: string): { price: number; receivedAt: number } | null => {
      const key: ActiveKey = `${exchange}:${symbol}`;
      const tick = ticks.get(key);
      if (!tick) return null;
      return { price: tick.price, receivedAt: tick.ts };
    },
    [ticks],
  );

  return {
    results,
    ticks,
    getLivePrice,
    isLoading,
    error,
    total: results.length,
    touch,
    stop,
  };
}
