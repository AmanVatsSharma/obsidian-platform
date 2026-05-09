/**
 * File:        apps/dealer-workstation/src/components/right-rail/lp-status.tsx
 * Module:      dealer-workstation · Right Rail
 * Purpose:     Liquidity provider status panel — shows each LP's connection state,
 *              latency, uptime, and execution count; reconnect button for disconnected LPs.
 *
 * Exports:
 *   - LpStatus() — LP connection panel
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { useDeskData } from '../../lib/mock-data-context';

export function LpStatus() {
  const { lpProviders, addToast } = useDeskData();
  const [reconnecting, setReconnecting] = useState<Set<string>>(new Set());

  function handleReconnect(id: string, name: string) {
    setReconnecting(prev => new Set(prev).add(id));
    addToast({ type: 'warn', icon: '🔌', title: 'Reconnecting', msg: `Attempting to reconnect ${name}…` });
    setTimeout(() => {
      setReconnecting(prev => { const n = new Set(prev); n.delete(id); return n; });
      addToast({ type: 'warn', icon: '⚠', title: 'Reconnect Failed', msg: `${name} still unreachable. Contact LP ops.` });
    }, 3000);
  }

  return (
    <div>
      <div className="right-title">LP STATUS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {lpProviders.map(lp => {
          const connected     = lp.status === 'CONNECTED';
          const isReconnecting = reconnecting.has(lp.id);

          return (
            <div key={lp.id} style={{ background: 'var(--bg-elevated)', border: `1px solid ${connected ? 'var(--border)' : 'rgba(255,59,92,0.3)'}`, borderRadius: 'var(--r-sm)', padding: '7px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: connected ? 'var(--bull)' : 'var(--bear)', animation: connected ? 'pulseDot 2s infinite' : undefined }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--fg1)' }}>{lp.name}</span>
                </div>
                {connected
                  ? <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--bull)', fontWeight: 700 }}>{lp.latency}ms</span>
                  : <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, color: 'var(--bear)', textTransform: 'uppercase' }}>DISCONNECTED</span>
                }
              </div>
              <div style={{ display: 'flex', gap: 12, fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)' }}>
                <span>UPTIME: <span style={{ color: 'var(--fg2)' }}>{lp.uptime.toFixed(2)}%</span></span>
                <span>EXECS: <span style={{ color: 'var(--fg2)' }}>{lp.executions}</span></span>
              </div>
              {!connected && (
                <button
                  onClick={() => handleReconnect(lp.id, lp.name)}
                  disabled={isReconnecting}
                  style={{ marginTop: 6, width: '100%', padding: '4px 0', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, cursor: isReconnecting ? 'not-allowed' : 'pointer', border: '1px solid rgba(255,59,92,0.4)', background: 'rgba(255,59,92,0.08)', color: 'var(--bear)' }}
                >{isReconnecting ? 'RECONNECTING…' : 'RECONNECT'}</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
