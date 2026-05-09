/**
 * File:        apps/dealer-workstation/src/components/right-rail/delta-hedge.tsx
 * Module:      dealer-workstation · Right Rail
 * Purpose:     Delta hedge panel — per-symbol net delta rows with directional
 *              exposure and individual / bulk hedge-all actions.
 *
 * Exports:
 *   - DeltaHedge() — delta hedge panel
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useDeskData } from '../../lib/mock-data-context';

function fmtMoney(n: number): string {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function DeltaHedge() {
  const { bookPositions, instruments, addToast } = useDeskData();

  const rows = bookPositions.map(b => {
    const inst        = instruments.find(i => i.symbol === b.symbol);
    const currentBid  = inst?.bid ?? b.current;
    const net         = b.longLots - b.shortLots;
    const notionalUsd = net * (b.symbol === 'XAU/USD' ? currentBid * 100 : b.symbol === 'US500' ? currentBid * 10 : b.symbol === 'BTC/USD' ? currentBid : 100000);
    const needsHedge  = Math.abs(net) > b.limit * 0.5;
    return { symbol: b.symbol, net, notionalUsd, needsHedge };
  });

  const totalNetUsd = rows.reduce((acc, r) => acc + r.notionalUsd, 0);

  function hedgeSymbol(symbol: string, net: number) {
    const dir = net > 0 ? 'SELL' : 'BUY';
    addToast({ type: 'warn', icon: '⚡', title: 'Hedge Sent', msg: `${dir} ${Math.abs(net).toFixed(2)} lots ${symbol} → LP1` });
  }

  function hedgeAll() {
    const exposed = rows.filter(r => r.needsHedge);
    if (exposed.length === 0) {
      addToast({ type: 'info', icon: '✓', title: 'No Action', msg: 'All positions within hedge threshold.' });
      return;
    }
    exposed.forEach(r => hedgeSymbol(r.symbol, r.net));
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div className="right-title" style={{ marginBottom: 0 }}>DELTA HEDGE</div>
        <button
          onClick={hedgeAll}
          style={{ padding: '3px 8px', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, cursor: 'pointer', borderRadius: 'var(--r-sm)', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.08)', color: 'var(--warn)' }}
        >HEDGE ALL</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {rows.map(r => (
          <div key={r.symbol} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 6px', background: r.needsHedge ? 'rgba(245,158,11,0.05)' : 'var(--bg-elevated)', border: `1px solid ${r.needsHedge ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`, borderRadius: 'var(--r-sm)' }}>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, color: 'var(--fg1)', width: 60 }}>{r.symbol.replace('/USD', '').replace('US', 'SPX')}</span>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: r.net > 0 ? 'var(--bull)' : r.net < 0 ? 'var(--bear)' : 'var(--fg3)', fontWeight: 600, width: 60, textAlign: 'right' }}>
              {r.net > 0 ? '+' : ''}{r.net.toFixed(2)}L
            </span>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)', width: 56, textAlign: 'right' }}>
              {fmtMoney(Math.abs(r.notionalUsd))}
            </span>
            <button
              onClick={() => hedgeSymbol(r.symbol, r.net)}
              disabled={r.net === 0}
              style={{ padding: '2px 6px', fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, cursor: r.net !== 0 ? 'pointer' : 'not-allowed', borderRadius: 'var(--r-sm)', border: `1px solid ${r.needsHedge ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`, background: r.needsHedge ? 'rgba(245,158,11,0.1)' : 'var(--bg-panel)', color: r.needsHedge ? 'var(--warn)' : 'var(--fg3)' }}
            >HDG</button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
        <span>TOTAL NET DELTA</span>
        <span style={{ color: Math.abs(totalNetUsd) > 500000 ? 'var(--warn)' : 'var(--fg2)', fontWeight: 700 }}>
          {totalNetUsd >= 0 ? '+' : ''}{fmtMoney(totalNetUsd)}
        </span>
      </div>
    </div>
  );
}
