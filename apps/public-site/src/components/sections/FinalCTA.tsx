/**
 * File:        apps/public-site/src/components/sections/FinalCTA.tsx
 * Module:      public-site · Sections
 * Purpose:     Bottom-of-funnel CTA section with email input for demo request
 *              and two CTA buttons (book demo / view pricing).
 *
 * Exports:
 *   - FinalCTA()  — client component
 *
 * Depends on:
 *   - @/components/ui/RevealDiv  — scroll reveal
 *
 * Side-effects:
 *   - none (form submit is a no-op placeholder — real form wired at integration time)
 *
 * Key invariants:
 *   - Email input is uncontrolled — reads .value on submit, no re-render per keystroke
 *   - 'use client' required only for the submit handler
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useRef, useState } from 'react';
import { RevealDiv } from '@/components/ui/RevealDiv';

export function FinalCTA() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailRef.current?.value ?? '';
    if (!email.includes('@')) return;
    setSubmitted(true);
  };

  return (
    <section style={{
      background: 'var(--bg-panel)', padding: '120px 0', borderTop: '1px solid var(--border)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative' }}>
        <RevealDiv>
          <span className="sec-eye">GET STARTED</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4.5vw,60px)', fontWeight: 800, letterSpacing: '-.03em', color: 'var(--fg1)', marginTop: 16, marginBottom: 20, lineHeight: 1.05 }}>
            Your branded broker.<br /><span style={{ color: 'var(--accent)' }}>In 3 weeks.</span>
          </h2>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 18, color: 'var(--fg2)', lineHeight: 1.6, marginBottom: 48 }}>
            No sales pitch. A 30-minute architecture call where we map your market, jurisdiction, and LP relationships to the right setup.
          </p>
        </RevealDiv>

        <RevealDiv delay={80}>
          {submitted ? (
            <div style={{
              padding: '24px 40px', background: 'var(--bg-elevated)', border: '1px solid var(--bull)',
              borderRadius: 12, fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--bull)',
            }}>
              ✓ We'll reach out within 24 hours.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 0, maxWidth: 480, margin: '0 auto', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-hi)' }}>
              <input
                ref={emailRef}
                type="email"
                placeholder="your@email.com"
                required
                style={{
                  flex: 1, background: 'var(--bg-elevated)', border: 'none',
                  fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--fg1)',
                  padding: '16px 20px', outline: 'none',
                }}
              />
              <button type="submit" className="btn-p" style={{ borderRadius: 0, padding: '0 24px', flexShrink: 0 }}>
                Book Demo
              </button>
            </form>
          )}
        </RevealDiv>

        <RevealDiv delay={160} style={{ marginTop: 32, display: 'flex', gap: 32, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="#pricing" style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--accent)', textDecoration: 'none' }}>
            View Pricing →
          </a>
          <span style={{ color: 'var(--border-hi)' }}>|</span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--fg3)' }}>No commitment. No credit card.</span>
          <span style={{ color: 'var(--border-hi)' }}>|</span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--fg3)' }}>Response in &lt;24 hours</span>
        </RevealDiv>
      </div>
    </section>
  );
}
