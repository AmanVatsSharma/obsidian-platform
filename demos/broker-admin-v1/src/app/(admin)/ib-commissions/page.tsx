/**
 * File:        apps/broker-admin/src/app/(admin)/ib-commissions/page.tsx
 * Module:      broker-admin · Finance · IB Commissions
 * Purpose:     Monthly commission run management, per-IB ledger, and payout processing
 *
 * Exports:
 *   - default (IBCommissionsPage) — commission overview with run modal and per-IB drill-down
 *
 * Depends on:
 *   - @/lib/mock-data-context — useBrokerData() for ibs list
 *
 * Side-effects:
 *   - none (run modal is a visual preview; actual payout is a placeholder action)
 *
 * Key invariants:
 *   - Ledger is derived from ib.volumeMTD + ib.commissionRate; months simulated backward
 *   - Eligible = status Active AND pendingPayout >= 100 (minimum threshold)
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useState, useMemo } from 'react';
import { DollarSign, Play, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useBrokerData } from '@/lib/mock-data-context';
import type { IntroducingBroker } from '@/lib/types';

const MONTHS = ['Jan 2024', 'Dec 2023', 'Nov 2023', 'Oct 2023', 'Sep 2023', 'Aug 2023'];
const MIN_THRESHOLD = 100;

function buildLedger(ib: IntroducingBroker) {
  return MONTHS.map((month, i) => {
    const scale = 1 - i * 0.06;
    const vol = Math.round(ib.volumeMTD * scale);
    const gross = Math.round(vol * ib.commissionRate);
    const adj = i === 2 ? -150 : 0;
    return {
      month,
      volume: vol,
      rate: ib.commissionRate,
      gross,
      adjustments: adj,
      net: gross + adj,
      status: i === 0 ? 'Pending' : i === 1 ? 'Processing' : 'Paid' as string,
      ref: `COM-${ib.id}-${String(2024 - Math.floor(i / 12)).slice(-2)}${String(12 - (i % 12)).padStart(2, '0')}`,
    };
  });
}

function RunModal({ onClose }: { onClose: () => void }) {
  const { ibs } = useBrokerData();
  const [done, setDone] = useState(false);

  const preview = useMemo(() => ibs.map(ib => ({
    ib,
    volume: ib.volumeMTD,
    rate: ib.commissionRate,
    net: Math.round(ib.volumeMTD * ib.commissionRate),
    eligible: ib.status === 'Active' && ib.pendingPayout >= MIN_THRESHOLD,
  })), [ibs]);

  const total = preview.filter(p => p.eligible).reduce((s, p) => s + p.net, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="flex w-[620px] flex-col rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <p className="module-title">{done ? 'Commission Run Complete' : 'Monthly Commission Run — Preview'}</p>
            <p className="mt-0.5 text-[11px] text-fg3">Period: January 2024</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn btn-xs p-1.5"><X size={14} /></button>
        </div>

        {!done ? (
          <>
            <div className="max-h-[360px] overflow-y-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>IB</th>
                    <th>Volume (lots)</th>
                    <th>Rate</th>
                    <th>Gross</th>
                    <th>Eligible</th>
                    <th>Net Due</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map(p => (
                    <tr key={p.ib.id} className={p.eligible ? '' : 'opacity-40'}>
                      <td>
                        <p className="text-[12px] font-medium text-fg1">{p.ib.name}</p>
                        <p className="text-[10px] text-fg3">{p.ib.tier}</p>
                      </td>
                      <td className="mono-cell text-[11px]">{p.volume.toLocaleString()}</td>
                      <td className="mono-cell text-[11px] text-fg2">${p.rate}/lot</td>
                      <td className="mono-cell font-bold text-bull">${p.net.toLocaleString()}</td>
                      <td>
                        {p.eligible
                          ? <span className="text-[11px] text-bull">Yes</span>
                          : <span className="text-[11px] text-fg3">Below ${MIN_THRESHOLD}</span>}
                      </td>
                      <td className={`mono-cell font-bold text-[12px] ${p.eligible ? 'text-bull' : 'text-fg3'}`}>
                        {p.eligible ? `$${p.net.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3">
              <div>
                <p className="kpi-label">Total Payout</p>
                <p className="kpi-value text-bull">${total.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-fg3">{preview.filter(p => p.eligible).length} IBs eligible</span>
                <button className="btn-ghost btn btn-sm" onClick={onClose}>Cancel</button>
                <button className="btn-primary btn btn-sm" onClick={() => setDone(true)}>
                  <Play size={12} /> Run & Pay All
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="px-5 py-8 text-center">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-bull/10">
              <DollarSign size={24} className="text-bull" />
            </div>
            <p className="text-[14px] font-semibold text-fg1 mb-1">Payout Processed</p>
            <p className="text-[12px] text-fg3 mb-4">${total.toLocaleString()} sent to {preview.filter(p => p.eligible).length} IBs</p>
            <button className="btn-primary btn btn-sm" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IBCommissionsPage() {
  const { ibs } = useBrokerData();
  const [showRun, setShowRun] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalPending = ibs.reduce((s, ib) => s + ib.pendingPayout, 0);
  const totalMTD     = ibs.reduce((s, ib) => s + ib.commissionMTD, 0);

  return (
    <div className="flex flex-col">
      <div className="module-header">
        <div>
          <p className="module-title">IB Commissions</p>
          <p className="module-subtitle">
            {ibs.length} IBs · <span className="text-warn">${totalPending.toLocaleString()} pending payout</span>
          </p>
        </div>
        <button className="btn-primary btn btn-sm" onClick={() => setShowRun(true)}>
          <Play size={13} /> Run Monthly Commission
        </button>
      </div>

      <div className="p-6 space-y-4">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'MTD Total',     value: `$${totalMTD.toLocaleString()}`,     color: 'text-bull' },
            { label: 'Pending Payout',value: `$${totalPending.toLocaleString()}`, color: 'text-warn' },
            { label: 'Active IBs',    value: ibs.filter(i => i.status === 'Active').length, color: 'text-fg1' },
            { label: 'Avg Rate',      value: `$${(ibs.reduce((s,i) => s+i.commissionRate,0)/ibs.length).toFixed(2)}/lot`, color: 'text-fg2' },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <p className="kpi-label">{k.label}</p>
              <p className={`kpi-value ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Per-IB ledger accordion */}
        <div className="card">
          <div className="card-header">
            <p className="card-title">Per-IB Ledger</p>
          </div>
          {ibs.map(ib => {
            const ledger = buildLedger(ib);
            const isOpen = expanded === ib.id;
            return (
              <div key={ib.id} className="border-b border-[var(--border)] last:border-0">
                <button
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] transition-colors"
                  onClick={() => setExpanded(isOpen ? null : ib.id)}
                >
                  <span className="text-base">{ib.flag}</span>
                  <div className="flex-1">
                    <span className="text-[12px] font-medium text-fg1">{ib.name}</span>
                    <span className="ml-2 text-[10px] text-fg3">{ib.tier}</span>
                  </div>
                  <span className="mono-cell text-[11px] text-fg2">${ib.commissionRate}/lot</span>
                  <span className="mono-cell font-bold text-[12px] text-bull">${ib.commissionMTD.toLocaleString()} MTD</span>
                  <span className="mono-cell font-bold text-[12px] text-warn">${ib.pendingPayout.toLocaleString()} pending</span>
                  {isOpen ? <ChevronUp size={14} className="text-fg3" /> : <ChevronDown size={14} className="text-fg3" />}
                </button>

                {isOpen && (
                  <div className="border-t border-[var(--border)] bg-[var(--bg-elevated)]">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Volume (lots)</th>
                          <th>Rate</th>
                          <th>Gross</th>
                          <th>Adjustments</th>
                          <th>Net</th>
                          <th>Status</th>
                          <th>Ref</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.map(row => (
                          <tr key={row.ref}>
                            <td className="mono-cell text-[11px]">{row.month}</td>
                            <td className="mono-cell text-[11px] text-fg2">{row.volume.toLocaleString()}</td>
                            <td className="mono-cell text-[11px] text-fg2">${row.rate}/lot</td>
                            <td className="delta-positive mono-cell">${row.gross.toLocaleString()}</td>
                            <td className={`mono-cell text-[11px] ${row.adjustments < 0 ? 'text-bear' : 'text-fg3'}`}>
                              {row.adjustments < 0 ? `-$${Math.abs(row.adjustments)}` : '—'}
                            </td>
                            <td className={`mono-cell font-bold text-[12px] ${row.status === 'Pending' ? 'text-warn' : 'text-bull'}`}>
                              ${row.net.toLocaleString()}
                            </td>
                            <td>
                              <span className={
                                row.status === 'Paid' ? 'status-active' :
                                row.status === 'Processing' ? 'badge badge-accent' : 'status-pending'
                              }>{row.status}</span>
                            </td>
                            <td className="mono-cell text-[10px] text-fg3">{row.ref}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showRun && <RunModal onClose={() => setShowRun(false)} />}
    </div>
  );
}
