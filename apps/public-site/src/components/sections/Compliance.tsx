/**
 * File:        apps/public-site/src/components/sections/Compliance.tsx
 * Module:      public-site · Sections
 * Purpose:     Regulatory compliance section — 12 jurisdiction badges (flag + regulator)
 *              arranged in a grid, with a supporting copy block.
 *
 * Exports:
 *   - Compliance()  — server component (no 'use client')
 *
 * Depends on:
 *   - @/lib/data  — JURISDICTIONS
 *   - @/components/ui/RevealDiv  — scroll reveal
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Server component — zero client JS
 *   - Flag emoji are the only emoji allowed in data tables (per design system rules)
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { JURISDICTIONS } from '@/lib/data';
import { RevealDiv } from '@/components/ui/RevealDiv';

export function Compliance() {
  return (
    <section style={{ background: 'var(--bg-base)', padding: '100px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 80, alignItems: 'center' }} className="tab-col">
          <div>
            <RevealDiv>
              <span className="sec-eye">COMPLIANCE</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--fg1)', marginTop: 16, marginBottom: 20, lineHeight: 1.08 }}>
                Regulated everywhere<br />you want to <span style={{ color: 'var(--accent)' }}>operate.</span>
              </h2>
            </RevealDiv>
            <RevealDiv delay={80}>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--fg2)', lineHeight: 1.7, marginBottom: 24 }}>
                The platform is built for compliance, not retrofitted for it. KYC, AML, leverage caps, negative balance protection, and MiFID II reporting — all configurable per jurisdiction.
              </p>
            </RevealDiv>
            <RevealDiv delay={160} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Multi-jurisdiction KYC flows', 'Automated AML screening', 'MiFID II trade reporting', 'Jurisdiction-specific leverage caps', 'Negative balance protection'].map((f) => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ color: 'var(--bull)', fontSize: 12, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--fg2)' }}>{f}</span>
                </div>
              ))}
            </RevealDiv>
          </div>

          {/* Jurisdiction grid */}
          <RevealDiv delay={120} className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {JURISDICTIONS.map((j) => (
              <div key={j.c} style={{
                background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '16px 12px', textAlign: 'center', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6,
              }}>
                <span style={{ fontSize: 24, lineHeight: 1 }}>{j.f}</span>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: '.04em' }}>{j.r}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--fg3)', letterSpacing: '.06em' }}>{j.c.toUpperCase()}</div>
              </div>
            ))}
          </RevealDiv>
        </div>
      </div>
    </section>
  );
}
