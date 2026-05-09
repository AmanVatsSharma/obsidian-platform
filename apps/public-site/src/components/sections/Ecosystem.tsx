/**
 * File:        apps/public-site/src/components/sections/Ecosystem.tsx
 * Module:      public-site · Sections
 * Purpose:     9-product ecosystem grid. Each card shows the product name, brand,
 *              audience tag, description, and feature bullets with a colored accent icon.
 *              Cards lift on hover via the .card CSS class.
 *
 * Exports:
 *   - Ecosystem()  — server component (no interactivity)
 *
 * Depends on:
 *   - @/lib/data  — PRODUCTS
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - tc (tag color) maps to tag-g / tag-b / tag-go / tag-p CSS classes
 *   - This is a server component — no 'use client' needed
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { RevealDiv } from '@/components/ui/RevealDiv';
import { PRODUCTS } from '@/lib/data';

const TAG_CLASS: Record<string, string> = {
  b:  'tag-b',
  bl: 'tag-b',
  go: 'tag-go',
  p:  'tag-p',
  g:  'tag-g',
};

export function Ecosystem() {
  return (
    <section id="ecosystem" style={{ background: 'var(--bg-base)', padding: '120px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <RevealDiv style={{ textAlign: 'center', marginBottom: 64 }}>
          <span className="sec-eye">THE PLATFORM</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4vw,56px)', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--fg1)', lineHeight: 1.08, marginTop: 16, marginBottom: 16 }}>
            9 products.<br />One subscription.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--fg2)', maxWidth: 540, margin: '0 auto', fontFamily: 'var(--font-ui)', lineHeight: 1.7 }}>
            Every tool your broker needs — for your traders, your team, and your business. All connected. All branded as you.
          </p>
        </RevealDiv>

        {/* Grid */}
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {PRODUCTS.map((p) => (
            <RevealDiv
              key={p.id}
              className="card"
              style={{
                background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 24,
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
            >
              {/* Tag */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span
                  className={TAG_CLASS[p.tc] ?? 'tag-b'}
                  style={{ fontSize: 10, fontFamily: 'var(--font-data)', letterSpacing: '.1em', padding: '3px 8px', borderRadius: 4 }}
                >
                  {p.tag}
                </span>
                {/* Accent dot */}
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.ac, boxShadow: `0 0 10px ${p.ac}55` }} />
              </div>

              {/* Name + brand */}
              <div>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)', letterSpacing: '.08em', marginBottom: 4 }}>
                  {p.brand}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--fg1)', letterSpacing: '-.01em' }}>
                  {p.nm}
                </h3>
              </div>

              {/* Description */}
              <p style={{ fontSize: 14, color: 'var(--fg2)', lineHeight: 1.6, fontFamily: 'var(--font-ui)', flexGrow: 1 }}>
                {p.desc}
              </p>

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                {p.feats.map((f) => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: p.ac, fontSize: 12, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'var(--fg3)', fontFamily: 'var(--font-ui)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
}
