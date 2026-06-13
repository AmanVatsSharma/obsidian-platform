/**
 * File:        apps/web/features/console/watchlist/watchlist-row.tsx
 * Module:      web/console/watchlist
 * Purpose:     A single watchlist row that flashes when the price changes.
 *              Consumes the live tick store to avoid duplicate subscriptions
 *              when 20 components watch the same symbol.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

'use client';

import React from 'react';
import { useLatestTickPrice, useTickChange } from '@/lib/prana-stream';

type WatchlistRowProps = {
  exchange: string;
  symbol: string;
  onChange?: (tick: { price: number; change: number }) => void;
};

export function WatchlistRow({ exchange, symbol, onChange }: WatchlistRowProps) {
  const price = useLatestTickPrice(exchange, symbol);
  const { changed, tick } = useTickChange(exchange, symbol);

  React.useEffect(() => {
    if (onChange && tick) {
      // Forward price changes to parent (e.g., update chart marker)
      onChange({ price: tick.price, change: tick.change });
    }
  }, [tick, onChange]);

  return (
    <tr className={changed ? 'animate-pulse bg-obs-amber/10' : ''}>
      <td className="py-2 text-xs text-obs-text-2">{symbol}</td>
      <td className="py-2 text-right font-semibold">
        {price != null ? `$${price.toFixed(2)}` : '—'}
      </td>
      <td className="py-2 text-right">
        {tick?.change != null ? (
          <span
            className={
              tick.change >= 0 ? 'text-obs-green' : 'text-obs-red'
            }
          >
            {tick.change >= 0 ? '+' : ''}{(tick.change * 100).toFixed(2)}%
          </span>
        ) : (
          <span className="text-obs-text-2">—</span>
        )}
      </td>
    </tr>
  );
}
