/**
 * File:        apps/desktop-pro/renderer/src/features/workstation/detached-chart-page.tsx
 * Module:      desktop-pro · Renderer · Workstation · Detached Chart Page
 * Purpose:     Standalone renderer page for a chart panel torn off into its own BrowserWindow.
 *              Reads the symbol from the hash route, subscribes to the main-process price feed,
 *              and renders just the ChartPanel (no full workstation).
 *
 * Exports:
 *   - DetachedChartPage → ReactNode   — chart-only page (route /detached/chart/:symbol)
 *
 * Depends on:
 *   - react-router-dom — useParams
 *   - @obsidian/trading-ui — ChartPanel, INSTRUMENTS, Instrument
 *   - ../../shared/bridge/use-price-feed — usePriceFeed
 *
 * Side-effects:
 *   - Subscribes to ntBridge.feed.subscribe(symbol) on mount; unsubscribes on unmount
 *
 * Key invariants:
 *   - The main process PriceFeedService broadcasts to ALL open windows — this page receives
 *     the same ticks as the main workstation at zero extra backend cost
 *   - prices map is seeded from INSTRUMENTS on first render, then updated by live ticks
 *
 * Read order:
 *   1. DetachedChartPage — params + price state + render
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChartPanel, INSTRUMENTS, type Instrument } from '@obsidian/trading-ui';
import { usePriceFeed } from '../../shared/bridge/use-price-feed';

export function DetachedChartPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const safeSymbol = symbol ?? 'EURUSD';

  const instrument: Instrument | null =
    INSTRUMENTS.find((i) => i.symbol === safeSymbol) ?? INSTRUMENTS[0] ?? null;

  const [prices, setPrices] = useState<Record<string, Instrument>>(() =>
    Object.fromEntries(INSTRUMENTS.map((i) => [i.symbol, { ...i }])),
  );

  const { tick } = usePriceFeed(safeSymbol);

  useEffect(() => {
    if (!tick) return;
    setPrices((prev) => ({
      ...prev,
      [tick.symbol]: {
        ...(prev[tick.symbol] ?? instrument ?? INSTRUMENTS[0]!),
        bid: tick.bid,
        ask: tick.ask,
        change: tick.change,
      },
    }));
  }, [tick, instrument]);

  return (
    <div className="detached-chart-page">
      <ChartPanel instrument={instrument} prices={prices} />
    </div>
  );
}
