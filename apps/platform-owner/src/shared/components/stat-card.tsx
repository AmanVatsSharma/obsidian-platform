/**
 * File:        apps/platform-owner/src/shared/components/stat-card.tsx
 * Module:      platform-owner · Shared Components
 * Purpose:     KPI metric card with value, label, and bull/bear delta indicator
 *
 * Exports:
 *   - StatCard(props: StatCardProps) — presentational card component
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — cn()
 *   - lucide-react           — TrendingUp, TrendingDown
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';

export interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  subtext?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, delta, deltaPositive, subtext, icon }: StatCardProps) {
  return (
    <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="font-display text-[10px] font-semibold tracking-[0.08em] text-fg3 uppercase">
          {label}
        </span>
        {icon && (
          <span className="text-fg3">{icon}</span>
        )}
      </div>
      <div className="font-mono text-[28px] font-semibold tabular-nums text-fg1 leading-none">
        {value}
      </div>
      <div className="flex items-center gap-2">
        {delta !== undefined && (
          <span
            className={cn(
              'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-mono text-[11px] font-medium',
              deltaPositive
                ? 'bg-bull/10 text-bull'
                : 'bg-bear/10 text-bear',
            )}
          >
            {deltaPositive
              ? <TrendingUp size={11} strokeWidth={2} />
              : <TrendingDown size={11} strokeWidth={2} />
            }
            {delta}
          </span>
        )}
        {subtext && (
          <span className="font-ui text-[11px] text-fg3">{subtext}</span>
        )}
      </div>
    </div>
  );
}
