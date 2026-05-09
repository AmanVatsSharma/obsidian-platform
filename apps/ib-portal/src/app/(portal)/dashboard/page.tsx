/**
 * File:        apps/ib-portal/src/app/(portal)/dashboard/page.tsx
 * Module:      ib-portal · Dashboard
 * Purpose:     Main dashboard — earnings hero, sparkline, tier progress, KPI grid, charts, top clients, announcements
 *
 * Exports:
 *   - DashboardPage() — client component (chart view toggle requires state)
 *
 * Depends on:
 *   - ../../../lib/mock-data-context — useIBData
 *   - lucide-react                   — TrendingUp, TrendingDown, ArrowRight
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - All SVG charts are pure SVG — no chart library
 *   - .ib-hero gradient adapts to light theme via global.css [data-theme="light"] override
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';
import { useIBData } from '../../../lib/mock-data-context';

/* ── Formatting helpers ──────────────────────────────────────────── */
const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n.toLocaleString()}`;

/* ── Sparkline ───────────────────────────────────────────────────── */
function Sparkline({ data }: { data: number[] }) {
  const min = Math.min(...data), max = Math.max(...data);
  const W = 300, H = 48;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / (max - min)) * (H - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  const area = `0,${H} ${pts} ${W},${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spkGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor="var(--bull)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--bull)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spkGrad)" />
      <polyline points={pts} fill="none" stroke="var(--bull)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Bar Chart ───────────────────────────────────────────────────── */
function EarningsBarChart({ data }: { data: { month: string; direct: number; subib: number }[] }) {
  const maxVal = Math.max(...data.map(d => d.direct + d.subib));
  const W = 440, H = 160, barW = 44, gap = 24;
  const totalW = data.length * (barW + gap) - gap;
  const offsetX = (W - totalW) / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full overflow-visible">
      {data.map((d, i) => {
        const x = offsetX + i * (barW + gap);
        const totalH = ((d.direct + d.subib) / maxVal) * H;
        const directH = (d.direct / maxVal) * H;
        const subibH = (d.subib / maxVal) * H;
        return (
          <g key={i}>
            <rect x={x} y={H - totalH}    width={barW} height={subibH}  fill="var(--accent)" opacity="0.8" rx="2" />
            <rect x={x} y={H - directH}   width={barW} height={directH} fill="var(--bull)"   opacity="0.9" rx="2" />
            <text x={x + barW / 2} y={H + 18} textAnchor="middle" fill="var(--fg3)" fontSize="10" fontFamily="IBM Plex Mono">{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Donut Chart ─────────────────────────────────────────────────── */
function DonutChart() {
  const segments = [
    { label: 'Direct Clients',  val: 6900,  pct: 0.62, color: 'var(--bull)'   },
    { label: 'Sub-IB Tier 1',   val: 1340,  pct: 0.28, color: 'var(--accent)' },
    { label: 'Sub-IB Tier 2',   val: 280,   pct: 0.10, color: 'var(--warn)'   },
  ];
  const r = 52, cx = 60, cy = 60, strokeW = 16;
  let cumAngle = -Math.PI / 2;
  const arcs = segments.map(seg => {
    const angle = seg.pct * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle), y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle), y2 = cy + r * Math.sin(cumAngle);
    return { ...seg, d: `M ${x1} ${y1} A ${r} ${r} 0 ${seg.pct > 0.5 ? 1 : 0} 1 ${x2} ${y2}` };
  });
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 120" width="120" height="120" className="shrink-0">
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill="none" stroke={a.color} strokeWidth={strokeW} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--fg1)" fontSize="14" fontWeight="700" fontFamily="IBM Plex Mono">$8.2K</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--fg3)" fontSize="9" fontFamily="IBM Plex Mono">MTD</text>
      </svg>
      <div className="flex flex-col gap-2.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <div>
              <div className="font-sans text-[12px] text-fg2">{s.label}</div>
              <div className="font-mono text-[13px] font-semibold text-fg1">${s.val.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Status badge ────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    ACTIVE:  'status-active',
    DORMANT: 'status-dormant',
    UNVERIFIED: 'status-unverified',
  };
  return (
    <span className={cls[status] ?? 'badge badge-muted'}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/* ── Tag badge ───────────────────────────────────────────────────── */
function AnnouncementTag({ tag }: { tag: string }) {
  const cls: Record<string, string> = {
    NEW:       'tag-new',
    UPDATE:    'tag-update',
    MARKETING: 'tag-marketing',
  };
  return <span className={cls[tag] ?? 'badge badge-muted'}>{tag}</span>;
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { ib, sparklineData, earningsBarData, topClients, announcements } = useIBData();
  const [chartView, setChartView] = useState<'monthly' | 'weekly'>('monthly');
  const progress = Math.min((ib.earningsMTD / ib.toGold) * 100, 100);

  const tierColorMap: Record<string, string> = {
    SILVER:   'text-[#94A3B8]',
    GOLD:     'text-warn',
    PLATINUM: 'text-fg1',
  };

  return (
    <div className="mx-auto max-w-[1400px] p-6 space-y-5">
      {/* Page header */}
      <div>
        <h1 className="font-display text-[22px] font-bold text-fg1">Dashboard</h1>
        <p className="mt-0.5 font-sans text-[13px] text-fg2">Welcome back, {ib.name} — here's your performance overview</p>
      </div>

      {/* Earnings Hero */}
      <div className="ib-hero">
        {/* subtle gradient overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-[12px]" style={{ background: 'radial-gradient(ellipse 600px 300px at 80% 50%, rgba(59,130,246,0.05), transparent)' }} />
        {/* top shimmer line */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px rounded-t-[12px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), rgba(16,217,150,0.3), transparent)' }} />

        <div className="relative grid grid-cols-[1fr_auto] gap-6 items-start">
          <div>
            <div className="font-mono text-[10px] tracking-[0.2em] text-fg2 uppercase mb-3">TOTAL EARNINGS — MARCH 2026</div>
            <div className="font-mono text-[48px] font-bold text-bull leading-none tracking-[-2px]">
              ${ib.earningsMTD.toLocaleString()}.00
            </div>
            <div className="mt-4">
              <Sparkline data={sparklineData} />
            </div>
            <div className="mt-2 flex items-center gap-4 font-sans text-[12px] text-fg2">
              <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-fg3" />30-day trend</span>
              <span className="flex items-center gap-1 text-bull"><TrendingUp size={12} strokeWidth={2} />Growing</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] tracking-[0.1em] text-fg2 uppercase">NEXT PAYMENT</div>
            <div className="mt-1 font-sans text-[14px] font-semibold text-fg1">{ib.nextPayment}</div>
            <div className="mt-1.5 font-mono text-[22px] font-bold text-warn">${ib.pendingPayout.toLocaleString()}.00</div>
            <div className="mt-0.5 font-sans text-[11px] text-fg2">Pending payout</div>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-0 border-t border-[var(--border)] pt-5">
          <div>
            <div className="font-mono text-[10px] tracking-[0.1em] text-fg2 uppercase mb-1.5">This Month</div>
            <div className="font-mono text-[16px] font-semibold text-fg1">{ib.activeClients} active clients</div>
            <div className="mt-0.5 font-sans text-[12px] text-fg2">{fmt(ib.volumeMTD)} volume</div>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.1em] text-fg2 uppercase mb-1.5">All Time</div>
            <div className="font-mono text-[16px] font-semibold text-fg1">${ib.allTimeEarnings.toLocaleString()}</div>
            <div className="mt-0.5 font-sans text-[12px] text-fg2">{ib.allTimeClients} clients referred</div>
          </div>
          <div>
            <div className="font-mono text-[10px] tracking-[0.1em] text-fg2 uppercase mb-1.5">Tier Status</div>
            <div className={cn('font-mono text-[16px] font-bold', tierColorMap[ib.tier])}>{ib.tier}</div>
            <div className="mt-0.5 font-sans text-[12px] text-fg2">${(ib.toGold - ib.earningsMTD).toLocaleString()} to GOLD</div>
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="card px-5 py-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.15em] text-fg2 uppercase">Progress to GOLD tier</span>
          <span className="font-mono text-[12px] text-warn">${ib.earningsMTD.toLocaleString()} / ${ib.toGold.toLocaleString()} monthly</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 font-sans text-[11px] text-fg3">
          GOLD unlocks: <span className="text-warn font-semibold">{ib.goldUnlocks}</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active Clients',  value: String(ib.activeClients),            sub: 'trading in last 30d',   trend: +4   },
          { label: 'Volume MTD',      value: fmt(ib.volumeMTD),                   sub: 'across all instruments', trend: +12  },
          { label: 'New Clients',     value: String(ib.newClients),               sub: 'joined this month',     trend: +2   },
          { label: 'Projected MTD',   value: '$9,100',                            sub: 'at current rate',       trend: +10.5 },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-bottom">
              <div className="kpi-sub">{k.sub}</div>
              <div className={cn('kpi-delta', k.trend > 0 ? 'text-bull' : 'text-bear')}>
                {k.trend > 0 ? <TrendingUp size={11} strokeWidth={2} /> : <TrendingDown size={11} strokeWidth={2} />}
                {Math.abs(k.trend)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-display text-[10px] tracking-[0.15em] text-fg2 uppercase">EARNINGS BREAKDOWN</div>
            <div className="chart-tabs">
              <button
                className={cn('chart-tab', chartView === 'monthly' && 'active')}
                onClick={() => setChartView('monthly')}
              >Monthly</button>
              <button
                className={cn('chart-tab', chartView === 'weekly' && 'active')}
                onClick={() => setChartView('weekly')}
              >Weekly</button>
            </div>
          </div>
          <EarningsBarChart data={earningsBarData} />
          <div className="mt-3 flex gap-4">
            <div className="flex items-center gap-1.5 font-sans text-[11px] text-fg2">
              <div className="h-2 w-2 rounded-sm bg-bull" />Direct commission
            </div>
            <div className="flex items-center gap-1.5 font-sans text-[11px] text-fg2">
              <div className="h-2 w-2 rounded-sm bg-accent" />Sub-IB override
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="mb-4 font-display text-[10px] tracking-[0.15em] text-fg2 uppercase">EARNINGS BY SOURCE</div>
          <DonutChart />
        </div>
      </div>

      {/* Top 10 Clients */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">MY TOP 10 CLIENTS</div>
          <Link href="/clients" className="flex items-center gap-1 font-sans text-[12px] text-accent hover:underline">
            View all <ArrowRight size={12} strokeWidth={2} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Client</th>
                <th>Volume MTD</th>
                <th>Trades</th>
                <th>Commission</th>
                <th>Status</th>
                <th>Ref Link</th>
              </tr>
            </thead>
            <tbody>
              {topClients.map(c => (
                <tr key={c.rank} className="cursor-pointer">
                  <td className="mono-cell text-center text-fg3">{c.rank}</td>
                  <td className="font-sans text-[12px] font-medium text-fg1">{c.name}</td>
                  <td className="mono-cell">{fmt(c.volume)}</td>
                  <td className="mono-cell">{c.trades}</td>
                  <td className="mono-cell text-bull">${c.commission.toLocaleString()}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="font-mono text-[11px] text-fg3">{c.link}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Announcements */}
      <div>
        <div className="mb-2 font-display text-[10px] tracking-[0.15em] text-fg2 uppercase">BROKER ANNOUNCEMENTS</div>
        <div className="card overflow-hidden">
          {announcements.map((a, i) => (
            <div
              key={a.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3',
                i < announcements.length - 1 && 'border-b border-[var(--border)]',
              )}
            >
              <span className="font-mono text-[11px] text-fg3 w-10 shrink-0">{a.date}</span>
              <AnnouncementTag tag={a.tag} />
              <span className="flex-1 font-sans text-[13px] text-fg2">{a.text}</span>
              <ArrowRight size={12} strokeWidth={2} className="text-accent cursor-pointer hover:text-accent/80 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
