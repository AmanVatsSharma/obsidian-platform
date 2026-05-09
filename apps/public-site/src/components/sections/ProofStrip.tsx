/**
 * File:        apps/public-site/src/components/sections/ProofStrip.tsx
 * Module:      public-site · Sections
 * Purpose:     Social proof section: 6 animated stat counters + 3 testimonial
 *              cards with a dot-navigation carousel.
 *
 * Exports:
 *   - ProofStrip()  — client component (carousel state + Counter)
 *
 * Depends on:
 *   - @/components/ui/Counter  — animated number
 *   - @/lib/data               — PROOF_STATS, TESTI
 *
 * Side-effects:
 *   - setInterval auto-advance carousel every 5s
 *
 * Key invariants:
 *   - Counter fires once on scroll-into-view (handled internally by Counter)
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useEffect, useState } from 'react';
import { Counter } from '@/components/ui/Counter';
import { RevealDiv } from '@/components/ui/RevealDiv';
import { PROOF_STATS, TESTI } from '@/lib/data';

export function ProofStrip() {
  const [testiIdx, setTestiIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTestiIdx((i) => (i + 1) % TESTI.length), 5000);
    return () => clearInterval(iv);
  }, []);

  const t = TESTI[testiIdx];

  return (
    <section style={{ background: 'var(--bg-base)', padding: '120px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <RevealDiv style={{ textAlign: 'center', marginBottom: 64 }}>
          <span className="sec-eye">BY THE NUMBERS</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--fg1)', marginTop: 16, lineHeight: 1.08 }}>
            The infrastructure that runs<br /><span style={{ color: 'var(--accent)' }}>real brokers.</span>
          </h2>
        </RevealDiv>

        {/* Stats grid */}
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 80 }}>
          {PROOF_STATS.map((s) => (
            <div key={s.lbl} style={{ background: 'var(--bg-panel)', padding: '36px 24px', textAlign: 'center' }}>
              <Counter val={s.val} pre={s.pre} suf={s.suf} dec={s.dec} comma={s.comma} dur={2000} sz="clamp(28px,3.5vw,44px)" />
              <div style={{ fontSize: 12, color: 'var(--fg3)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 10, fontFamily: 'var(--font-ui)' }}>
                {s.lbl}
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg3)', opacity: 0.65, fontFamily: 'var(--font-ui)' }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonial carousel */}
        <RevealDiv style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ padding: '48px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
            {/* Quote */}
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,3vw,40px)', fontWeight: 700, color: 'var(--accent)', lineHeight: 1, marginBottom: 24, opacity: 0.4 }}>
              "
            </div>
            <p style={{ fontSize: 'clamp(15px,1.6vw,18px)', color: 'var(--fg1)', lineHeight: 1.7, fontFamily: 'var(--font-ui)', marginBottom: 32, fontStyle: 'italic' }}>
              {t.q}
            </p>

            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-elevated)',
                border: '1px solid var(--border-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-data)', fontSize: 13, fontWeight: 600, color: 'var(--accent)',
              }}>
                {t.in}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14, color: 'var(--fg1)' }}>{t.nm}</div>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg3)', letterSpacing: '.04em' }}>{t.ti}</div>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)', opacity: 0.65 }}>{t.lo}</div>
              </div>
            </div>

            {/* Dot nav */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 28 }}>
              {TESTI.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestiIdx(i)}
                  className={`tes-dot${i === testiIdx ? ' on' : ''}`}
                />
              ))}
            </div>
          </div>
        </RevealDiv>
      </div>
    </section>
  );
}
