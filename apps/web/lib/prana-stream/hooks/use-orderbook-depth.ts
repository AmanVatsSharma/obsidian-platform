/**
 * File:        apps/web/lib/prana-stream/hooks/use-orderbook-depth.ts
 * Module:      web/prana-stream/hooks
 * Purpose:     Subscribe to order book depth for a symbol.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

'use client';

import { useEffect, useState } from 'react';
import { usePranaStream } from '../prana-provider';
import type { OrderBookFrame } from '../types';

export function useOrderBookDepth(
  exchange: string,
  symbol: string,
): OrderBookFrame | null {
  const { client, isReady } = usePranaStream();
  const [frame, setFrame] = useState<OrderBookFrame | null>(null);

  useEffect(() => {
    if (!isReady || !exchange || !symbol) return null;
    client.subscribeOrderBook(exchange, symbol);

    const unsub = client.on<OrderBookFrame>('orderbook.depth', (f) => {
      setFrame(f);
    });

    return () => {
      unsub();
      client.unsubscribeOrderBook(exchange, symbol);
    };
  }, [isReady, exchange, symbol, client]);

  return frame;
}