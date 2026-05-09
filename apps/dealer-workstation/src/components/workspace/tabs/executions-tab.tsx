/**
 * File:        apps/dealer-workstation/src/components/workspace/tabs/executions-tab.tsx
 * Module:      dealer-workstation · Workspace
 * Purpose:     Execution log tab — filterable fill blotter with route badges, slippage,
 *              latency coloring (red > 50ms), and P&L impact per fill.
 *
 * Exports:
 *   - ExecutionsTab() — execution blotter panel
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { useDeskData } from '../../../lib/mock-data-context';
import type { ExecRoute } from '../../../lib/types';

function fmtPrice(symbol: string, price: number | null): string {
  if (price === null) return '—';
  if (symbol.includes('JPY') || symbol === 'XAU/USD') return price.toFixed(3);
  if (symbol === 'BTC/USD' || symbol === 'US500') return price.toFixed(1);
  return price.toFixed(5);
}

const ROUTES: (ExecRoute | 'ALL')[] = ['ALL', 'AUTO', 'MANUAL', 'STP', 'TIMEOUT'];
const SYMBOLS = ['ALL', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'BTC/USD', 'US500'];

export function ExecutionsTab() {
  const { executions } = useDeskData();
  const [routeFilter, setRouteFilter] = useState<ExecRoute | 'ALL'>('ALL');
  const [symbolFilter, setSymbolFilter] = useState('ALL');

  const filtered = executions.filter(e =>
    (routeFilter === 'ALL' || e.route === routeFilter) &&
    (symbolFilter === 'ALL' || e.symbol === symbolFilter)
  );

  const stpCount  = filtered.filter(e => e.route === 'STP').length;
  const autoCount = filtered.filter(e => e.route === 'AUTO').length;
  const manCount  = filtered.filter(e => e.route === 'MANUAL').length;
  const toCount   = filtered.filter(e => e.route === 'TIMEOUT').length;

  const filled = filtered.filter(e => e.fillPrice !== null);
  const totalLots = filled.reduce((s, e) => s + e.lots, 0);
  const slipArr   = filtered.filter(e => e.slippage !== null).map(e => e.slippage as number);
  const latArr    = filtered.filter(e => e.latency !== null).map(e => e.latency as number);
  const avgSlip   = slipArr.length ? slipArr.reduce((s, v) => s + v, 0) / slipArr.length : 0;
  const avgLat    = latArr.length  ? latArr.reduce((s, v) => s + v, 0)  / latArr.length  : 0;
  const stpRatio  = filtered.length ? Math.round((stpCount / filtered.length) * 100) : 0;

  return (
    <div style={{ padding: '8px 12px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {ROUTES.map(r => (
            <button key={r} onClick={() => setRouteFilter(r)}
              style={{ padding: '3px 8px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 600, border: '1px solid', borderColor: routeFilter === r ? 'var(--accent)' : 'var(--border)', background: routeFilter === r ? 'var(--accent-dim)' : 'var(--bg-panel)', color: routeFilter === r ? 'var(--accent)' : 'var(--fg3)', cursor: 'pointer', textTransform: 'uppercase' }}
            >{r}</button>
          ))}
        </div>
        <select value={symbolFilter} onChange={e => setSymbolFilter(e.target.value)}
          style={{ padding: '3px 8px', fontSize: 11, borderRadius: 'var(--r-sm)' }}>
          {SYMBOLS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Aggregation row */}
      <div style={{ display: 'flex', gap: 16, padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', marginBottom: 8, fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg2)', flexShrink: 0, flexWrap: 'wrap' }}>
        <span>Showing: <strong style={{ color: 'var(--fg1)' }}>{filtered.length}</strong> trades</span>
        <span>Lots: <strong style={{ color: 'var(--fg1)' }}>{totalLots.toFixed(1)}</strong></span>
        <span>Avg slip: <strong style={{ color: avgSlip >= 0 ? 'var(--bull)' : 'var(--bear)' }}>{avgSlip >= 0 ? '+' : ''}{avgSlip.toFixed(1)} pips</strong></span>
        <span>Avg latency: <strong style={{ color: 'var(--fg1)' }}>{avgLat.toFixed(0)}ms</strong></span>
        <span>STP ratio: <strong style={{ color: 'var(--bull)' }}>{stpRatio}%</strong></span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, color: 'var(--fg3)' }}>
          <span>STP: <span className="route-stp" style={{ padding: '1px 4px' }}>{stpCount}</span></span>
          <span>AUTO: <span className="route-auto" style={{ padding: '1px 4px' }}>{autoCount}</span></span>
          <span>MAN: <span className="route-manual" style={{ padding: '1px 4px' }}>{manCount}</span></span>
          {toCount > 0 && <span>TO: <span className="route-timeout" style={{ padding: '1px 4px' }}>{toCount}</span></span>}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <table className="desk-table">
          <thead>
            <tr>
              <th>TIME</th><th>CLIENT</th><th>SYMBOL</th><th>SIDE</th>
              <th>LOTS</th><th>FILL</th><th>MKT</th><th>SLIP</th>
              <th>LATENCY</th><th>ROUTE</th><th>LP</th><th>DEALER</th><th>P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} className={e.route === 'TIMEOUT' ? 'flash-red' : ''}>
                <td className="cell-muted">{e.time}</td>
                <td style={{ color: 'var(--fg1)' }}>{e.clientId}</td>
                <td style={{ fontWeight: 600, color: 'var(--fg1)' }}>{e.symbol}</td>
                <td style={{ color: e.side === 'BUY' ? 'var(--bull)' : 'var(--bear)', fontWeight: 700 }}>{e.side}</td>
                <td>{e.lots.toFixed(2)}</td>
                <td>{e.fillPrice ? fmtPrice(e.symbol, e.fillPrice) : <span className="cell-bear">TIMEOUT</span>}</td>
                <td className="cell-muted">{fmtPrice(e.symbol, e.marketPrice)}</td>
                <td style={{ color: e.slippage == null ? 'var(--fg3)' : e.slippage >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                  {e.slippage == null ? '—' : `${e.slippage >= 0 ? '+' : ''}${e.slippage}`}
                </td>
                <td style={{ color: e.latency == null ? 'var(--fg3)' : e.latency > 50 ? 'var(--bear)' : e.latency > 20 ? 'var(--warn)' : 'var(--bull)', fontWeight: 600 }}>
                  {e.latency == null ? '—' : `${e.latency}ms`}
                </td>
                <td><span className={`route-${e.route.toLowerCase()}`}>{e.route}</span></td>
                <td className="cell-muted">{e.lp}</td>
                <td className="cell-muted">{e.dealer}</td>
                <td style={{ color: e.pnlImpact >= 0 ? 'var(--bull)' : 'var(--bear)', fontWeight: 600 }}>
                  {e.pnlImpact !== 0 ? `${e.pnlImpact >= 0 ? '+' : ''}$${Math.abs(e.pnlImpact)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
