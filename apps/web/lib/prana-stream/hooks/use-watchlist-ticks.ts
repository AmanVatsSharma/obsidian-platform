/**
 * File:        apps/web/lib/prana-stream/hooks/use-watchlist-ticks.ts
 * Module:      web/prana-stream/hooks
 * Purpose:     Subscribe to live watchlist tick updates from PranaStream.
 *              Returns a Map keyed by "EXCHANGE:SYMBOL" → Tick.
 *
 * Exports:
 *   - useWatchlistTicks(symbols) — Map<key, Tick>
 *
 * Depends on:
 *   - usePranaStream  — context accessor
 *   - prana-stream/types  — Tick, RealtimeEvent
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

'use client';

import { useEffect, useState } from 'react';
import { usePranaStream } from '../prana-provider';
import type { RealtimeEvent, Tick } from '../types';

const tickKey = (t: { exchange: string; symbol: string }) =>
  `${t.exchange}:${t.symbol}`;

export function useWatchlistTicks(
  symbols: Array<{ exchange: string; symbol: string }>,
): Map<string, Tick> {
  const { client, isReady } = usePranaStream();
  const [ticks, setTicks] = useState<Map<string, Tick>>(new Map());

  useEffect(() => {
    if (!isReady || symbols.length === 0) {
      return;
    }

    client.subscribe({ watchlist: symbols });

    const unsub = client.on<RealtimeEvent<Tick[]>>('watchlist.ticks', (event) => {
      setTicks((prev) => {
        const next = new Map(prev);
        for (const tick of event.data) {
          next.set(tickKey(tick), tick);
        }
        return next;
      });
    });

    return () => {
      unsub();
      client.unsubscribe({ watchlist: symbols });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, JSON.stringify(symbols)]);

  return ticks;
}
