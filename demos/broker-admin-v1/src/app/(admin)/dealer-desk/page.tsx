/**
 * File:        apps/broker-admin/src/app/(admin)/dealer-desk/page.tsx
 * Module:      broker-admin · Liquidity · Dealer Desk
 * Purpose:     Manual dealer intervention queue — price deviations, requotes, and dealer metrics
 *
 * Exports:
 *   - default (DealerDeskPage) — three tabs: Queue | History | Performance
 *
 * Depends on:
 *   - none (all data is local state)
 *
 * Side-effects:
 *   - Approve/Requote/Reject update local queue state
 *   - Queue items auto-expire (simulated with local state only)
 *
 * Key invariants:
 *   - Deviation % = abs(requested - market) / market * 100
 *   - Items older than 30s highlighted red (urgency indicator)
 *   - Requote moves item to Requoted status in history
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useState } from 'react';
import { Clock, CheckCircle, XCircle, RefreshCw, TrendingUp } from 'lucide-react';

type QueueItem = {
  id: string;
  clientName: string;
  clientId: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  lots: number;
  requestedPrice: number;
  marketPrice: number;
  type: 'Market Slip' | 'Limit Dev' | 'Manual Review';
  ageSeconds: number;
  status: 'Pending' | 'Approved' | 'Requoted' | 'Rejected';
};

type DealerMetric = {
  name: string;
  approvePct: number;
  requotePct: number;
  avgDecisionMs: number;
  itemsToday: number;
};

const INIT_QUEUE: QueueItem[] = [
  { id: 'DQ001', clientName: 'Alexander Mitchell', clientId: 'C1001', symbol: 'EUR/USD', side: 'Buy',  lots: 5.0, requestedPrice: 1.08420, marketPrice: 1.08451, type: 'Market Slip',  ageSeconds: 8,  status: 'Pending' },
  { id: 'DQ002', clientName: 'Tariq Hassan',       clientId: 'C1009', symbol: 'XAUUSD',  side: 'Sell', lots: 2.0, requestedPrice: 2020.50, marketPrice: 2018.40, type: 'Limit Dev',   ageSeconds: 23, status: 'Pending' },
  { id: 'DQ003', clientName: 'Wei Zhang',           clientId: 'C1005', symbol: 'USD/JPY', side: 'Buy',  lots: 3.0, requestedPrice: 148.220, marketPrice: 148.185, type: 'Manual Review', ageSeconds: 45, status: 'Pending' },
  { id: 'DQ004', clientName: 'Priya Sharma',        clientId: 'C1007', symbol: 'GBP/USD', side: 'Buy',  lots: 1.5, requestedPrice: 1.27050, marketPrice: 1.27012, type: 'Market Slip',  ageSeconds: 67, status: 'Pending' },
  { id: 'DQ005', clientName: 'Lucas Oliveira',      clientId: 'C1006', symbol: 'BTC/USD', side: 'Buy',  lots: 0.1, requestedPrice: 43150.00, marketPrice: 43290.00, type: 'Limit Dev', ageSeconds: 112, status: 'Pending' },
];

const HISTORY: (QueueItem & { decidedBy: string; decidedAt: string })[] = [
  { id: 'DQ090', clientName: 'James Okafor',   clientId: 'C1003', symbol: 'EUR/USD', side: 'Buy',  lots: 2.0, requestedPrice: 1.08310, marketPrice: 1.08330, type: 'Market Slip',  ageSeconds: 0, status: 'Approved',  decidedBy: 'Alex Novak',  decidedAt: '09:14:22' },
  { id: 'DQ089', clientName: 'Anna Kowalski',   clientId: 'C1010', symbol: 'XAUUSD',  side: 'Sell', lots: 1.0, requestedPrice: 2025.00, marketPrice: 2018.00, type: 'Limit Dev',   ageSeconds: 0, status: 'Requoted',  decidedBy: 'Alex Novak',  decidedAt: '09:12:05' },
  { id: 'DQ088', clientName: 'Grace Osei',      clientId: 'C1019', symbol: 'GBP/USD', side: 'Buy',  lots: 3.0, requestedPrice: 1.27110, marketPrice: 1.27050, type: 'Market Slip',  ageSeconds: 0, status: 'Rejected',  decidedBy: 'Sarah Chen',  decidedAt: '09:08:47' },
  { id: 'DQ087', clientName: 'David Thompson',  clientId: 'C1011', symbol: 'AUD/USD', side: 'Sell', lots: 2.0, requestedPrice: 0.65820, marketPrice: 0.65810, type: 'Manual Review', ageSeconds: 0, status: 'Approved', decidedBy: 'Sarah Chen',  decidedAt: '08:59:11' },
];

const DEALER_METRICS: DealerMetric[] = [
  { name: 'Alex Novak',  approvePct: 78, requotePct: 14, avgDecisionMs: 3200, itemsToday: 42 },
  { name: 'Sarah Chen',  approvePct: 82, requotePct: 10, avgDecisionMs: 2800, itemsToday: 38 },
  { name: 'Marcus Webb', approvePct: 71, requotePct: 18, avgDecisionMs: 4100, itemsToday: 29 },
];

function devPct(req: number, mkt: number) {
  return Math.abs((req - mkt) / mkt * 100);
}

export default function DealerDeskPage() {
  const [tab, setTab] = useState<'queue' | 'history' | 'performance'>('queue');
  const [queue, setQueue] = useState<QueueItem[]>(INIT_QUEUE);
  const [requoteValue, setRequoteValue] = useState<Record<string, string>>({});

  const pending = queue.filter(q => q.status === 'Pending');

  const approve  = (id: string) => setQueue(q => q.map(i => i.id === id ? { ...i, status: 'Approved' } : i));
  const reject   = (id: string) => setQueue(q => q.map(i => i.id === id ? { ...i, status: 'Rejected' } : i));
  const requote  = (id: string) => setQueue(q => q.map(i => i.id === id ? { ...i, status: 'Requoted' } : i));

  const STATUS_BADGE: Record<QueueItem['status'], string> = {
    Pending:  'status-pending',
    Approved: 'status-active',
    Requoted: 'badge badge-accent',
    Rejected: 'status-suspended',
  };

  return (
    <div className="flex flex-col">
      <div className="module-header">
        <div>
          <p className="module-title">Dealer Desk</p>
          <p className="module-subtitle">
            {pending.length} pending items · {HISTORY.length} resolved today
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Queue Depth',     value: pending.length,  color: pending.length > 3 ? 'text-warn' : 'text-fg1',  icon: <Clock size={14} className={pending.length > 3 ? 'text-warn' : 'text-fg3'} /> },
            { label: 'Approved Today',  value: HISTORY.filter(h=>h.status==='Approved').length + queue.filter(q=>q.status==='Approved').length, color: 'text-bull', icon: <CheckCircle size={14} className="text-bull" /> },
            { label: 'Rejected Today',  value: HISTORY.filter(h=>h.status==='Rejected').length + queue.filter(q=>q.status==='Rejected').length, color: 'text-bear', icon: <XCircle size={14} className="text-bear" /> },
            { label: 'Requoted Today',  value: HISTORY.filter(h=>h.status==='Requoted').length + queue.filter(q=>q.status==='Requoted').length, color: 'text-accent', icon: <RefreshCw size={14} className="text-accent" /> },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div className="flex items-center justify-between">
                <p className="kpi-label">{k.label}</p>{k.icon}
              </div>
              <p className={`kpi-value ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="chart-tabs">
          <button className={`chart-tab ${tab === 'queue' ? 'active' : ''}`} onClick={() => setTab('queue')}>
            Queue {pending.length > 0 && <span className="ml-1 font-mono text-[9px] text-warn">{pending.length}</span>}
          </button>
          <button className={`chart-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
          <button className={`chart-tab ${tab === 'performance' ? 'active' : ''}`} onClick={() => setTab('performance')}>Dealer Performance</button>
        </div>

        {/* Queue */}
        {tab === 'queue' && (
          <div className="space-y-2">
            {queue.map(item => {
              const dev = devPct(item.requestedPrice, item.marketPrice);
              const isUrgent = item.ageSeconds > 30 && item.status === 'Pending';
              const priceFmt = (p: number) => item.symbol.includes('JPY') || item.symbol.includes('XAU') || item.symbol.includes('BTC')
                ? p.toFixed(2) : p.toFixed(5);
              return (
                <div key={item.id}
                  className={`card p-4 ${isUrgent ? 'border-warn/40' : ''} ${item.status !== 'Pending' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                      <div>
                        <p className="text-[12px] font-medium text-fg1">{item.clientName}</p>
                        <p className="mono-cell text-[10px] text-fg3">{item.clientId} · {item.id}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="mono-cell font-bold text-[13px]">{item.symbol}</p>
                          <span className={`badge ${item.side === 'Buy' ? 'badge-bull' : 'badge-bear'}`}>{item.side}</span>
                        </div>
                        <p className="mono-cell text-[10px] text-fg3">{item.lots} lots · {item.type}</p>
                      </div>
                      <div>
                        <p className="kpi-label mb-0.5">Requested</p>
                        <p className="mono-cell text-[12px] text-fg1">{priceFmt(item.requestedPrice)}</p>
                      </div>
                      <div>
                        <p className="kpi-label mb-0.5">Market</p>
                        <p className="mono-cell text-[12px] text-accent">{priceFmt(item.marketPrice)}</p>
                      </div>
                      <div>
                        <p className="kpi-label mb-0.5">Deviation</p>
                        <p className={`mono-cell text-[12px] font-bold ${dev > 0.05 ? 'text-bear' : dev > 0.02 ? 'text-warn' : 'text-bull'}`}>
                          {dev.toFixed(3)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {item.status !== 'Pending' ? (
                        <span className={STATUS_BADGE[item.status]}>{item.status}</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Clock size={11} className={isUrgent ? 'text-warn' : 'text-fg3'} />
                          <span className={`mono-cell text-[10px] ${isUrgent ? 'text-warn' : 'text-fg3'}`}>{item.ageSeconds}s</span>
                        </div>
                      )}
                      {item.status === 'Pending' && (
                        <div className="flex gap-1">
                          <button className="btn-primary btn btn-xs" onClick={() => approve(item.id)}>
                            <CheckCircle size={11} /> Accept
                          </button>
                          <button className="btn-ghost btn btn-xs" onClick={() => requote(item.id)}>
                            <RefreshCw size={11} /> Requote
                          </button>
                          <button className="btn-danger btn btn-xs" onClick={() => reject(item.id)}>
                            <XCircle size={11} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {pending.length === 0 && (
              <div className="card flex flex-col items-center py-10 text-center">
                <CheckCircle size={28} className="mb-3 text-bull" />
                <p className="text-[12px] font-medium text-fg2">Queue is clear</p>
                <p className="mt-1 text-[11px] text-fg3">No pending dealer interventions</p>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {tab === 'history' && (
          <div className="card overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Client</th><th>Symbol</th><th>Side</th>
                  <th>Req. Price</th><th>Mkt Price</th><th>Dev.</th>
                  <th>Status</th><th>Dealer</th><th>Time</th>
                </tr>
              </thead>
              <tbody>
                {HISTORY.map(h => {
                  const dev = devPct(h.requestedPrice, h.marketPrice);
                  const fmt = (p: number) => h.symbol.includes('XAU') || h.symbol.includes('BTC') ? p.toFixed(2) : p.toFixed(5);
                  return (
                    <tr key={h.id}>
                      <td className="mono-cell text-[10px] text-fg3">{h.id}</td>
                      <td>
                        <p className="text-[12px] text-fg1">{h.clientName}</p>
                        <p className="mono-cell text-[10px] text-fg3">{h.clientId}</p>
                      </td>
                      <td className="mono-cell font-bold text-[12px]">{h.symbol}</td>
                      <td><span className={`badge ${h.side === 'Buy' ? 'badge-bull' : 'badge-bear'}`}>{h.side}</span></td>
                      <td className="mono-cell text-[11px] text-fg2">{fmt(h.requestedPrice)}</td>
                      <td className="mono-cell text-[11px] text-accent">{fmt(h.marketPrice)}</td>
                      <td className="mono-cell text-[11px] text-fg2">{dev.toFixed(3)}%</td>
                      <td><span className={STATUS_BADGE[h.status]}>{h.status}</span></td>
                      <td className="text-[11px] text-fg2">{h.decidedBy}</td>
                      <td className="mono-cell text-[10px] text-fg3">{h.decidedAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Dealer performance */}
        {tab === 'performance' && (
          <div className="grid grid-cols-3 gap-4">
            {DEALER_METRICS.map(d => (
              <div key={d.name} className="card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-[12px] font-bold text-accent">
                    {d.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <p className="text-[13px] font-semibold text-fg1">{d.name}</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Items Today',  value: String(d.itemsToday),          color: 'text-fg1' },
                    { label: 'Approve Rate', value: `${d.approvePct}%`,            color: 'text-bull' },
                    { label: 'Requote Rate', value: `${d.requotePct}%`,            color: 'text-accent' },
                    { label: 'Reject Rate',  value: `${100-d.approvePct-d.requotePct}%`, color: 'text-bear' },
                    { label: 'Avg Decision', value: `${(d.avgDecisionMs/1000).toFixed(1)}s`, color: 'text-fg2' },
                  ].map(m => (
                    <div key={m.label} className="flex items-center justify-between">
                      <p className="kpi-label">{m.label}</p>
                      <p className={`mono-cell text-[12px] font-bold ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {[
                    { label: 'Approve', pct: d.approvePct, cls: 'bg-bull' },
                    { label: 'Requote', pct: d.requotePct, cls: 'bg-accent' },
                    { label: 'Reject',  pct: 100 - d.approvePct - d.requotePct, cls: 'bg-bear' },
                  ].map(bar => (
                    <div key={bar.label} className="flex items-center gap-2">
                      <p className="w-12 text-[9px] text-fg3">{bar.label}</p>
                      <div className="flex-1 rounded-full bg-[var(--bg-elevated)] h-1.5">
                        <div className={`h-full rounded-full ${bar.cls}`} style={{ width: `${bar.pct}%` }} />
                      </div>
                      <p className="mono-cell w-8 text-right text-[9px] text-fg3">{bar.pct}%</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
