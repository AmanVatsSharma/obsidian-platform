/**
 * File:        apps/dealer-workstation/src/components/workspace/tabs/book-tab.tsx
 * Module:      dealer-workstation · Workspace
 * Purpose:     Book tab — net positions per instrument, rich 6-stat summary bar (total book/long/short/P&L/hedge/positions),
 *              per-symbol stats table with PnL and limit utilisation, and Apply Delta Hedge + Flatten Book action buttons.
 *
 * Exports:
 *   - BookTab() — book positions panel
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useDeskData } from '../../../lib/mock-data-context';

const BOOK_PNL_FIXED = 12847;

function fmtMoney(n: number): string {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPrice(symbol: string, price: number): string {
  if (symbol.includes('JPY') || symbol === 'XAU/USD') return price.toFixed(3);
  if (symbol === 'BTC/USD' || symbol === 'US500') return price.toFixed(1);
  return price.toFixed(5);
}

export function BookTab() {
  const { bookPositions, instruments, addToast } = useDeskData();

  const totalBBook = bookPositions.reduce((acc, b) => acc + b.bBook, 0) / bookPositions.length;
  const totalABook = 100 - totalBBook;
  const totalLong  = bookPositions.reduce((s, b) => s + b.longLots  * 100000, 0);
  const totalShort = bookPositions.reduce((s, b) => s + b.shortLots * 100000, 0);
  const openPos    = bookPositions.reduce((s, b) => s + b.clients, 0);

  return (
    <div style={{ padding: 12, height: '100%', overflowY: 'auto' }}>
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 16, padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', marginBottom: 10, fontFamily: 'var(--font-data)', fontSize: 11, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>TOTAL BOOK</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg1)' }}>{fmtMoney(totalLong + totalShort)}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>NET LONG</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bull)' }}>{fmtMoney(totalLong)}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>NET SHORT</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bear)' }}>{fmtMoney(totalShort)}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>BOOK P&L</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bull)' }}>+${BOOK_PNL_FIXED.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>B-BOOK / A-BOOK</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{totalBBook.toFixed(0)}% / {totalABook.toFixed(0)}%</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>OPEN POSITIONS</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg1)' }}>{openPos}</div>
        </div>
        <div style={{ flex: 1, minWidth: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${totalBBook}%`, background: 'var(--accent)', transition: 'width 0.5s' }} />
            <div style={{ flex: 1, background: 'var(--bull)' }} />
          </div>
        </div>
      </div>

      {/* Positions table */}
      <table className="desk-table">
        <thead>
          <tr>
            <th>SYMBOL</th>
            <th>LONG (lots)</th>
            <th>SHORT (lots)</th>
            <th>NET</th>
            <th>AVG OPEN</th>
            <th>CURRENT</th>
            <th>P&amp;L</th>
            <th>LIMIT UTIL</th>
            <th>LP EXPOSURE</th>
            <th>CLIENTS</th>
          </tr>
        </thead>
        <tbody>
          {bookPositions.map(b => {
            const inst = instruments.find(i => i.symbol === b.symbol);
            const current = inst?.bid ?? b.current;
            const net = b.longLots - b.shortLots;
            const pipVal = b.symbol.includes('JPY') ? 100 : b.symbol === 'XAU/USD' ? 1 : b.symbol === 'BTC/USD' ? 0.0001 : 100000;
            const pnl = net * (current - b.avgOpen) * pipVal;
            const netUsd = Math.abs(net) * (b.symbol === 'XAU/USD' ? current * 100 : b.symbol === 'US500' ? current * 10 : b.symbol === 'BTC/USD' ? current : 100000);
            const limitUtil = (Math.abs(net) / b.limit) * 100;
            return (
              <tr key={b.symbol}>
                <td style={{ fontWeight: 700, color: 'var(--fg1)', fontFamily: 'var(--font-display)' }}>{b.symbol}</td>
                <td className="cell-bull">{b.longLots.toFixed(2)}</td>
                <td className="cell-bear">{b.shortLots.toFixed(2)}</td>
                <td style={{ color: net > 0 ? 'var(--bull)' : net < 0 ? 'var(--bear)' : 'var(--fg3)', fontWeight: 700 }}>
                  {net > 0 ? '+' : ''}{net.toFixed(2)}
                </td>
                <td className="cell-muted">{fmtPrice(b.symbol, b.avgOpen)}</td>
                <td>{fmtPrice(b.symbol, current)}</td>
                <td style={{ color: pnl >= 0 ? 'var(--bull)' : 'var(--bear)', fontWeight: 600 }}>
                  {pnl >= 0 ? '+' : ''}{fmtMoney(pnl)}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 60, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(limitUtil, 100)}%`, height: '100%', background: limitUtil > 80 ? 'var(--bear)' : limitUtil > 60 ? 'var(--warn)' : 'var(--bull)', borderRadius: 2, transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ color: limitUtil > 80 ? 'var(--bear)' : limitUtil > 60 ? 'var(--warn)' : 'var(--fg2)', fontWeight: 600 }}>{limitUtil.toFixed(0)}%</span>
                  </div>
                </td>
                <td style={{ color: b.lpExposure > 0 ? 'var(--warn)' : 'var(--fg3)' }}>
                  {b.lpExposure > 0 ? `${b.lpExposure} lots` : '—'}
                </td>
                <td className="cell-muted">{b.clients}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={() => addToast({ type: 'warn', icon: '⚡', title: 'DELTA HEDGE APPLIED', msg: 'Sending hedge orders for all net exposures to LP1' })}
          style={{ flex: 1, padding: '7px 12px', borderRadius: 'var(--r-sm)', border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.08)', color: 'var(--accent)', fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.15s' }}
        >
          ⚡ APPLY DELTA HEDGE
        </button>
        <button
          onClick={() => addToast({ type: 'warn', icon: '⚠', title: 'FLATTEN BOOK', msg: 'Use the FLATTEN emergency function in the top command bar' })}
          style={{ flex: 1, padding: '7px 12px', borderRadius: 'var(--r-sm)', border: '1px solid rgba(255,59,92,0.35)', background: 'rgba(255,59,92,0.06)', color: 'var(--bear)', fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.15s' }}
        >
          ⚠ FLATTEN BOOK
        </button>
      </div>
    </div>
  );
}
