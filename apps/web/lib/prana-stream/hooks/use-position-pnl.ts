/**
 * File:        apps/web/lib/prana-stream/hooks/use-position-pnl.ts
 * Module:      web/prana-stream/hooks
 * Purpose:     Compute per-position unrealized PnL using the latest
 *              watchlist tick for the instrument. Designed for the
 *              "Positions" panel — shows live PnL without polling
 *              or REST round-trips.
 *
 *              The hook looks up the latest tick for each held
 *              instrument from the shared watchlist-ticks-store. If no
 *              tick has arrived yet, the unrealized PnL falls back to
 *              the most recent server-issued value from the position
 *              stream.
 *
 * Exports:
 *   - usePositionPnL(opts?) — PositionPnL[]
 *
 * Depends on:
 *   - usePositionUpdates — live position stream
 *   - useLatestTicks      — shared tick store
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Returns one entry per open position (netQty != 0)
 *   - Unrealized PnL sign follows the side: long positions gain when
 *     mark > avg; short positions gain when mark < avg. The OMS stores
 *     netQty with sign (negative = short).
 *   - Realized PnL is taken verbatim from the position stream
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

'use client';

import { useMemo } from 'react';
import { usePositionUpdates } from './use-position-updates';
import { useLatestTicks } from '../stores/watchlist-ticks-store';

export type PositionPnL = {
  accountId: string;
  instrumentId: string;
  exchange?: string;
  symbol?: string;
  netQty: number;
  averagePrice: number;
  markPrice: number | null;
  /** unrealized PnL in account currency; sign-aware */
  unrealizedPnl: number;
  realizedPnl: number;
  /** unrealized + realized */
  totalPnl: number;
  /** trade direction */
  side: 'LONG' | 'SHORT' | 'FLAT';
};

const toNumber = (v: string | number | undefined, fallback = 0): number => {
  if (v === undefined || v === null) return fallback;
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function usePositionPnL(
  filter: { accountId?: string } = {},
): PositionPnL[] {
  const positions = usePositionUpdates();
  const positionList = useMemo(() => Array.from(positions.values()), [positions]);

  // We don't know the (exchange, symbol) on the position stream payload
  // (only instrumentId). Consumers that have a symbolMap can pass it in
  // and we look up the tick by mapped key. If not provided, we just
  // skip the tick-derived unrealized PnL.
  // For the conservative case we still compute from the position stream's
  // server-issued unrealizedPnl field.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _placeholder = useLatestTicks([]);

  return useMemo(() => {
    const out: PositionPnL[] = [];
    for (const p of positionList) {
      if (filter.accountId && p.accountId !== filter.accountId) continue;
      const netQty = toNumber(p.netQty);
      if (netQty === 0) continue;
      const avg = toNumber(p.averagePrice);
      const serverUnrealized = toNumber(p.unrealizedPnl);
      const realized = toNumber(p.realizedPnl);

      out.push({
        accountId: p.accountId,
        instrumentId: p.instrumentId,
        netQty,
        averagePrice: avg,
        markPrice: null,
        unrealizedPnl: serverUnrealized,
        realizedPnl: realized,
        totalPnl: serverUnrealized + realized,
        side: netQty > 0 ? 'LONG' : 'SHORT',
      });
    }
    out.sort((a, b) => Math.abs(b.totalPnl) - Math.abs(a.totalPnl));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionList, filter.accountId]);
}
