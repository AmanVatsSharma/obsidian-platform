/**
 * File:        apps/dealer-workstation/src/components/workspace/tabs/clients-tab.tsx
 * Module:      dealer-workstation · Workspace
 * Purpose:     Clients tab — full sortable client table with expandable detail rows,
 *              tier badges, margin level coloring, margin-call row pulse animation,
 *              and expanded 3-column row: Account Summary | Recent Trades | Quick Actions.
 *
 * Exports:
 *   - ClientsTab() — client watchlist panel
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { useDeskData } from '../../../lib/mock-data-context';
import type { Client, ClientStatus } from '../../../lib/types';

function fmtMoney(n: number): string {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function marginColor(pct: number): string {
  if (pct < 30) return 'var(--bear)';
  if (pct < 50) return 'var(--warn)';
  return 'var(--bull)';
}

function statusBadge(status: ClientStatus) {
  if (status === 'MARGIN_CALL')    return <span className="status-call">CALL</span>;
  if (status === 'MARGIN_WARNING') return <span className="status-warning">WARN</span>;
  if (status === 'SUSPENDED')      return <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 2, background: 'rgba(168,85,247,0.15)', color: 'var(--purple)', border: '1px solid rgba(168,85,247,0.3)' }}>SUSP</span>;
  return <span style={{ color: 'var(--fg3)', fontSize: 9 }}>OK</span>;
}

type SortKey = keyof Pick<Client, 'name' | 'equity' | 'margin' | 'floatPnl' | 'positions' | 'volumeToday'>;
type FilterStatus = 'ALL' | ClientStatus;
type FilterTier   = 'ALL' | 'VIP' | 'PRO' | 'RETAIL';

export function ClientsTab() {
  const { clients, executions, addToast } = useDeskData();
  const [expanded, setExpanded]         = useState<Set<number>>(new Set());
  const [sortKey, setSortKey]           = useState<SortKey>('equity');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [filterTier, setFilterTier]     = useState<FilterTier>('ALL');

  function toggleExpand(id: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const filtered = clients
    .filter(c => filterStatus === 'ALL' || c.status === filterStatus)
    .filter(c => filterTier === 'ALL' || c.type === filterTier)
    .sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

  const marginCallCount = clients.filter(c => c.status === 'MARGIN_CALL').length;
  const marginWarnCount = clients.filter(c => c.status === 'MARGIN_WARNING').length;

  function SortTh({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <th onClick={() => toggleSort(k)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
        {label}{active ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ''}
      </th>
    );
  }

  const QUICK_ACTIONS = [
    { label: 'CLOSE ALL POSITIONS', color: 'var(--bear)',   msg: (name: string) => `All open positions for ${name} will be closed at market` },
    { label: 'ADJUST MARGIN',       color: 'var(--warn)',   msg: (name: string) => `Margin adjustment initiated for ${name}` },
    { label: 'ADD BONUS',           color: 'var(--bull)',   msg: (name: string) => `Bonus credit applied to ${name}'s account` },
    { label: 'SUSPEND ACCOUNT',     color: 'var(--purple)', msg: (name: string) => `${name}'s account has been suspended` },
  ];

  return (
    <div style={{ padding: '8px 12px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['ALL', 'NORMAL', 'MARGIN_WARNING', 'MARGIN_CALL', 'SUSPENDED'] as FilterStatus[]).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ padding: '3px 8px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 600, border: '1px solid', cursor: 'pointer', textTransform: 'uppercase',
                borderColor: filterStatus === s ? 'var(--accent)' : 'var(--border)',
                background:  filterStatus === s ? 'var(--accent-dim)' : 'var(--bg-panel)',
                color:       filterStatus === s ? 'var(--accent)'     : 'var(--fg3)',
              }}
            >{s === 'MARGIN_WARNING' ? 'WARN' : s === 'MARGIN_CALL' ? 'CALL' : s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['ALL', 'VIP', 'PRO', 'RETAIL'] as FilterTier[]).map(t => (
            <button key={t} onClick={() => setFilterTier(t)}
              style={{ padding: '3px 8px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 600, border: '1px solid', cursor: 'pointer',
                borderColor: filterTier === t ? 'var(--border-hi)' : 'var(--border)',
                background:  filterTier === t ? 'var(--bg-elevated)' : 'var(--bg-panel)',
                color:       filterTier === t ? 'var(--fg1)'       : 'var(--fg3)',
              }}
            >{t}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)' }}>
          <span>CLIENTS: <span style={{ color: 'var(--fg1)', fontWeight: 700 }}>{filtered.length}</span></span>
          {marginCallCount > 0 && <span>CALLS: <span style={{ color: 'var(--bear)', fontWeight: 700 }}>{marginCallCount}</span></span>}
          {marginWarnCount > 0 && <span>WARN: <span style={{ color: 'var(--warn)', fontWeight: 700 }}>{marginWarnCount}</span></span>}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <table className="desk-table">
          <thead>
            <tr>
              <th style={{ width: 20 }}></th>
              <SortTh label="CLIENT" k="name" />
              <th>TIER</th>
              <SortTh label="EQUITY" k="equity" />
              <SortTh label="MARGIN %" k="margin" />
              <SortTh label="FLOAT P&L" k="floatPnl" />
              <SortTh label="POSITIONS" k="positions" />
              <SortTh label="VOL TODAY" k="volumeToday" />
              <th>LAST TRADE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const isExpanded = expanded.has(c.id);
              const isCall     = c.status === 'MARGIN_CALL';
              const isWarn     = c.status === 'MARGIN_WARNING';
              const recentTrades = executions.filter(e => e.clientId === c.id).slice(0, 3);

              return (
                <>
                  <tr
                    key={c.id}
                    onClick={() => toggleExpand(c.id)}
                    style={{
                      cursor: 'pointer',
                      background: isCall ? 'rgba(255,59,92,0.04)' : isWarn ? 'rgba(245,158,11,0.03)' : undefined,
                      animation: isCall ? 'rowPulseRed 1.5s infinite' : undefined,
                    }}
                  >
                    <td style={{ color: 'var(--fg3)', fontSize: 10, textAlign: 'center' }}>{isExpanded ? '▼' : '▶'}</td>
                    <td style={{ color: 'var(--fg1)', fontWeight: 600 }}>{c.name}</td>
                    <td><span className={`tier-${c.type.toLowerCase()}`}>{c.type}</span></td>
                    <td style={{ fontWeight: 600 }}>{fmtMoney(c.equity)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 48, height: 3, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(c.margin, 100)}%`, height: '100%', background: marginColor(c.margin), borderRadius: 2 }} />
                        </div>
                        <span style={{ color: marginColor(c.margin), fontWeight: 700, fontSize: 11 }}>{c.margin}%</span>
                      </div>
                    </td>
                    <td style={{ color: c.floatPnl >= 0 ? 'var(--bull)' : 'var(--bear)', fontWeight: 600 }}>
                      {c.floatPnl >= 0 ? '+' : ''}{fmtMoney(c.floatPnl)}
                    </td>
                    <td style={{ color: 'var(--fg2)' }}>{c.positions}</td>
                    <td style={{ color: 'var(--fg2)' }}>{c.volumeToday.toFixed(1)} lots</td>
                    <td className="cell-muted">{c.lastTrade}</td>
                    <td>{statusBadge(c.status)}</td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${c.id}-detail`} style={{ background: 'var(--bg-elevated)' }}>
                      <td colSpan={10} style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16 }}>

                          {/* Column 1: Account Summary */}
                          <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg3)', marginBottom: 8 }}>ACCOUNT SUMMARY</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontFamily: 'var(--font-data)', fontSize: 11 }}>
                              {[
                                { label: 'BALANCE',      value: fmtMoney(c.balance),    color: 'var(--fg1)' },
                                { label: 'EQUITY',       value: fmtMoney(c.equity),     color: 'var(--fg1)' },
                                { label: 'FLOAT P&L',   value: (c.floatPnl >= 0 ? '+' : '') + fmtMoney(c.floatPnl), color: c.floatPnl >= 0 ? 'var(--bull)' : 'var(--bear)' },
                                { label: 'MARGIN',       value: `${c.margin}%`,          color: marginColor(c.margin) },
                                { label: 'POSITIONS',    value: String(c.positions),     color: 'var(--fg1)' },
                                { label: 'VOL TODAY',    value: `${c.volumeToday.toFixed(2)} lots`, color: 'var(--fg2)' },
                              ].map(item => (
                                <div key={item.label}>
                                  <div style={{ color: 'var(--fg3)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{item.label}</div>
                                  <div style={{ color: item.color, fontWeight: 700 }}>{item.value}</div>
                                </div>
                              ))}
                            </div>
                            {isCall && (
                              <div style={{ marginTop: 8, padding: '5px 8px', borderRadius: 'var(--r-sm)', background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)', fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--bear)', fontWeight: 600 }}>
                                ⚠ MARGIN CALL — level {c.margin}% below minimum (30%)
                              </div>
                            )}
                            {isWarn && (
                              <div style={{ marginTop: 8, padding: '5px 8px', borderRadius: 'var(--r-sm)', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--warn)', fontWeight: 600 }}>
                                ⚠ MARGIN WARNING — level {c.margin}% approaching threshold
                              </div>
                            )}
                          </div>

                          {/* Column 2: Recent Trades */}
                          <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg3)', marginBottom: 8 }}>RECENT TRADES</div>
                            {recentTrades.length === 0 ? (
                              <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg3)' }}>No recent executions</div>
                            ) : (
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-data)', fontSize: 10 }}>
                                <thead>
                                  <tr>
                                    {['TIME', 'SYMBOL', 'SIDE', 'LOTS'].map(h => (
                                      <th key={h} style={{ padding: '2px 4px', borderBottom: '1px solid var(--border)', textAlign: 'left', fontSize: 9, color: 'var(--fg3)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {recentTrades.map(ex => (
                                    <tr key={ex.id}>
                                      <td style={{ padding: '3px 4px', borderBottom: '1px solid var(--border)', color: 'var(--fg3)', fontSize: 9 }}>{ex.time.slice(0, 8)}</td>
                                      <td style={{ padding: '3px 4px', borderBottom: '1px solid var(--border)', color: 'var(--fg1)', fontWeight: 600 }}>{ex.symbol}</td>
                                      <td style={{ padding: '3px 4px', borderBottom: '1px solid var(--border)', color: ex.side === 'BUY' ? 'var(--bull)' : 'var(--bear)', fontWeight: 700 }}>{ex.side}</td>
                                      <td style={{ padding: '3px 4px', borderBottom: '1px solid var(--border)', color: 'var(--fg2)' }}>{ex.lots.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>

                          {/* Column 3: Quick Actions */}
                          <div style={{ minWidth: 160 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg3)', marginBottom: 8 }}>QUICK ACTIONS</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {QUICK_ACTIONS.map(qa => (
                                <button
                                  key={qa.label}
                                  onClick={e => { e.stopPropagation(); addToast({ type: 'warn', icon: '⚡', title: qa.label, msg: qa.msg(c.name) }); }}
                                  style={{ padding: '5px 10px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, cursor: 'pointer', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'all 0.12s', border: `1px solid ${qa.color}40`, background: `${qa.color}10`, color: qa.color }}
                                >
                                  {qa.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
