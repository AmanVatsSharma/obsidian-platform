/**
 * File:        apps/platform-owner/src/features/revenue/revenue-chart.tsx
 * Module:      platform-owner · Revenue Feature
 * Purpose:     12-month MRR area chart with new business and churn overlays
 *
 * Exports:
 *   - RevenueChart(props) — client component with Recharts AreaChart
 *
 * Key invariants:
 *   - 'use client' required — Recharts uses ResizeObserver
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { RevenuePoint } from '../../lib/types';

interface RevenueChartProps {
  data: RevenuePoint[];
}

function fmtK(v: number) { return `$${(v / 1000).toFixed(0)}K`; }

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4">
      <div className="mb-4">
        <div className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">Monthly Recurring Revenue</div>
        <div className="mt-1 font-mono text-[24px] font-semibold tabular-nums text-fg1">
          {fmtK(data[data.length - 1]?.mrr ?? 0)}
          <span className="ml-2 font-mono text-[13px] text-bull">+6.8%</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="newBizFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10D996" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10D996" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1C2028" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-data)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-data)' }} axisLine={false} tickLine={false} tickFormatter={fmtK} width={46} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-md)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-data)', color: 'var(--fg1)' }}
            formatter={(v: number, name: string) => [fmtK(v), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--font-data)', color: 'var(--fg2)' }} />
          <Area type="monotone" dataKey="mrr"         name="MRR"          stroke="#3B82F6" strokeWidth={2} fill="url(#mrrFill)"    dot={false} activeDot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }} />
          <Area type="monotone" dataKey="newBusiness" name="New Business" stroke="#10D996" strokeWidth={2} fill="url(#newBizFill)" dot={false} activeDot={{ r: 4, fill: '#10D996', strokeWidth: 0 }} />
          <Area type="monotone" dataKey="churn"       name="Churn"        stroke="#FF3B5C" strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 3" activeDot={{ r: 4, fill: '#FF3B5C', strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
