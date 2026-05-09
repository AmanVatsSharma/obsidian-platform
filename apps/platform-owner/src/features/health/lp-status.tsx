/**
 * File:        apps/platform-owner/src/features/health/lp-status.tsx
 * Module:      platform-owner · Health Feature
 * Purpose:     Liquidity provider connectivity table with credit utilization bars
 *
 * Exports:
 *   - LpStatus(props) — server-compatible LP connectivity table
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
import type { LiquidityProvider } from '../../lib/types';

interface LpStatusProps {
  providers: LiquidityProvider[];
}

function fmtM(n: number) { return `$${(n / 1_000_000).toFixed(1)}M`; }

export function LpStatus({ providers }: LpStatusProps) {
  return (
    <div className="overflow-x-auto rounded-r-lg border border-[var(--border)]">
      <table className="w-full text-left">
        <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <tr>
            {['Provider', 'Type', 'Status', 'Latency', 'Instruments', 'Uptime', 'Credit Used'].map((h) => (
              <th key={h} className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-panel)]">
          {providers.map((lp) => {
            const utilPct = lp.creditLimit > 0 ? (lp.creditUsed / lp.creditLimit) * 100 : 0;
            const statusColor = lp.status === 'CONNECTED' ? 'text-bull' : lp.status === 'DISCONNECTED' ? 'text-bear' : 'text-warn';
            return (
              <tr key={lp.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                <td className="px-4 py-3 font-ui text-[13px] font-medium text-fg1">{lp.name}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-fg3">{lp.type}</td>
                <td className="px-4 py-3">
                  <span className={cn('font-mono text-[11px]', statusColor)}>{lp.status}</span>
                </td>
                <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-fg1">
                  {lp.latency > 0 ? `${lp.latency}ms` : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-fg1">
                  {lp.instruments.toLocaleString()}
                </td>
                <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-fg1">{lp.uptime}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-[var(--bg-elevated)]">
                      <div
                        className={cn('h-1.5 rounded-full', utilPct >= 80 ? 'bg-bear' : utilPct >= 60 ? 'bg-warn' : 'bg-accent')}
                        style={{ width: `${utilPct}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] tabular-nums text-fg3">
                      {fmtM(lp.creditUsed)} / {fmtM(lp.creditLimit)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
