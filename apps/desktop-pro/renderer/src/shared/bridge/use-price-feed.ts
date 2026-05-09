/**
 * File:        apps/desktop-pro/renderer/src/shared/bridge/use-price-feed.ts
 * Module:      desktop-pro · Renderer · Price Feed Hook
 * Purpose:     React hook that subscribes to live price ticks for a symbol via ntBridge.feed.subscribe.
 *
 * Exports:
 *   - usePriceFeed(symbol) → { tick: PriceTick | null }
 *   - PriceTick — tick payload shape from the main process
 *
 * Depends on:
 *   - react — useEffect, useState
 *   - ./nt-bridge.d.ts — window.ntBridge type
 *
 * Side-effects:
 *   - Subscribes to a price feed channel on mount; unsubscribes on unmount
 *
 * Key invariants:
 *   - Cleanup function returned by ntBridge.feed.subscribe must be called on unmount
 *   - Returns null before first tick arrives
 *
 * Read order:
 *   1. PriceTick — payload type
 *   2. usePriceFeed — hook implementation
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { useEffect, useState } from 'react';

export type PriceTick = {
  symbol: string;
  bid: number;
  ask: number;
  change: number;
  changePct: number;
  timestamp: number;
};

export function usePriceFeed(symbol: string | null): { tick: PriceTick | null } {
  const [tick, setTick] = useState<PriceTick | null>(null);

  useEffect(() => {
    if (!symbol || !window.ntBridge) return;
    const cleanup = window.ntBridge.feed.subscribe(symbol, (raw) => {
      setTick(raw as PriceTick);
    });
    return cleanup;
  }, [symbol]);

  return { tick };
}
