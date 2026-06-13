/**
 * @file portfolio-dashboard.tsx
 * @module web
 * @description Main portfolio view composing summary cards, positions, and holdings tables.
 *              Powered by PranaStream streams via usePositionPnL and usePortfolioEquity.
 * @author BharatERP
 * @created 2026-04-16
 * @last-updated 2026-06-12
 */

'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@obsidian/obsidian-ui';
import { usePositionPnL, usePortfolioEquity } from '@/lib/prana-stream';
import type { PortfolioSummary } from '../lib/types';
import { PnlSummaryCards } from './pnl-summary-cards';
import { PositionsTable } from './positions-table';
import { HoldingsTable } from './holdings-table';

type Tab = 'positions' | 'holdings';

export function PortfolioDashboard() {
  const [tab, setTab] = useState<Tab>('positions');
  const accountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID ?? '';

  // ── Live PranaStream data ───────────────────────────────────────────────
  const positions = usePositionPnL(accountId ? { accountId } : {});
  const equity = usePortfolioEquity(accountId || undefined);

  // Derive a portfolio summary from the live equity + positions streams.
  // All values are recomputed on every PranaStream event.
  const summary: PortfolioSummary = useMemo(
    () => ({
      totalEquity: equity?.totalEquity ?? 0,
      dayPnl: equity?.totalPnL ?? 0,
      dayPnlPct:
        equity && equity.totalCash > 0
          ? ((equity.totalPnL / equity.totalCash) * 100)
          : 0,
      unrealizedPnl: equity?.totalPnL ?? 0,
      unrealizedPnlPct:
        equity && equity.totalCash > 0
          ? ((equity.totalPnL / equity.totalCash) * 100)
          : 0,
      freeMargin: equity?.marginAvailable ?? 0,
      marginUsed: equity?.marginUsed ?? 0,
    }),
    [equity],
  );

  // Map PranaStream PositionPnL[] → PositionsTable's OpenPosition[] shape.
  // The table expects the trading-ui OpenPosition type with lots, openPrice,
  // currentPrice, pnl, etc. We pass through what the live data provides and
  // backfill zeros where PranaStream hasn't sent an event yet.
  const openPositions = useMemo(
    () =>
      positions.map((p) => ({
        id: p.instrumentId,
        symbol: p.instrumentId,
        type: p.side === 'SHORT' ? 'SELL' : 'BUY',
        lots: Math.abs(p.netQty),
        openPrice: p.averagePrice,
        // markPrice is null until a tick arrives; fall back to averagePrice
        // for the table's display. The cell shows the mark when live.
        currentPrice: p.markPrice ?? p.averagePrice,
        pnl: p.unrealizedPnl,
        pnlPct:
          p.averagePrice > 0 ? (p.unrealizedPnl / (p.averagePrice * Math.abs(p.netQty))) * 100 : 0,
        // Map sl/tp to empty (not tracked in position data yet)
        sl: '',
        tp: '',
        swap: 0,
        commission: 0,
        openTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        margin: 0,
      })),
    [positions],
  );

  return (
    <div className="flex flex-col gap-6" data-testid="portfolio-dashboard">
      <PnlSummaryCards summary={summary} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle className="text-base">Portfolio</CardTitle>
            <div className="flex gap-1 rounded-obs bg-obsidian-muted p-0.5">
              <button
                data-testid="tab-positions"
                onClick={() => setTab('positions')}
                className={`rounded-obs-sm px-3 py-1 text-xs font-medium transition-colors ${
                  tab === 'positions'
                    ? 'bg-obsidian-elevated text-obsidian-primary shadow-obs-sm'
                    : 'text-obsidian-secondary hover:text-obsidian-primary'
                }`}
              >
                Open Positions ({openPositions.length})
              </button>
              <button
                data-testid="tab-holdings"
                onClick={() => setTab('holdings')}
                className={`rounded-obs-sm px-3 py-1 text-xs font-medium transition-colors ${
                  tab === 'holdings'
                    ? 'bg-obsidian-elevated text-obsidian-primary shadow-obs-sm'
                    : 'text-obsidian-secondary hover:text-obsidian-primary'
                }`}
              >
                Holdings ({positions.length})
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tab === 'positions' ? (
            <PositionsTable positions={openPositions} />
          ) : (
            <HoldingsTable
              holdings={positions.map((p) => ({
                symbol: p.instrumentId,
                name: p.instrumentId,
                quantity: p.netQty,
                avgCost: p.averagePrice,
                currentPrice: p.markPrice ?? p.averagePrice,
                value: p.averagePrice * Math.abs(p.netQty),
                allocationPct: 0,
                changePct: p.averagePrice > 0
                  ? ((p.markPrice ?? p.averagePrice) - p.averagePrice) / p.averagePrice * 100
                  : 0,
              }))}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
