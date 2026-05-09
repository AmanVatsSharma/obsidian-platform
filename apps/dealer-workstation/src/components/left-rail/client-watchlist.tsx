/**
 * File:        apps/dealer-workstation/src/components/left-rail/client-watchlist.tsx
 * Module:      dealer-workstation · Left Rail
 * Purpose:     Mini client watchlist in the bottom ~35% of the left rail — shows pinned high-priority
 *              clients sorted by margin health with status-coded left border.
 *
 * Exports:
 *   - ClientWatchlist() — watchlist section (bottom of left rail)
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useDeskData } from '../../lib/mock-data-context';
import { WATCHLIST_CLIENT_IDS } from '../../lib/mock-data';

function fmtMoney(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function ClientWatchlist() {
  const { clients } = useDeskData();

  const watchlist = WATCHLIST_CLIENT_IDS
    .map(id => clients.find(c => c.id === id))
    .filter(Boolean) as typeof clients;

  const borderColor = (status: string) => {
    if (status === 'MARGIN_CALL')    return 'var(--bear)';
    if (status === 'MARGIN_WARNING') return 'var(--warn)';
    return 'var(--bull)';
  };

  const rowBg = (status: string) => {
    if (status === 'MARGIN_CALL')    return 'rgba(255,59,92,0.04)';
    if (status === 'MARGIN_WARNING') return 'rgba(245,158,11,0.03)';
    return 'transparent';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, borderTop: '2px solid var(--border-md)', overflow: 'hidden', minHeight: 0 }}>
      <div className="rail-header">
        <div className="rail-title">CLIENT WATCHLIST</div>
        <span className="count-badge">{watchlist.length}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {watchlist.map(c => (
          <div
            key={c.id}
            style={{ display: 'flex', alignItems: 'center', padding: '5px 10px 5px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', position: 'relative', background: rowBg(c.status), transition: 'background 0.1s', animation: c.status === 'MARGIN_CALL' ? 'rowPulseRed 1.5s infinite' : undefined }}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: borderColor(c.status), animation: c.status === 'MARGIN_CALL' ? 'warnPulse 1s infinite' : c.status === 'MARGIN_WARNING' ? 'warnPulse 2s infinite' : undefined }} />
            <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--fg1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-data)' }}>
              {c.name}
            </div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg2)', minWidth: 60, textAlign: 'right' }}>
              {fmtMoney(c.equity)}
            </div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, minWidth: 36, textAlign: 'right', color: c.margin < 30 ? 'var(--bear)' : c.margin < 50 ? 'var(--warn)' : 'var(--bull)' }}>
              {c.margin}%
            </div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, minWidth: 55, textAlign: 'right', color: c.floatPnl >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
              {c.floatPnl >= 0 ? '+' : ''}${Math.abs(c.floatPnl).toLocaleString()}
            </div>
            {c.status !== 'NORMAL' && (
              <span className={c.status === 'MARGIN_CALL' ? 'status-call' : 'status-warning'} style={{ marginLeft: 6 }}>
                {c.status === 'MARGIN_CALL' ? 'MCL' : 'WRN'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
