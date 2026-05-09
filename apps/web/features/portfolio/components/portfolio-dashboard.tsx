/**
 * @file portfolio-dashboard.tsx
 * @module web
 * @description Main portfolio view composing summary cards, positions, and holdings tables.
 * @author BharatERP
 * @created 2026-04-16
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@obsidian/obsidian-ui';
import { OPEN_POSITIONS } from '../../trading-terminal/lib/mock-data';
import { HOLDINGS, PORTFOLIO_SUMMARY } from '../lib/mock-data';
import { PnlSummaryCards } from './pnl-summary-cards';
import { PositionsTable } from './positions-table';
import { HoldingsTable } from './holdings-table';

type Tab = 'positions' | 'holdings';

export function PortfolioDashboard() {
  const [tab, setTab] = useState<Tab>('positions');

  return (
    <div className="flex flex-col gap-6" data-testid="portfolio-dashboard">
      <PnlSummaryCards summary={PORTFOLIO_SUMMARY} />

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
                Open Positions ({OPEN_POSITIONS.length})
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
                Holdings ({HOLDINGS.length})
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tab === 'positions' ? (
            <PositionsTable positions={OPEN_POSITIONS} />
          ) : (
            <HoldingsTable holdings={HOLDINGS} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
