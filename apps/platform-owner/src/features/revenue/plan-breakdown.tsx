/**
 * File:        apps/platform-owner/src/features/revenue/plan-breakdown.tsx
 * Module:      platform-owner · Revenue Feature
 * Purpose:     Plan revenue breakdown with PieChart and summary table
 *
 * Exports:
 *   - PlanBreakdown(props) — client component with Recharts PieChart
 *
 * Key invariants:
 *   - 'use client' required — Recharts uses ResizeObserver
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PlanRevenueSplit } from '../../lib/types';

const PLAN_COLORS: Record<string, string> = {
  ENTERPRISE: '#A855F7',
  PRO:        '#3B82F6',
  GROWTH:     '#10D996',
  STARTER:    '#4A5568',
};

interface PlanBreakdownProps {
  data: PlanRevenueSplit[];
}

export function PlanBreakdown({ data }: PlanBreakdownProps) {
  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4">
      <div className="mb-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">
        Revenue by Plan
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="plan"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] ?? '#4A5568'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-md)', borderRadius: 6, fontSize: 11, fontFamily: 'var(--font-data)', color: 'var(--fg1)' }}
            formatter={(v: number, name: string) => [`$${v.toLocaleString()}`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 space-y-2">
        {data.map((d) => (
          <div key={d.plan} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: PLAN_COLORS[d.plan] }} />
              <span className="font-mono text-[11px] text-fg2">{d.plan}</span>
              <span className="font-mono text-[10px] text-fg3">{d.tenants} tenant{d.tenants !== 1 ? 's' : ''}</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-[12px] tabular-nums text-fg1">${d.amount.toLocaleString()}</span>
              <span className="ml-2 font-mono text-[10px] text-fg3">
                {((d.amount / total) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
