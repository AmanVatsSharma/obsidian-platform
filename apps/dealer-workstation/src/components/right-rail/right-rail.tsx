/**
 * File:        apps/dealer-workstation/src/components/right-rail/right-rail.tsx
 * Module:      dealer-workstation · Right Rail
 * Purpose:     Right rail container — stacks all 5 right-panel sections
 *              (Quote Desk, LP Status, Delta Hedge, Economic Calendar, News Feed)
 *              in a vertically scrollable 340px column. Displays a caution banner
 *              at the top when a HIGH-impact macro event is ≤10 minutes away.
 *
 * Exports:
 *   - RightRail() — 340px right rail panel
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useDeskData }       from '../../lib/mock-data-context';
import { QuoteDesk }         from './quote-desk';
import { LpStatus }          from './lp-status';
import { DeltaHedge }        from './delta-hedge';
import { EconomicCalendar }  from './economic-calendar';
import { NewsFeed }          from './news-feed';

export function RightRail() {
  const { economicEvents } = useDeskData();
  const imminentEvt = economicEvents.find(e => e.minutesAway > 0 && e.minutesAway <= 10 && e.impact === 'HIGH');

  return (
    <div style={{ width: 340, flexShrink: 0, background: 'var(--bg-surface)', borderLeft: '2px solid var(--border-md)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Caution banner — imminent high-impact event */}
      {imminentEvt && (
        <div style={{ padding: '7px 10px', background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.35)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 12 }}>⚡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, color: 'var(--warn)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {imminentEvt.flag} {imminentEvt.name} in {imminentEvt.minutesAway}m
            </div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)', marginTop: 1 }}>
              Consider widening spreads
            </div>
          </div>
        </div>
      )}
      <Section><QuoteDesk /></Section>
      <Section><LpStatus /></Section>
      <Section><DeltaHedge /></Section>
      <Section><EconomicCalendar /></Section>
      <Section><NewsFeed /></Section>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '10px 10px', borderBottom: '1px solid var(--border-md)' }}>
      {children}
    </div>
  );
}
