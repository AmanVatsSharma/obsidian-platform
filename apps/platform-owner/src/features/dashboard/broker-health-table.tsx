/**
 * File:        apps/platform-owner/src/features/dashboard/broker-health-table.tsx
 * Module:      platform-owner · Dashboard Feature
 * Purpose:     Top 5 brokers by AUM with health score bar and status badge
 *
 * Exports:
 *   - BrokerHealthTable(props) — server-compatible presentational table
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — cn()
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { cn } from '@obsidian/obsidian-ui';
import type { Broker } from '../../lib/types';

interface BrokerHealthTableProps {
  brokers: Broker[];
}

const PLAN_COLORS: Record<string, string> = {
  ENTERPRISE: 'text-purple border-purple/30 bg-purple/10',
  PRO:        'text-accent border-accent/30 bg-accent/10',
  GROWTH:     'text-bull  border-bull/30  bg-bull/10',
  STARTER:    'text-fg3   border-[var(--border)] bg-[var(--bg-elevated)]',
};

function fmtAum(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

export function BrokerHealthTable({ brokers }: BrokerHealthTableProps) {
  const top5 = [...brokers].sort((a, b) => b.aum - a.aum).slice(0, 5);

  return (
    <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">
          Top Brokers by AUM
        </span>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {top5.map((broker) => (
          <div key={broker.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors">
            <span className="font-mono text-[13px]">{broker.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-ui text-[13px] text-fg1">{broker.name}</span>
                <span className={cn('rounded-full border px-1.5 font-mono text-[9px] uppercase tracking-wider', PLAN_COLORS[broker.plan])}>
                  {broker.plan}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1 flex-1 rounded-full bg-[var(--bg-elevated)]">
                  <div
                    className={cn(
                      'h-1 rounded-full transition-all',
                      broker.healthScore >= 80 ? 'bg-bull' : broker.healthScore >= 60 ? 'bg-warn' : 'bg-bear',
                    )}
                    style={{ width: `${broker.healthScore}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-fg3 w-7 text-right">{broker.healthScore}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[13px] tabular-nums text-fg1">{fmtAum(broker.aum)}</div>
              <div className={cn('font-mono text-[10px] tabular-nums', broker.growth >= 0 ? 'text-bull' : 'text-bear')}>
                {broker.growth >= 0 ? '+' : ''}{broker.growth.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
