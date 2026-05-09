/**
 * File:        apps/dealer-workstation/src/components/desk-shell/cmd-bar.tsx
 * Module:      dealer-workstation · Desk Shell
 * Purpose:     Top command bar — clock, shift timer, market sessions, latency, dealer identity,
 *              spread/auto toggles, STP mode indicator, B-BOOK exposure, MARGIN CALLS count,
 *              theme switcher, and 4 emergency action buttons.
 *
 * Exports:
 *   - CmdBar({ onEmergency, onShowKb }) — full-width top bar component
 *
 * Side-effects: setInterval for clock (1s) and shift timer (1s)
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useDeskData } from '../../lib/mock-data-context';
import { useObsidian } from '@obsidian/obsidian-ui';

type EmergencyAction = 'HALT' | 'WIDEN' | 'SUSPEND' | 'FLATTEN';

interface CmdBarProps {
  onEmergency: (action: EmergencyAction) => void;
  onShowKb: () => void;
}

function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function useShiftTimer() {
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState('00:00:00');
  useEffect(() => {
    const id = setInterval(() => {
      const secs = Math.floor((Date.now() - startRef.current) / 1000);
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return elapsed;
}

const SESSIONS = [
  { label: 'SYDNEY',   open: false },
  { label: 'TOKYO',    open: false },
  { label: 'LONDON',   open: true  },
  { label: 'NEW YORK', open: true  },
];

export function CmdBar({ onEmergency, onShowKb }: CmdBarProps) {
  const time      = useClock();
  const shiftTime = useShiftTimer();
  const { autoAccept, setAutoAccept, spreadMultiplier, setSpreadMultiplier, haltTrading, setHaltTrading,
          pendingOrders, surveillanceAlerts, executions, bookPositions, clients } = useDeskData();
  const { theme, setTheme } = useObsidian();

  const highAlerts      = surveillanceAlerts.filter(a => a.severity === 'HIGH' && a.status !== 'DISMISSED').length;
  const marginCallCount = clients.filter(c => c.status === 'MARGIN_CALL').length;

  /* STP mode derived from recent execution routes */
  const stpCount = executions.filter(e => e.route === 'STP').length;
  const autoCount = executions.filter(e => e.route === 'AUTO').length;
  const autoStpPct = executions.length ? (stpCount + autoCount) / executions.length : 0;
  const stpMode  = autoStpPct > 0.75 ? 'ON' : autoStpPct > 0.45 ? 'MIXED' : 'OFF';
  const stpColor = stpMode === 'ON' ? 'var(--bull)' : stpMode === 'MIXED' ? 'var(--warn)' : 'var(--bear)';

  /* B-BOOK average exposure % */
  const avgBBook = bookPositions.length
    ? Math.round(bookPositions.reduce((s, b) => s + b.bBook, 0) / bookPositions.length)
    : 0;
  const bBookExposure = bookPositions.reduce((s, b) => {
    const lots = Math.abs(b.longLots - b.shortLots);
    const val  = b.symbol === 'BTC/USD' ? lots * 67000 : b.symbol === 'XAU/USD' ? lots * 2318 * 100 : b.symbol === 'US500' ? lots * 5242 * 10 : lots * 100000;
    return s + val * (b.bBook / 100);
  }, 0);
  const bBookFmt = bBookExposure >= 1e6 ? `$${(bBookExposure / 1e6).toFixed(1)}M` : `$${(bBookExposure / 1e3).toFixed(0)}K`;

  return (
    <div style={{ height: 52, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 0, overflow: 'hidden', flexShrink: 0, zIndex: 100 }}>

      {/* Logo */}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', paddingRight: 16, borderRight: '1px solid var(--border)', marginRight: 12, whiteSpace: 'nowrap' }}>
        OBSIDIAN<span style={{ color: 'var(--fg3)', fontWeight: 400 }}> DESK</span>
      </div>

      {/* Clock */}
      <div style={{ fontFamily: 'var(--font-data)', fontSize: 15, fontWeight: 600, color: 'var(--fg1)', letterSpacing: '0.08em', marginRight: 8, minWidth: 70 }}>
        {time}
      </div>

      {/* Shift timer */}
      <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)', marginRight: 12, whiteSpace: 'nowrap' }}>
        SHIFT: <span style={{ color: 'var(--fg2)', fontWeight: 600 }}>{shiftTime}</span>
      </div>
      <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 10px', flexShrink: 0 }} />

      {/* Sessions */}
      <div style={{ display: 'flex', gap: 6, marginRight: 12 }}>
        {SESSIONS.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, border: '1px solid', borderColor: s.open ? 'rgba(16,217,150,0.4)' : 'var(--border)', background: s.open ? 'rgba(16,217,150,0.08)' : 'var(--bg-panel)', fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, color: s.open ? 'var(--bull)' : 'var(--fg3)', whiteSpace: 'nowrap' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0, ...(s.open ? { animation: 'pulseDot 2s infinite' } : {}) }} />
            {s.label}
          </div>
        ))}
      </div>
      <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 10px', flexShrink: 0 }} />

      {/* Latency */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 'var(--r-sm)', background: 'var(--bg-panel)', border: '1px solid rgba(16,217,150,0.3)', fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 600, color: 'var(--bull)', marginRight: 8 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--bull)', animation: 'pulseDot 1s infinite' }} />
        8ms
      </div>

      {/* STP mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 'var(--r-sm)', background: 'var(--bg-panel)', border: `1px solid ${stpColor}40`, fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, color: stpColor, marginRight: 8, whiteSpace: 'nowrap' }}>
        STP: {stpMode}
      </div>

      {/* B-BOOK exposure */}
      <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)', marginRight: 8, whiteSpace: 'nowrap' }}>
        B-BOOK: <span style={{ color: avgBBook > 65 ? 'var(--warn)' : 'var(--fg2)', fontWeight: 700 }}>{bBookFmt}</span>
      </div>

      {/* Queue count */}
      <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg3)', marginRight: 8 }}>
        <span style={{ color: pendingOrders.length > 0 ? 'var(--warn)' : 'var(--fg3)', fontWeight: 700 }}>{pendingOrders.length}</span>
        <span style={{ color: 'var(--fg3)' }}> queued</span>
      </div>

      {/* Margin calls counter */}
      {marginCallCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 'var(--r-sm)', border: '1px solid rgba(255,59,92,0.4)', background: 'rgba(255,59,92,0.08)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, color: 'var(--bear)', animation: 'warnPulse 2s infinite', marginRight: 8, whiteSpace: 'nowrap' }}>
          CALLS: {marginCallCount}
        </div>
      )}

      <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 10px', flexShrink: 0 }} />

      {/* Alerts indicator */}
      {highAlerts > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 'var(--r-sm)', border: '1px solid rgba(245,158,11,0.4)', color: 'var(--warn)', background: 'rgba(245,158,11,0.08)', fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, animation: 'warnPulse 3s infinite', marginRight: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          ⚠ {highAlerts} HIGH
        </div>
      )}

      {/* Auto-accept toggle */}
      <button
        onClick={() => setAutoAccept(!autoAccept)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 'var(--r-sm)', border: '1px solid', borderColor: autoAccept ? 'rgba(16,217,150,0.5)' : 'var(--border)', background: autoAccept ? 'rgba(16,217,150,0.08)' : 'var(--bg-panel)', color: autoAccept ? 'var(--bull)' : 'var(--fg3)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', marginRight: 6 }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', ...(autoAccept ? { animation: 'pulseDot 2s infinite' } : {}) }} />
        AUTO-ACCEPT
      </button>

      {/* Spread multiplier */}
      <button
        onClick={() => setSpreadMultiplier(spreadMultiplier === 1 ? 3 : 1)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 'var(--r-sm)', border: '1px solid', borderColor: spreadMultiplier > 1 ? 'rgba(245,158,11,0.5)' : 'var(--border)', background: spreadMultiplier > 1 ? 'rgba(245,158,11,0.08)' : 'var(--bg-panel)', color: spreadMultiplier > 1 ? 'var(--warn)' : 'var(--fg3)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', marginRight: 6 }}
      >
        SPREAD {spreadMultiplier > 1 ? `${spreadMultiplier}×` : '1×'}
      </button>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--fg3)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', marginRight: 6 }}
      >
        {theme === 'dark' ? '☀' : '◑'}
      </button>

      {/* Keyboard shortcut hint */}
      <button
        onClick={onShowKb}
        style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--fg3)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginRight: 6, whiteSpace: 'nowrap' }}
      >
        ?
      </button>

      {/* Dealer identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--bg-panel)', marginRight: 8, whiteSpace: 'nowrap' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', color: 'var(--accent)', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-data)', flexShrink: 0 }}>MC</div>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500, color: 'var(--fg1)' }}>M. Chen</span>
      </div>

      {/* Emergency buttons — push to far right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
        {(['HALT', 'WIDEN', 'SUSPEND', 'FLATTEN'] as EmergencyAction[]).map(action => (
          <button
            key={action}
            onClick={() => onEmergency(action)}
            style={{
              padding: '5px 10px', borderRadius: 'var(--r-sm)',
              fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700,
              border: `1px solid rgba(255,59,92,0.35)`,
              color: 'var(--bear)',
              background: action === 'HALT' && haltTrading ? 'rgba(255,59,92,0.15)' : 'rgba(255,59,92,0.06)',
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
