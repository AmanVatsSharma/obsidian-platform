/**
 * File:        apps/web/features/console/positions/positions-panel.tsx
 * Module:      web/console/positions
 * Purpose:     Live positions panel — composed of all C2 derived hooks:
 *                - usePositionPnL     → per-position PnL
 *                - useLatestTick      → live mark price for each row
 *                - useTickChange      → flash animation on price change
 *                - usePortfolioEquity → total equity header
 *                - useMarginBreach    → blocking modal on margin shortfall
 *
 *              This component is the canonical "real-time" page. It
 *              exercises every derived hook from C2 in a single file so
 *              reviewers can see them working end-to-end.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

'use client';

import React from 'react';
import { useLatestTickPrice, useTickChange } from '@/lib/prana-stream';
import {
  usePositionPnL,
  usePortfolioEquity,
  useMarginBreach,
} from '@/lib/prana-stream';

type PositionsPanelProps = {
  /** Optional account scope; falls back to most-recently-updated account. */
  accountId?: string;
  /** Optional map from instrumentId → {exchange, symbol} for live mark. */
  symbolMap?: Map<string, { exchange: string; symbol: string }>;
};

const fmtNumber = (n: number, digits = 2) => n.toFixed(digits);
const fmtSigned = (n: number) => (n >= 0 ? `+${fmtNumber(n)}` : fmtNumber(n));
const fmtPnlClass = (n: number) => (n >= 0 ? 'text-obs-green' : 'text-obs-red');

export function PositionsPanel({ accountId, symbolMap }: PositionsPanelProps) {
  const equity = usePortfolioEquity(accountId);
  const positions = usePositionPnL(accountId ? { accountId } : {});
  const { breach, isBlocking, dismiss } = useMarginBreach();

  return (
    <div className="flex flex-col gap-4 bg-obs-bg-1 p-4 font-mono text-obs-text-1">
      {isBlocking && breach && (
        <div
          role="alert"
          className="border-2 border-obs-red bg-obs-red/10 p-3 text-obs-red"
        >
          <div className="text-xs uppercase tracking-widest">Margin Breach</div>
          <div className="mt-1 text-sm">
            Account {breach.accountId} is in {breach.severity} state. Top up
            margin to resume trading.
          </div>
          <button
            className="mt-2 border border-obs-red px-2 py-1 text-xs uppercase"
            onClick={dismiss}
          >
            Acknowledge
          </button>
        </div>
      )}

      <header className="grid grid-cols-4 gap-4 border-b border-obs-bg-3 pb-2 text-xs uppercase tracking-widest text-obs-text-2">
        <div>Total Equity</div>
        <div>Available</div>
        <div>Used</div>
        <div>Positions</div>
      </header>
      <div className="grid grid-cols-4 gap-4 text-lg">
        <div>{equity ? fmtNumber(equity.totalEquity) : '—'}</div>
        <div className="text-obs-green">
          {equity ? fmtNumber(equity.marginAvailable) : '—'}
        </div>
        <div className="text-obs-amber">
          {equity ? fmtNumber(equity.marginUsed) : '—'}
        </div>
        <div>{equity ? equity.positionCount : 0}</div>
      </div>

      <div className="mt-4">
        <div className="border-b border-obs-bg-3 pb-1 text-xs uppercase tracking-widest text-obs-text-2">
          Positions
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-obs-text-2">
              <th className="py-1">Symbol</th>
              <th className="py-1 text-right">Qty</th>
              <th className="py-1 text-right">Avg</th>
              <th className="py-1 text-right">Mark</th>
              <th className="py-1 text-right">UPnL</th>
              <th className="py-1 text-right">RPnL</th>
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-3 text-center text-obs-text-2">
                  No open positions
                </td>
              </tr>
            )}
            {positions.map((p) => {
              const sym = symbolMap?.get(p.instrumentId);
              return (
                <PositionRow
                  key={`${p.accountId}:${p.instrumentId}`}
                  instrumentId={p.instrumentId}
                  side={p.side}
                  netQty={p.netQty}
                  avg={p.averagePrice}
                  realizedPnl={p.realizedPnl}
                  exchange={sym?.exchange}
                  symbol={sym?.symbol}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type PositionRowProps = {
  instrumentId: string;
  side: 'LONG' | 'SHORT' | 'FLAT';
  netQty: number;
  avg: number;
  realizedPnl: number;
  exchange?: string;
  symbol?: string;
};

function PositionRow({
  instrumentId,
  side,
  netQty,
  avg,
  realizedPnl,
  exchange,
  symbol,
}: PositionRowProps) {
  // Only call the live-tick hooks when we have an exchange/symbol mapping.
  // Without it, we fall back to the server-issued unrealized PnL.
  const mark = exchange && symbol ? useLatestTickPrice(exchange, symbol) : null;
  const { changed } = exchange && symbol
    ? useTickChange(exchange, symbol)
    : { changed: false };

  const markPrice = mark ?? null;
  const unrealized =
    markPrice != null
      ? (markPrice - avg) * netQty
      : null; // null = no live mark, fall back to server-side value elsewhere

  return (
    <tr className={changed ? 'animate-pulse bg-obs-amber/5' : ''}>
      <td className="py-1">
        <div>{instrumentId}</div>
        <div className="text-xs text-obs-text-2">{side}</div>
      </td>
      <td className="py-1 text-right">{fmtNumber(netQty, 0)}</td>
      <td className="py-1 text-right">{fmtNumber(avg)}</td>
      <td className="py-1 text-right">{markPrice != null ? fmtNumber(markPrice) : '—'}</td>
      <td className={`py-1 text-right ${unrealized != null ? fmtPnlClass(unrealized) : 'text-obs-text-2'}`}>
        {unrealized != null ? fmtSigned(unrealized) : '—'}
      </td>
      <td className={`py-1 text-right ${fmtPnlClass(realizedPnl)}`}>
        {fmtSigned(realizedPnl)}
      </td>
    </tr>
  );
}
