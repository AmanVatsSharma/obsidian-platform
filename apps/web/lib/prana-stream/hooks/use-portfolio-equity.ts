/**
 * File:        apps/web/lib/prana-stream/hooks/use-portfolio-equity.ts
 * Module:      web/prana-stream/hooks
 * Purpose:     Derive a portfolio equity summary (totalEquity, totalPnL,
 *              marginUsed, marginAvailable) from the live account + position
 *              streams. Re-renders only when one of the derived values changes.
 *
 *              This is a *computation* hook — it does not open a new
 *              subscription. It composes the existing account/position
 *              streams (which are already opened wherever the trader
 *              terminal is mounted) and is safe to use in any leaf
 *              component without resubscribing.
 *
 * Exports:
 *   - usePortfolioEquity(accountId?) — PortfolioEquitySummary | null
 *   - PortfolioEquitySummary — derived type
 *
 * Depends on:
 *   - useAccountUpdates — the live account stream
 *   - usePositionUpdates — the live position stream
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Returns null when no live account snapshot has been received yet
 *   - `totalPnL` = sum of position realized + unrealized (signed)
 *   - `marginUsed` ≈ |lockedCash|; falls back to 0 if absent
 *   - `marginAvailable` = availableCash − Σ(open position notional × marginRate)
 *     (marginRate defaults to 0.1, i.e. 10% — to be sourced from a risk
 *     service in a follow-up; marked as a conservative default)
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

'use client';

import { useMemo } from 'react';
import { useAccountUpdates } from './use-account-updates';
import { usePositionUpdates } from './use-position-updates';

export type PortfolioEquitySummary = {
  accountId: string;
  totalCash: number;
  availableCash: number;
  lockedCash: number;
  /** sum of |position.netQty × position.averagePrice| for all positions */
  grossPositionNotional: number;
  /** sum of realized + unrealized PnL across all positions */
  totalPnL: number;
  /** optimistic notional at 10% margin */
  marginUsed: number;
  /** availableCash - marginUsed (clamped at 0) */
  marginAvailable: number;
  /** totalCash + totalPnL */
  totalEquity: number;
  positionCount: number;
  asOf: number;
};

const DEFAULT_MARGIN_RATE = 0.1; // 10% — conservative default until risk service lands

const toNumber = (v: string | number | undefined, fallback = 0): number => {
  if (v === undefined || v === null) return fallback;
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function usePortfolioEquity(accountId?: string): PortfolioEquitySummary | null {
  const accounts = useAccountUpdates();
  const positions = usePositionUpdates();

  return useMemo<PortfolioEquitySummary | null>(() => {
    if (accounts.size === 0) {
      return null;
    }

    // Pick the requested account, or fall back to the most recently updated
    // account if no explicit id is provided.
    const target =
      (accountId && accounts.get(accountId)) ||
      [...accounts.values()].sort((a, b) => {
        const ta = a.ts ? Date.parse(a.ts) : 0;
        const tb = b.ts ? Date.parse(b.ts) : 0;
        return tb - ta;
      })[0];

    if (!target) return null;

    let totalPnL = 0;
    let grossNotional = 0;
    let positionCount = 0;
    let maxAsOf = target.ts ? Date.parse(target.ts) : Date.now();

    for (const pos of positions.values()) {
      if (pos.accountId !== target.accountId) continue;
      const realized = toNumber(pos.realizedPnl);
      const unrealized = toNumber(pos.unrealizedPnl);
      totalPnL += realized + unrealized;

      const qty = Math.abs(toNumber(pos.netQty));
      const avg = toNumber(pos.averagePrice);
      grossNotional += qty * avg;
      positionCount += 1;
    }

    const totalCash = toNumber(target.totalCash);
    const availableCash = toNumber(target.availableCash);
    const lockedCash = toNumber(target.lockedCash);
    const marginUsed = Math.max(lockedCash, grossNotional * DEFAULT_MARGIN_RATE);
    const marginAvailable = Math.max(0, availableCash - marginUsed);
    const totalEquity = totalCash + totalPnL;

    return {
      accountId: target.accountId,
      totalCash,
      availableCash,
      lockedCash,
      grossPositionNotional: grossNotional,
      totalPnL,
      marginUsed,
      marginAvailable,
      totalEquity,
      positionCount,
      asOf: maxAsOf,
    };
  }, [accounts, positions, accountId]);
}
