/**
 * File:        apps/dealer-workstation/src/components/desk-shell/status-bar.tsx
 * Module:      dealer-workstation · Desk Shell
 * Purpose:     Bottom status bar — system connectivity dots, total positions, margin summary,
 *              and next economic event countdown.
 *
 * Exports:
 *   - StatusBar() — 24px bottom strip
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useDeskData } from '../../lib/mock-data-context';

function SbItem({ children, noBorder }: { children: React.ReactNode; noBorder?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', borderRight: noBorder ? 'none' : '1px solid var(--border)', fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)', whiteSpace: 'nowrap' }}>
      {children}
    </div>
  );
}

export function StatusBar() {
  const { clients, lpProviders, bookPositions, pendingOrders, executions } = useDeskData();

  const totalPositions = clients.reduce((acc, c) => acc + c.positions, 0);
  const totalEquity = clients.reduce((acc, c) => acc + c.equity, 0);
  const marginCalls = clients.filter(c => c.status === 'MARGIN_CALL').length;
  const todayPnl = executions.slice(0, 20).reduce((acc, e) => acc + e.pnlImpact, 0);
  const connectedLPs = lpProviders.filter(lp => lp.status === 'CONNECTED').length;

  return (
    <div style={{ height: 24, background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 12px', overflow: 'hidden', zIndex: 100 }}>

      {/* System connections */}
      {lpProviders.map(lp => (
        <SbItem key={lp.id}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: lp.status === 'CONNECTED' ? 'var(--bull)' : 'var(--bear)', animation: lp.status === 'CONNECTED' ? 'pulseDot 3s infinite' : undefined }} />
          <span style={{ color: 'var(--fg2)' }}>{lp.name}</span>
          {lp.latency && <span>{lp.latency}ms</span>}
        </SbItem>
      ))}

      <SbItem>
        <span style={{ color: 'var(--fg2)' }}>LPs:</span>
        <span style={{ color: connectedLPs === lpProviders.length ? 'var(--bull)' : 'var(--warn)', fontWeight: 600 }}>{connectedLPs}/{lpProviders.length}</span>
      </SbItem>

      <SbItem>
        <span style={{ color: 'var(--fg2)' }}>POSITIONS:</span>
        <span style={{ color: 'var(--fg1)', fontWeight: 600 }}>{totalPositions}</span>
      </SbItem>

      <SbItem>
        <span style={{ color: 'var(--fg2)' }}>CLIENTS:</span>
        <span style={{ color: 'var(--fg1)', fontWeight: 600 }}>{clients.length}</span>
      </SbItem>

      {marginCalls > 0 && (
        <SbItem>
          <span style={{ color: 'var(--bear)', fontWeight: 700, animation: 'warnPulse 1.5s infinite' }}>MCL: {marginCalls}</span>
        </SbItem>
      )}

      <SbItem>
        <span style={{ color: 'var(--fg2)' }}>QUEUE:</span>
        <span style={{ color: pendingOrders.length > 5 ? 'var(--warn)' : 'var(--fg1)', fontWeight: 600 }}>{pendingOrders.length}</span>
      </SbItem>

      <SbItem>
        <span style={{ color: 'var(--fg2)' }}>DESK P&amp;L:</span>
        <span style={{ color: todayPnl >= 0 ? 'var(--bull)' : 'var(--bear)', fontWeight: 600 }}>
          {todayPnl >= 0 ? '+' : ''}${Math.abs(todayPnl).toLocaleString()}
        </span>
      </SbItem>

      <SbItem>
        <span style={{ color: 'var(--fg2)' }}>EQUITY:</span>
        <span style={{ color: 'var(--fg1)', fontWeight: 600 }}>${(totalEquity / 1e6).toFixed(2)}M</span>
      </SbItem>

      {/* Economic event */}
      <SbItem noBorder>
        <span style={{ color: 'var(--warn)', fontWeight: 700 }}>⚡ CPI YoY</span>
        <span style={{ color: 'var(--warn)' }}>in 7 min</span>
      </SbItem>

      {/* Right side system status */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--bull)', animation: 'pulseDot 3s infinite' }} />
        SYSTEM NORMAL
      </div>
    </div>
  );
}
