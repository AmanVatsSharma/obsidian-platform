/**
 * File:        apps/public-site/src/components/sections/Onboarding.tsx
 * Module:      public-site · Sections
 * Purpose:     Onboarding timeline — 5 steps from discovery call to go-live,
 *              rendered as a vertical stepper with connecting line.
 *
 * Exports:
 *   - Onboarding()  — server component (no 'use client')
 *
 * Depends on:
 *   - @/lib/data  — STEPS
 *   - @/components/ui/RevealDiv  — scroll reveal
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Server component — zero client JS
 *   - The connecting line is a CSS pseudo-element on the step number pill
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { STEPS } from '@/lib/data';
import { RevealDiv } from '@/components/ui/RevealDiv';

export function Onboarding() {
  return (
    <section style={{ background: 'var(--bg-surface)', padding: '100px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        <RevealDiv style={{ textAlign: 'center', marginBottom: 72 }}>
          <span className="sec-eye">ONBOARDING</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--fg1)', marginTop: 16, lineHeight: 1.08 }}>
            From contract to live<br />in <span style={{ color: 'var(--accent)' }}>21 days.</span>
          </h2>
        </RevealDiv>

        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STEPS.map((step, i) => (
            <RevealDiv key={step.n} delay={i * 80} style={{ display: 'flex', gap: 32, position: 'relative' }}>
              {/* Step number column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: i === 4 ? 'var(--accent)' : 'var(--bg-elevated)',
                  border: `1px solid ${i === 4 ? 'var(--accent)' : 'var(--border-hi)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-data)', fontSize: 13, fontWeight: 700,
                  color: i === 4 ? '#fff' : 'var(--accent)', flexShrink: 0,
                }}>
                  {step.n}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 1, flex: 1, minHeight: 40, background: 'var(--border-md)', margin: '4px 0' }} />
                )}
              </div>

              {/* Content */}
              <div style={{ paddingBottom: i < STEPS.length - 1 ? 40 : 0, paddingTop: 10 }}>
                <div style={{
                  fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--accent)',
                  letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6,
                }}>{step.t}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--fg1)', marginBottom: 8 }}>{step.h}</h3>
                <p style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--fg2)', lineHeight: 1.7, margin: 0 }}>{step.d}</p>
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}
