/**
 * File:        apps/public-site/src/components/sections/TechStack.tsx
 * Module:      public-site · Sections
 * Purpose:     Technology stack grid (12 tech logos) and performance spec table
 *              (PERFS rows). Static server component — zero client JS.
 *
 * Exports:
 *   - TechStack()  — server component (no 'use client')
 *
 * Depends on:
 *   - @/lib/data  — TECHS, PERFS
 *   - @/components/ui/RevealDiv  — scroll reveal
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Server component — contributes zero bytes to client JS bundle
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { TECHS, PERFS } from '@/lib/data';
import { RevealDiv } from '@/components/ui/RevealDiv';

const TECH_ICONS: Record<string, string> = {
  'Next.js': 'N', 'Node.js': 'JS', 'PostgreSQL': 'PG', 'Redis': 'R',
  'Kafka': 'K', 'Kubernetes': 'K8', 'AWS': 'AWS', 'TradingView': 'TV',
  'FIX 4.4': 'FIX', 'WebSocket': 'WS', 'Docker': '🐳', 'Terraform': 'TF',
};

export function TechStack() {
  return (
    <section style={{ background: 'var(--bg-surface)', padding: '100px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        <RevealDiv style={{ textAlign: 'center', marginBottom: 64 }}>
          <span className="sec-eye">BUILT ON</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--fg1)', marginTop: 16, lineHeight: 1.08 }}>
            Battle-tested stack.<br /><span style={{ color: 'var(--fg2)' }}>No experiments in production.</span>
          </h2>
        </RevealDiv>

        {/* Tech logos grid */}
        <RevealDiv delay={80} className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 80 }}>
          {TECHS.map((tech) => (
            <div key={tech} style={{
              background: 'var(--bg-panel)', padding: '28px 16px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, background: 'var(--bg-elevated)',
                border: '1px solid var(--border-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, color: 'var(--accent)',
              }}>
                {TECH_ICONS[tech] ?? tech.slice(0, 2)}
              </div>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg2)' }}>{tech}</span>
            </div>
          ))}
        </RevealDiv>

        {/* Performance specs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }} className="tab-col">
          <div>
            <RevealDiv>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,2.5vw,34px)', fontWeight: 700, color: 'var(--fg1)', marginBottom: 8, letterSpacing: '-.01em' }}>
                Performance specs.
              </h3>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--fg2)', lineHeight: 1.65, marginBottom: 0 }}>
                Not marketing numbers. These are the contractual SLA values written into every Enterprise agreement.
              </p>
            </RevealDiv>
          </div>
          <RevealDiv delay={120} className="stagger">
            <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {PERFS.map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  padding: '16px 0', borderBottom: '1px solid var(--border)', gap: 24,
                }}>
                  <dt style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--fg2)', margin: 0 }}>{row.l}</dt>
                  <dd style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', margin: 0, flexShrink: 0, textAlign: 'right' }}>{row.v}</dd>
                </div>
              ))}
            </dl>
          </RevealDiv>
        </div>
      </div>
    </section>
  );
}
