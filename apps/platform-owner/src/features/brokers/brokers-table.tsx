/**
 * File:        apps/platform-owner/src/features/brokers/brokers-table.tsx
 * Module:      platform-owner · Brokers Feature
 * Purpose:     Full 14-row sortable broker table with plan badge, health score, and AUM
 *
 * Exports:
 *   - BrokersTable(props) — client component with sort state
 *
 * Depends on:
 *   - ./broker-status-badge  — BrokerStatusBadge, PlanBadge
 *   - @obsidian/obsidian-ui — cn()
 *   - lucide-react           — ArrowUpDown, ChevronUp, ChevronDown
 *   - next/link              — Link
 *
 * Key invariants:
 *   - 'use client' required for sort state
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';
import { BrokerStatusBadge, PlanBadge } from './broker-status-badge';
import type { Broker } from '../../lib/types';

type SortKey = 'name' | 'plan' | 'clients' | 'aum' | 'rev' | 'growth' | 'healthScore';

function fmtAum(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

const COLS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'name',        label: 'Broker' },
  { key: 'plan',        label: 'Plan' },
  { key: 'clients',     label: 'Clients',   align: 'right' },
  { key: 'aum',         label: 'AUM',       align: 'right' },
  { key: 'rev',         label: 'Rev/Mo',    align: 'right' },
  { key: 'growth',      label: 'Growth',    align: 'right' },
  { key: 'healthScore', label: 'Health',    align: 'right' },
];

interface BrokersTableProps {
  brokers: Broker[];
}

export function BrokersTable({ brokers }: BrokersTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('aum');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = [...brokers].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  return (
    <div className="overflow-x-auto rounded-r-lg border border-[var(--border)]">
      <table className="w-full text-left">
        <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <tr>
            {COLS.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3 cursor-pointer select-none whitespace-nowrap',
                  col.align === 'right' && 'text-right',
                )}
                onClick={() => toggleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortKey === col.key
                    ? sortDir === 'asc'
                      ? <ChevronUp size={11} strokeWidth={2} className="text-accent" />
                      : <ChevronDown size={11} strokeWidth={2} className="text-accent" />
                    : <ArrowUpDown size={11} strokeWidth={2} className="text-fg4" />
                  }
                </span>
              </th>
            ))}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-panel)]">
          {sorted.map((broker) => (
            <tr key={broker.id} className="hover:bg-[var(--bg-hover)] transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px]">{broker.flag}</span>
                  <div>
                    <div className="font-ui text-[13px] text-fg1">{broker.name}</div>
                    <div className="font-mono text-[10px] text-fg3">{broker.city} · {broker.am}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><PlanBadge plan={broker.plan} /></td>
              <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-fg1">
                {broker.clients.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-fg1">
                {fmtAum(broker.aum)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[13px] tabular-nums text-fg1">
                ${broker.rev.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                <span className={cn('font-mono text-[13px] tabular-nums', broker.growth >= 0 ? 'text-bull' : 'text-bear')}>
                  {broker.growth >= 0 ? '+' : ''}{broker.growth.toFixed(1)}%
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <div className="h-1.5 w-20 rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className={cn(
                        'h-1.5 rounded-full',
                        broker.healthScore >= 80 ? 'bg-bull' : broker.healthScore >= 60 ? 'bg-warn' : 'bg-bear',
                      )}
                      style={{ width: `${broker.healthScore}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-fg2 w-7 text-right">{broker.healthScore}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <BrokerStatusBadge status={broker.status} />
                  <Link
                    href={`/brokers/${broker.id}`}
                    className="rounded-r-sm border border-[var(--border)] px-2 py-1 font-mono text-[10px] text-fg3 hover:border-accent hover:text-accent transition-colors"
                  >
                    View
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
