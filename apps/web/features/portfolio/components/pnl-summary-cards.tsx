/**
 * @file pnl-summary-cards.tsx
 * @module web
 * @description Four summary cards showing equity, day P&L, unrealized P&L, and free margin.
 * @author BharatERP
 * @created 2026-04-16
 */

import { Card, CardContent } from '@obsidian/obsidian-ui';
import type { PortfolioSummary } from '../lib/types';
import { fmt, pnlSign } from '../../trading-terminal/lib/format-utils';

function pnlColor(n: number) {
  return n >= 0 ? 'text-[var(--bull)]' : 'text-[var(--bear)]';
}

export function PnlSummaryCards({ summary }: { summary: PortfolioSummary }) {
  const cards = [
    { label: 'Total Equity', value: `$${fmt(summary.totalEquity)}`, sub: null },
    {
      label: 'Day P&L',
      value: `${pnlSign(summary.dayPnl)}$${fmt(Math.abs(summary.dayPnl))}`,
      sub: `${pnlSign(summary.dayPnlPct)}${fmt(Math.abs(summary.dayPnlPct))}%`,
      color: pnlColor(summary.dayPnl),
    },
    {
      label: 'Unrealized P&L',
      value: `${pnlSign(summary.unrealizedPnl)}$${fmt(Math.abs(summary.unrealizedPnl))}`,
      sub: `${pnlSign(summary.unrealizedPnlPct)}${fmt(Math.abs(summary.unrealizedPnlPct))}%`,
      color: pnlColor(summary.unrealizedPnl),
    },
    { label: 'Free Margin', value: `$${fmt(summary.freeMargin)}`, sub: `Used: $${fmt(summary.marginUsed)}` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="pnl-summary-cards">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-obsidian-faint">{c.label}</p>
            <p className={`mt-1 font-mono text-xl font-semibold ${c.color ?? 'text-obsidian-primary'}`}>
              {c.value}
            </p>
            {c.sub && (
              <p className={`mt-0.5 font-mono text-xs ${c.color ?? 'text-obsidian-secondary'}`}>{c.sub}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
