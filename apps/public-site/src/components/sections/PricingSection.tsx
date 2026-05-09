/**
 * File:        apps/public-site/src/components/sections/PricingSection.tsx
 * Module:      public-site · Sections
 * Purpose:     Pricing section with 4 tier cards, annual/monthly billing toggle,
 *              and an FAQ accordion below.
 *
 * Exports:
 *   - PricingSection()  — client component
 *
 * Depends on:
 *   - @/lib/data  — PRICING, FAQS
 *   - @/components/ui/RevealDiv  — scroll reveal
 *
 * Side-effects:
 *   - none (local state only — billing toggle, FAQ open set)
 *
 * Key invariants:
 *   - Enterprise tier has null price — renders "Contact Sales" CTA
 *   - FAQ accordion supports multiple items open simultaneously (Set<number>)
 *   - Annual billing shows yr price with a "2 months free" badge
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useState } from 'react';
import { PRICING, FAQS } from '@/lib/data';
import { RevealDiv } from '@/components/ui/RevealDiv';

function FaqAccordion() {
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) { next.delete(i); } else { next.add(i); }
      return next;
    });

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {FAQS.map((faq, i) => (
        <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => toggle(i)}
            style={{
              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 0', textAlign: 'left', gap: 16,
            }}
          >
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 500, color: 'var(--fg1)', lineHeight: 1.5 }}>{faq.q}</span>
            <span style={{
              fontFamily: 'var(--font-data)', fontSize: 16, color: 'var(--accent)',
              transform: open.has(i) ? 'rotate(45deg)' : 'none',
              transition: 'transform .2s', flexShrink: 0,
            }}>+</span>
          </button>
          {open.has(i) && (
            <div style={{ paddingBottom: 20 }}>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--fg2)', lineHeight: 1.75, margin: 0 }}>{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" style={{ background: 'var(--bg-base)', padding: '100px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <RevealDiv style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="sec-eye">PRICING</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--fg1)', marginTop: 16, lineHeight: 1.08 }}>
            Launch your broker.<br /><span style={{ color: 'var(--accent)' }}>Not your runway.</span>
          </h2>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 17, color: 'var(--fg2)', marginTop: 16 }}>
            One subscription. All 9 products. No hidden fees.
          </p>
        </RevealDiv>

        {/* Billing toggle */}
        <RevealDiv delay={80} style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 48 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: annual ? 'var(--fg3)' : 'var(--fg1)' }}>Monthly</span>
          <button
            onClick={() => setAnnual((a) => !a)}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: annual ? 'var(--accent)' : 'var(--bg-elevated)',
              position: 'relative', transition: 'background .2s', padding: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: annual ? 22 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              transition: 'left .2s',
            }} />
          </button>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: annual ? 'var(--fg1)' : 'var(--fg3)' }}>
            Annual <span style={{ color: 'var(--bull)', fontSize: 11, fontWeight: 600 }}>2 months free</span>
          </span>
        </RevealDiv>

        {/* Tier cards */}
        <RevealDiv delay={120} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 80 }} className="price-grid">
          {PRICING.map((tier) => {
            const price = annual ? tier.yr : tier.mo;
            return (
              <div key={tier.id} style={{
                background: tier.hi ? 'var(--bg-panel)' : 'var(--bg-surface)',
                border: `1px solid ${tier.hi ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 12, padding: '28px 24px', position: 'relative',
                display: 'flex', flexDirection: 'column',
              }}>
                {tier.badge && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--accent)', color: '#fff',
                    fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, letterSpacing: '.1em',
                    padding: '4px 12px', borderRadius: 4,
                  }}>{tier.badge}</div>
                )}

                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--fg1)', marginBottom: 4 }}>{tier.nm}</div>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)', letterSpacing: '.08em', marginBottom: 20 }}>{tier.cl.toUpperCase()}</div>

                <div style={{ marginBottom: 24 }}>
                  {price !== null ? (
                    <>
                      <span style={{ fontFamily: 'var(--font-data)', fontSize: 36, fontWeight: 700, color: 'var(--fg1)', fontVariantNumeric: 'tabular-nums' }}>${price.toLocaleString()}</span>
                      <span style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: 'var(--fg3)' }}>/mo</span>
                    </>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--fg1)' }}>Custom</span>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {tier.feats.map((f) => (
                    <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--bull)', fontSize: 12, flexShrink: 0, marginTop: 2 }}>✓</span>
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--fg2)', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button className={tier.ghost ? 'btn-g' : 'btn-p'} style={{ width: '100%', textAlign: 'center' }}>
                  {tier.cta}
                </button>
              </div>
            );
          })}
        </RevealDiv>

        {/* FAQ */}
        <RevealDiv delay={80} style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="sec-eye">FREQUENTLY ASKED</span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,2.5vw,34px)', fontWeight: 700, color: 'var(--fg1)', marginTop: 12 }}>
            Questions? We have answers.
          </h3>
        </RevealDiv>
        <RevealDiv delay={160}>
          <FaqAccordion />
        </RevealDiv>
      </div>
    </section>
  );
}
