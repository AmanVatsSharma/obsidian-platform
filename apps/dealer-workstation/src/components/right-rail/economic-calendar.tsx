/**
 * File:        apps/dealer-workstation/src/components/right-rail/economic-calendar.tsx
 * Module:      dealer-workstation · Right Rail
 * Purpose:     Economic calendar — upcoming macro events with impact coloring,
 *              countdown for future events, prev/forecast/actual data, and a
 *              WIDEN SPREADS quick-action button on imminent HIGH-impact events.
 *
 * Exports:
 *   - EconomicCalendar() — macro calendar panel
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useDeskData } from '../../lib/mock-data-context';

function impactColor(impact: string): string {
  if (impact === 'HIGH')   return 'var(--bear)';
  if (impact === 'MEDIUM') return 'var(--warn)';
  return 'var(--fg3)';
}

function impactDot(impact: string) {
  return (
    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: impactColor(impact), flexShrink: 0 }} />
  );
}

export function EconomicCalendar() {
  const { economicEvents, addToast } = useDeskData();

  const sorted = [...economicEvents].sort((a, b) => a.minutesAway - b.minutesAway);

  return (
    <div>
      <div className="right-title">ECONOMIC CALENDAR</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {sorted.map(evt => {
          const upcoming = evt.minutesAway > 0;
          const imminent = upcoming && evt.minutesAway <= 10;
          const isHighUpcoming = upcoming && evt.impact === 'HIGH';

          return (
            <div key={evt.id} style={{ background: imminent ? 'rgba(245,158,11,0.06)' : 'var(--bg-elevated)', border: `1px solid ${imminent ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`, borderRadius: 'var(--r-sm)', padding: '6px 8px' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                {impactDot(evt.impact)}
                <span style={{ fontSize: 13 }}>{evt.flag}</span>
                <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, color: 'var(--fg1)', flex: 1 }}>{evt.name}</span>
                <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: upcoming ? (imminent ? 'var(--warn)' : 'var(--fg3)') : 'var(--fg3)' }}>
                  {upcoming
                    ? (imminent ? `⚡ ${evt.minutesAway}m` : `${evt.minutesAway}m`)
                    : `${evt.time}`}
                </span>
              </div>
              {/* Prev / Forecast / Actual */}
              <div style={{ display: 'flex', gap: 10, fontFamily: 'var(--font-data)', fontSize: 10, marginBottom: isHighUpcoming ? 6 : 0 }}>
                <span style={{ color: 'var(--fg3)' }}>
                  PREV: <span style={{ color: 'var(--fg2)' }}>{evt.previous ?? '—'}</span>
                </span>
                <span style={{ color: 'var(--fg3)' }}>
                  FCST: <span style={{ color: 'var(--accent)' }}>{evt.forecast ?? '—'}</span>
                </span>
                {evt.actual !== null && (
                  <span style={{ color: 'var(--fg3)' }}>
                    ACT: <span style={{ color: 'var(--bull)', fontWeight: 700 }}>{evt.actual}</span>
                  </span>
                )}
              </div>
              {/* WIDEN SPREADS action for upcoming HIGH-impact events */}
              {isHighUpcoming && (
                <button
                  onClick={() => addToast({ type: 'warn', icon: '⚡', title: 'SPREADS WIDENED', msg: `Spreads widened for ${evt.name} — ${evt.minutesAway}m to release` })}
                  style={{ width: '100%', padding: '3px 0', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, border: `1px solid ${imminent ? 'rgba(245,158,11,0.5)' : 'rgba(245,158,11,0.3)'}`, background: `${imminent ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.06)'}`, color: 'var(--warn)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.15s' }}
                >
                  WIDEN SPREADS
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
