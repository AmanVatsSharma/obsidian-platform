/**
 * File:        apps/ib-portal/src/app/(portal)/earnings/page.tsx
 * Module:      ib-portal · Earnings
 * Purpose:     Commission center — overview tab, statement tab, payment history tab, tax docs tab
 *
 * Exports:
 *   - EarningsPage() — client component (tab state + payout modal)
 *
 * Depends on:
 *   - ../../../lib/mock-data-context — useIBData
 *   - lucide-react                   — Download, X
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';
import { useIBData } from '../../../lib/mock-data-context';

type EarningsTab = 'overview' | 'statement' | 'payments' | 'tax';

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    PENDING: 'status-pending',
    PAID:    'status-paid',
    FAILED:  'badge badge-bear',
  };
  return (
    <span className={cls[status] ?? 'badge badge-muted'}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function DonutChart() {
  const segments = [
    { label: 'Direct Clients', val: 6900, pct: 0.62, color: 'var(--bull)'   },
    { label: 'Sub-IB Tier 1',  val: 1340, pct: 0.28, color: 'var(--accent)' },
    { label: 'Sub-IB Tier 2',  val: 280,  pct: 0.10, color: 'var(--warn)'   },
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
        <text x={cx} y={cy - 6}  textAnchor="middle" fill="var(--fg1)" fontSize="14" fontWeight="700" fontFamily="IBM Plex Mono">$8.2K</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--fg3)" fontSize="9"  fontFamily="IBM Plex Mono">MTD</text>
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

export default function EarningsPage() {
  const { ib, commissionSchedule, statementRows, monthlyEarnings, payments } = useIBData();
  const [tab, setTab] = useState<EarningsTab>('overview');
  const [showPayout, setShowPayout] = useState(false);

  const tabs: { key: EarningsTab; label: string }[] = [
    { key: 'overview',  label: 'Overview'         },
    { key: 'statement', label: 'Statement'         },
    { key: 'payments',  label: 'Payment History'   },
    { key: 'tax',       label: 'Tax Documents'     },
  ];

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-bold text-fg1">Earnings</h1>
        <p className="mt-0.5 font-sans text-[13px] text-fg2">Commission center — track every dollar earned</p>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {tabs.map(t => (
          <button
            key={t.key}
            className={cn('tab-btn', tab === t.key && 'active')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Commission schedule */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">MY COMMISSION SCHEDULE</div>
            </div>
            <div className="px-4">
              {commissionSchedule.map((c, i) => (
                <div
                  key={i}
                  className={cn('flex items-center justify-between py-2.5', i < commissionSchedule.length - 1 && 'border-b border-[var(--border)]')}
                >
                  <span className="font-sans text-[13px] text-fg2">{c.instrument}</span>
                  <span className="font-mono text-[13px] font-semibold text-bull">{c.rate}</span>
                </div>
              ))}
              <div className="mt-3 grid grid-cols-3 gap-px bg-[var(--border)] rounded-md overflow-hidden border border-[var(--border)]">
                {[
                  ['Sub-IB Override',   '20% of sub-IB earnings'],
                  ['Payment Schedule',  'Monthly'],
                  ['Min Payout',        '$100.00'],
                ].map(([label, val]) => (
                  <div key={label} className="bg-[var(--bg-elevated)] px-4 py-3">
                    <div className="font-sans text-[11px] text-fg3 mb-1">{label}</div>
                    <div className="font-mono text-[13px] font-semibold text-fg1">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly comparison + donut */}
          <div className="grid grid-cols-[1.4fr_1fr] gap-4">
            <div className="card">
              <div className="card-header">
                <div className="card-title">MONTHLY COMPARISON — LAST 6 MONTHS</div>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Month</th><th>Clients</th><th>Lots</th><th>Commission</th><th>vs Prev</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyEarnings.map((r, i) => (
                      <tr key={i}>
                        <td className="font-sans text-[12px] font-medium text-fg1">{r.month}</td>
                        <td className="mono-cell">{r.clients}</td>
                        <td className="mono-cell">{r.lots.toLocaleString()}</td>
                        <td className="mono-cell text-bull">${r.commission.toLocaleString()}</td>
                        <td className={cn('font-mono text-[12px]', r.change > 0 ? 'text-bull' : 'text-bear')}>
                          {r.change > 0 ? '+' : ''}{r.change}%
                        </td>
                        <td><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card p-5">
              <div className="mb-4 font-display text-[10px] tracking-[0.15em] text-fg2 uppercase">EARNINGS BY SOURCE</div>
              <DonutChart />
            </div>
          </div>
        </div>
      )}

      {/* ── Statement ── */}
      {tab === 'statement' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn btn-ghost btn-sm">Mar 2026</button>
            <button className="btn btn-ghost btn-sm">All Instruments</button>
            <button className="btn btn-ghost btn-sm">All Types</button>
            <div className="ml-auto flex gap-2">
              <button className="btn btn-ghost btn-sm"><Download size={12} strokeWidth={2} />CSV</button>
              <button className="btn-primary btn btn-sm"><Download size={12} strokeWidth={2} />PDF</button>
            </div>
          </div>
          <div className="card overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Client</th><th>Instrument</th><th>Side</th>
                  <th>Lots</th><th>Rate</th><th>Commission</th><th>Type</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {statementRows.map((r, i) => (
                  <tr key={i}>
                    <td className="mono-cell">{r.date}</td>
                    <td className="font-sans text-[12px] font-medium text-fg1">{r.client}</td>
                    <td className="mono-cell">{r.instrument}</td>
                    <td className={cn('font-mono text-[12px] font-bold', r.side === 'BUY' ? 'text-bull' : 'text-bear')}>{r.side}</td>
                    <td className="mono-cell">{r.lots}</td>
                    <td className="mono-cell">${r.rate}</td>
                    <td className="mono-cell text-bull">${r.commission}</td>
                    <td className={cn('font-mono text-[11px]', r.type === 'Sub-IB' ? 'text-accent' : 'text-fg2')}>{r.type}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
                <tr className="border-t border-[var(--border-md)]">
                  <td colSpan={4} className="font-mono text-[10px] text-fg3 uppercase">TOTALS</td>
                  <td className="mono-cell font-semibold text-fg1">9.5</td>
                  <td className="mono-cell text-fg3">—</td>
                  <td className="mono-cell font-semibold text-bull">$100.50</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Payments ── */}
      {tab === 'payments' && (
        <div className="space-y-5">
          <div className="flex gap-4 flex-wrap">
            {/* Payment method card */}
            <div className="card flex-1 min-w-[240px] p-4">
              <div className="font-display text-[10px] tracking-[0.15em] text-fg2 uppercase mb-3">PAYMENT METHOD ON FILE</div>
              <div className="flex items-center gap-3 border-b border-[var(--border)] pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--bg-elevated)] font-mono text-[18px]">🏦</div>
                <div className="flex-1">
                  <div className="font-sans text-[13px] font-semibold text-fg1">Chase Bank</div>
                  <div className="font-mono text-[12px] text-fg2 mt-0.5">••••4821</div>
                </div>
                <button className="btn btn-ghost btn-sm">Change</button>
              </div>
              <div className="mt-4">
                <div className="font-mono text-[10px] tracking-[0.1em] text-fg3 uppercase mb-2">Available Balance</div>
                <div className="font-mono text-[28px] font-bold text-bull">${ib.earningsMTD.toLocaleString()}.00</div>
                <button
                  className="btn btn-primary mt-3.5 w-full"
                  onClick={() => setShowPayout(true)}
                >
                  Request Payout
                </button>
              </div>
            </div>
            {/* All-time summary */}
            <div className="card flex-[2] min-w-[300px] p-4">
              <div className="font-display text-[10px] tracking-[0.15em] text-fg2 uppercase mb-3">ALL-TIME EARNINGS SUMMARY</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Total Paid',  '$34,560', 'text-bull'],
                  ['Pending',     '$8,240',  'text-warn'],
                  ['Payments',    '6 on time', 'text-accent'],
                ].map(([l, v, c]) => (
                  <div key={l} className="rounded-md bg-[var(--bg-elevated)] px-3.5 py-3">
                    <div className="font-sans text-[11px] text-fg3 mb-1">{l}</div>
                    <div className={cn('font-mono text-[18px] font-bold', c)}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <div className="card-header">
              <div className="card-title">PAYMENT HISTORY</div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Period</th><th>Amount</th><th>Method</th><th>Reference</th><th>Date Paid</th><th>Status</th><th />
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i}>
                    <td className="font-sans text-[12px] font-medium text-fg1">{p.period}</td>
                    <td className="mono-cell text-bull">${p.amount.toLocaleString()}</td>
                    <td className="font-sans text-[12px] text-fg2">{p.method}</td>
                    <td className="font-mono text-[11px] text-fg2">{p.ref}</td>
                    <td className="font-sans text-[12px] text-fg2">{p.date}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td><button className="btn btn-ghost btn-sm">Receipt</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tax ── */}
      {tab === 'tax' && (
        <div className="card">
          <div className="card-header"><div className="card-title">TAX DOCUMENTS</div></div>
          <div className="px-4 py-3 font-sans text-[12px] text-fg3 border-b border-[var(--border)]">
            Annual commission summaries for tax purposes. Consult your tax advisor regarding commission income.
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Year</th><th>Total Paid</th><th>Form Type</th><th /></tr>
            </thead>
            <tbody>
              {[['2025', '$34,560', '1099-MISC'], ['2024', '$8,240', '1099-MISC']].map(([y, t, f], i) => (
                <tr key={i}>
                  <td className="font-sans text-[12px] font-medium text-fg1">{y}</td>
                  <td className="mono-cell text-bull">{t}</td>
                  <td className="mono-cell">{f}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm"><Download size={12} strokeWidth={2} />PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Payout Modal ── */}
      {showPayout && (
        <div className="modal-overlay" onClick={() => setShowPayout(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button
              className="absolute right-4 top-4 text-fg2 hover:text-fg1 transition-colors"
              onClick={() => setShowPayout(false)}
            >
              <X size={18} strokeWidth={2} />
            </button>
            <h2 className="font-display text-[18px] font-bold text-fg1 mb-2">Request Payout</h2>
            <p className="font-sans text-[13px] text-fg2 mb-0">Your available balance will be sent to your registered payment method.</p>
            <div className="py-5 text-center font-mono text-[36px] font-bold text-bull">
              ${ib.earningsMTD.toLocaleString()}.00
            </div>
            <div className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] px-3.5 py-3 font-sans text-[13px] text-fg2 mb-5">
              To: <strong className="text-fg1">Chase Bank ••••4821</strong><br />
              <span className="font-sans text-[11px] text-fg3">Processing time: 1–3 business days</span>
            </div>
            <div className="flex gap-2.5">
              <button className="btn btn-ghost flex-1" onClick={() => setShowPayout(false)}>Cancel</button>
              <button className="btn btn-primary flex-1" onClick={() => setShowPayout(false)}>Confirm Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
