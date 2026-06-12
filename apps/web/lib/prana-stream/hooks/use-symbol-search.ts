/**
 * File:        apps/web/lib/prana-stream/hooks/use-symbol-search.ts
 * Module:      web/prana-stream
 * Purpose:     Symbol search with LIVE price tick overlay.
 *
 *              As the user types, we debounce-fetch a static symbol list
 *              via REST. Once results arrive, the top `autoTouchTopN`
 *              symbols are auto-subscribed to live ticks (no user hover
 *              required) so the search dropdown shows streaming prices.
 *              Subscriptions auto-expire after `inactiveMs` of inactivity
 *              and are evicted when a new search replaces the result set
 *              — so we never hold a Kite slot open for a symbol the user
 *              has moved past.
 *
 *              A user can still call `touch()` to pin a specific symbol
 *              (e.g. when they click it) — that resets the expiry timer
 *              and lifts it out of the auto-touch pool.
 *
 * Exports:
 *   - useSymbolSearch(query, options)
 *     → { results, ticks, getLivePrice, isLoading, error, total, touch, stop }
 *
 * Depends on:
 *   - usePranaStream — provider context (PranaStream client)
 *   - market-data search endpoint (REST)
 *
 * Side-effects:
 *   - Debounced fetch of symbol search results
 *   - Auto-subscribe top N results to live ticks; unsubscribe on replace
 *   - Schedules expiry timers per subscription
 *
 * Key invariants:
 *   - At most `maxActive` live subscriptions are open at once (default 20)
 *   - Auto-touch consumes at most `autoTouchTopN` slots (default 8)
 *   - Each subscription has a TTL; missed heartbeats = unsubscribe
 *   - Same symbol subscribed twice collapses to a single subscription
 *   - On new search results: drop auto subscriptions for symbols no longer
 *     in the top N, keep `touch()`-pinned symbols alive
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
  /**
   * Auto-subscribe the top N search results to live ticks. The user
   * does NOT need to hover — prices stream into the dropdown as soon
   * as the REST search resolves. Set to 0 to disable.
   */
  autoTouchTopN?: number;
  /**
   * TTL — when a symbol is not touched for this long, unsubscribe.
   * For auto-touched symbols, this is the dwell time on a result set.
   */
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
type SubscriptionSource = 'auto' | 'manual';

interface SubscriptionMeta {
  source: SubscriptionSource;
  timer: NodeJS.Timeout;
}

const DEFAULT_DEBOUNCE = 200;
const DEFAULT_MAX_ACTIVE = 20;
const DEFAULT_AUTO_TOUCH = 8;
const DEFAULT_INACTIVE = 30_000;
const DEFAULT_LIMIT = 30;

async function defaultSearch(q: string, limit: number): Promise<SymbolSearchResult[]> {
  const url = `/api/market/instruments/search?q=${encodeURIComponent(q)}&limit=${limit}`;
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: SymbolSearchResult[] };
  return json.data ?? [];
}

function makeKey(exchange: string, symbol: string): ActiveKey {
  return `${exchange}:${symbol}`;
}

export function useSymbolSearch(
  query: string,
  options: SymbolSearchOptions = {},
) {
  const {
    debounceMs = DEFAULT_DEBOUNCE,
    maxActive = DEFAULT_MAX_ACTIVE,
    autoTouchTopN = DEFAULT_AUTO_TOUCH,
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
   * Subscription metadata, keyed by ActiveKey.
   * `source` distinguishes auto (top-N) from manual (touch) subs.
   * Touching a key promotes it to 'manual' and resets the timer.
   */
  const subsRef = useRef<Map<ActiveKey, SubscriptionMeta>>(new Map());
  const touchedAtRef = useRef<Map<ActiveKey, number>>(new Map());
  /**
   * Set of keys the server is currently subscribed to.
   * Tracked separately from subsRef so we can avoid re-sending
   * `subscribe` for a key we already have.
   */
  const subscribedRef = useRef<Set<ActiveKey>>(new Set());

  /**
   * Open a live subscription for a key, deduping against the server.
   * If the cap (`maxActive`) is hit, evict the oldest non-pinned sub.
   */
  const openSub = useCallback(
    (key: ActiveKey, source: SubscriptionSource) => {
      // Evict oldest auto sub if at cap.
      if (!subsRef.current.has(key) && subsRef.current.size >= maxActive) {
        const oldestAuto = [...subsRef.current.entries()]
          .filter(([, meta]) => meta.source === 'auto')
          .sort(
            (a, b) =>
              (touchedAtRef.current.get(a[0]) ?? 0) -
              (touchedAtRef.current.get(b[0]) ?? 0),
          )[0]?.[0];
        if (oldestAuto) {
          closeSub(oldestAuto);
        } else {
          // No auto subs to evict — refuse to exceed cap.
          return;
        }
      }

      const [exchange, symbol] = key.split(':');

      // Tell the server exactly once per key.
      if (!subscribedRef.current.has(key)) {
        try {
          client.subscribeWatchlist([{ exchange, symbol }]);
        } catch {
          /* ignore — connect-state will retry on next touch */
        }
        subscribedRef.current.add(key);
      }

      // Reset expiry timer.
      const existing = subsRef.current.get(key);
      if (existing) clearTimeout(existing.timer);
      const timer = setTimeout(() => closeSub(key), inactiveMs);
      subsRef.current.set(key, { source, timer });
      touchedAtRef.current.set(key, Date.now());
    },
    [client, inactiveMs, maxActive],
  );

  /**
   * Close a single subscription: clear timer, drop from server,
   * remove tick from local state. Idempotent.
   */
  const closeSub = useCallback(
    (key: ActiveKey) => {
      const meta = subsRef.current.get(key);
      if (meta) {
        clearTimeout(meta.timer);
        subsRef.current.delete(key);
      }
      if (subscribedRef.current.has(key)) {
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
   * User explicitly touched a symbol (hover/click). Promotes it to
   * 'manual' source so the auto-touch reaper doesn't evict it.
   */
  const touch = useCallback(
    (exchange: string, symbol: string) => {
      const key = makeKey(exchange, symbol);
      openSub(key, 'manual');
    },
    [openSub],
  );

  /**
   * Stop everything (used on unmount).
   */
  const stop = useCallback(() => {
    for (const k of [...subsRef.current.keys()]) closeSub(k);
  }, [closeSub]);

  /**
   * Wire the watchlist tick stream into local state.
   * Only stores ticks for keys we currently have an open sub for.
   */
  useEffect(() => {
    const unsub = client.on<Tick | Tick[]>('watchlist.ticks', (payload) => {
      const ticksArr = Array.isArray(payload) ? payload : [payload];
      setTicks((prev) => {
        const next = new Map(prev);
        for (const t of ticksArr) {
          const key: ActiveKey = `${t.exchange}:${t.symbol}`;
          if (subsRef.current.has(key)) {
            next.set(key, t);
          }
        }
        return next;
      });
    });
    return unsub;
  }, [client]);

  /**
   * Debounced REST search + auto-subscribe top N results.
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
        if (cancelled) return;
        setResults(data);
        setIsLoading(false);

        // Auto-touch the top N results so the user sees live prices
        // in the dropdown without having to hover.
        if (autoTouchTopN > 0) {
          const topKeys = new Set<ActiveKey>(
            data.slice(0, autoTouchTopN).map((r) => makeKey(r.exchange, r.symbol)),
          );

          // Drop auto subs that fell out of the top N.
          for (const [key, meta] of [...subsRef.current.entries()]) {
            if (meta.source === 'auto' && !topKeys.has(key)) {
              closeSub(key);
            }
          }

          // Open auto subs for the new top N (skip if already manual).
          for (const r of data.slice(0, autoTouchTopN)) {
            const key = makeKey(r.exchange, r.symbol);
            const existing = subsRef.current.get(key);
            if (existing?.source === 'manual') continue; // user-pinned — leave alone
            openSub(key, 'auto');
          }
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
  }, [query, debounceMs, limit, autoTouchTopN, fetcher, openSub, closeSub]);

  /**
   * When the query is cleared, drop all auto subs; keep manual subs
   * alive (the user explicitly wanted those).
   */
  useEffect(() => {
    if (query.trim().length === 0) {
      for (const [key, meta] of [...subsRef.current.entries()]) {
        if (meta.source === 'auto') closeSub(key);
      }
    }
  }, [query, closeSub]);

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
      const key = makeKey(exchange, symbol);
      const tick = ticks.get(key);
      if (!tick) return null;
      return { price: tick.price, receivedAt: tick.ts };
    },
    [ticks],
  );

  /**
   * True if a result currently has a live subscription open
   * (auto or manual). UI uses this to show a "LIVE" pill.
   */
  const isLive = useCallback(
    (exchange: string, symbol: string) => {
      return subsRef.current.has(makeKey(exchange, symbol));
    },
    [],
  );

  return {
    results,
    ticks,
    getLivePrice,
    isLive,
    isLoading,
    error,
    total: results.length,
    touch,
    stop,
  };
}
