/**
 * File:        apps/public-site/src/components/sections/Social.tsx
 * Module:      public-site · Sections
 * Purpose:     Social proof strip — logos of press mentions and regulatory bodies,
 *              rendered as a static server component.
 *
 * Exports:
 *   - Social()  — server component (no 'use client')
 *
 * Depends on:
 *   - @/lib/data  — TRUST_LOGOS
 *   - @/components/ui/RevealDiv  — scroll reveal
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Server component — no browser APIs
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { TRUST_LOGOS } from '@/lib/data';
import { RevealDiv } from '@/components/ui/RevealDiv';

export function Social() {
  return (
    <section style={{ background: 'var(--bg-surface)', padding: '64px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <RevealDiv style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg3)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
            TRUSTED BY BROKERS. RECOGNISED BY REGULATORS.
          </p>
        </RevealDiv>
        <RevealDiv delay={80} style={{ display: 'flex', flexWrap: 'wrap', gap: 0, justifyContent: 'center', alignItems: 'center' }}>
          {TRUST_LOGOS.map((logo, i) => (
            <div key={i} style={{
              padding: '16px 32px', borderRight: i < TRUST_LOGOS.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                color: 'var(--fg3)', letterSpacing: '.06em',
                filter: 'grayscale(1)', opacity: 0.5, transition: 'opacity .2s',
              }}>{logo.l}</span>
            </div>
          ))}
        </RevealDiv>
      </div>
    </section>
  );
}
