/**
 * File:        apps/public-site/src/components/sections/DualAudience.tsx
 * Module:      public-site · Sections
 * Purpose:     Two-column tab section presenting the value proposition separately
 *              for Brokers vs Traders. Tab toggle switches the benefit bullet list.
 *
 * Exports:
 *   - DualAudience()  — client component (tab state)
 *
 * Depends on:
 *   - @/lib/data  — BROKER_BEN, TRADER_BEN, IB_STATS, MIR_STATS
 *
 * Side-effects:
 *   - none (local state only)
 *
 * Key invariants:
 *   - 'use client' required for useState tab toggle
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useState } from 'react';
import { RevealDiv } from '@/components/ui/RevealDiv';
import { BROKER_BEN, TRADER_BEN, IB_STATS, MIR_STATS } from '@/lib/data';

type Audience = 'broker' | 'trader';

export function DualAudience() {
  const [tab, setTab] = useState<Audience>('broker');

  const benefits = tab === 'broker' ? BROKER_BEN : TRADER_BEN;
  const stats    = tab === 'broker' ? IB_STATS   : MIR_STATS;
  const accentColor = tab === 'broker' ? 'var(--accent)' : 'var(--bull)';
  const headline = tab === 'broker'
    ? <>Your brand.<br /><span style={{ color: 'var(--accent)' }}>Our infrastructure.</span></>
    : <>Trade anything.<br /><span style={{ color: 'var(--bull)' }}>Everywhere.</span></>;

  return (
    <section id={tab === 'broker' ? 'brokers' : 'traders'} style={{ background: 'var(--bg-surface)', padding: '120px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Tab toggle */}
        <RevealDiv style={{ display: 'flex', justifyContent: 'center', marginBottom: 64 }}>
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
            {(['broker', 'trader'] as Audience[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 24px', borderRadius: 8, border: 'none', cursor: 'none',
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, letterSpacing: '.04em',
                  background: tab === t ? (t === 'broker' ? 'var(--accent)' : 'var(--bull)') : 'transparent',
                  color: tab === t ? (t === 'broker' ? '#fff' : '#000') : 'var(--fg2)',
                  transition: 'all .2s ease',
                }}
              >
                {t === 'broker' ? 'FOR BROKERS' : 'FOR TRADERS'}
              </button>
            ))}
          </div>
        </RevealDiv>

        {/* Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="tab-col">

          {/* Text side */}
          <RevealDiv>
            <span className="sec-eye" style={{ borderColor: `${accentColor}30`, color: accentColor, background: `${accentColor}0a` }}>
              {tab === 'broker' ? 'BROKER PROPOSITION' : 'TRADER PROPOSITION'}
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.08, marginTop: 16, marginBottom: 24, color: 'var(--fg1)' }}>
              {headline}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40 }}>
              {benefits.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ color: accentColor, fontSize: 14, flexShrink: 0, marginTop: 2 }}>✓</span>
                  <span style={{ fontSize: 15, color: 'var(--fg2)', lineHeight: 1.55, fontFamily: 'var(--font-ui)' }}>{b}</span>
                </div>
              ))}
            </div>
            <button className="btn-p" style={{ padding: '12px 24px', fontSize: 14, background: accentColor }}>
              {tab === 'broker' ? 'Launch Your Broker' : 'Open a Demo Account'} <span className="arr">→</span>
            </button>
          </RevealDiv>

          {/* Stats side */}
          <RevealDiv delay={120}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              {stats.map((s, i) => (
                <div key={i} style={{ padding: '24px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-data)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 700, color: accentColor, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {s.v}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--fg2)', fontFamily: 'var(--font-ui)', marginTop: 4 }}>{s.l}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg3)', fontFamily: 'var(--font-data)', letterSpacing: '.05em', marginTop: 2 }}>{s.s}</div>
                  </div>
                </div>
              ))}

              {/* Demo CTA card */}
              <div style={{ padding: 24, background: `${accentColor}08`, border: `1px solid ${accentColor}20`, borderRadius: 12 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--fg1)', marginBottom: 8 }}>
                  {tab === 'broker' ? 'See it live in 30 minutes' : 'Trade for free — demo account'}
                </div>
                <p style={{ fontSize: 13, color: 'var(--fg2)', fontFamily: 'var(--font-ui)', lineHeight: 1.55, marginBottom: 16 }}>
                  {tab === 'broker'
                    ? 'No sales team. Just a live demo of the full platform, configured for your brand.'
                    : '$100,000 virtual balance. Every instrument. Full platform access. No deposit required.'}
                </p>
                <button className="btn-g" style={{ padding: '10px 20px', fontSize: 13, borderColor: `${accentColor}50`, color: accentColor }}>
                  {tab === 'broker' ? 'Book Demo' : 'Start Demo Trading'} →
                </button>
              </div>
            </div>
          </RevealDiv>
        </div>
      </div>
    </section>
  );
}
