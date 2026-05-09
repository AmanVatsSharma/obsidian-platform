/**
 * File:        apps/platform-owner/src/features/dashboard/revenue-sparkline.tsx
 * Module:      platform-owner · Dashboard Feature
 * Purpose:     30-day MRR sparkline using Recharts AreaChart
 *
 * Exports:
 *   - RevenueSparkline(props) — client component rendering 12-month area chart
 *
 * Depends on:
 *   - recharts — AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
 *
 * Key invariants:
 *   - 'use client' required — Recharts uses ResizeObserver
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { RevenuePoint } from '../../lib/types';

interface RevenueSparklineProps {
  data: RevenuePoint[];
}

function fmtK(v: number) {
  return `$${(v / 1000).toFixed(0)}K`;
}

export function RevenueSparkline({ data }: RevenueSparklineProps) {
  return (
    <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">
            MRR — 12 Months
          </div>
          <div className="mt-1 font-mono text-[22px] font-semibold tabular-nums text-fg1">
            {fmtK(data[data.length - 1]?.mrr ?? 0)}
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-bull/10 px-2 py-0.5 font-mono text-[11px] text-bull">
          +6.8% MoM
        </span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1C2028" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-data)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-data)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtK}
            width={42}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-md)',
              borderRadius: 6,
              fontSize: 11,
              fontFamily: 'var(--font-data)',
              color: 'var(--fg1)',
            }}
            formatter={(v: number) => [fmtK(v), 'MRR']}
          />
          <Area
            type="monotone"
            dataKey="mrr"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#mrrGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
