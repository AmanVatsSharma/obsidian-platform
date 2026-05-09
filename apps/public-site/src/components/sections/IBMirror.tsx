/**
 * File:        apps/public-site/src/components/sections/IBMirror.tsx
 * Module:      public-site · Sections
 * Purpose:     Two-panel section highlighting the IB (Introducing Broker) portal and
 *              Obsidian Mirror (copy trading) products with animated stat pills.
 *
 * Exports:
 *   - IBMirror()  — client component
 *
 * Depends on:
 *   - @/lib/data  — IB_STATS, MIR_STATS
 *   - @/components/ui/RevealDiv  — scroll reveal
 *
 * Side-effects:
 *   - setInterval counter pulse animation (visual only, no state)
 *
 * Key invariants:
 *   - Both panels are fully independent — no shared state
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useState, useEffect } from 'react';
import { IB_STATS, MIR_STATS } from '@/lib/data';
import { RevealDiv } from '@/components/ui/RevealDiv';

const BROKER_CITIES = [
  { name: 'London',    x: 48, y: 30 },
  { name: 'Dubai',     x: 58, y: 38 },
  { name: 'New York',  x: 22, y: 32 },
  { name: 'Singapore', x: 76, y: 50 },
  { name: 'Tokyo',     x: 82, y: 34 },
  { name: 'Sydney',    x: 84, y: 68 },
  { name: 'Riyadh',    x: 57, y: 42 },
  { name: 'Lagos',     x: 48, y: 52 },
];

function WorldMap() {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setPulse((p) => (p + 1) % BROKER_CITIES.length), 900);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', paddingBottom: '55%', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
      {/* Simplified world outline via CSS background gradient pattern */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />
      {/* City dots */}
      {BROKER_CITIES.map((city, i) => (
        <div key={city.name} style={{ position: 'absolute', left: `${city.x}%`, top: `${city.y}%`, transform: 'translate(-50%,-50%)' }}>
          {/* Pulse ring */}
          {pulse === i && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              width: 20, height: 20, borderRadius: '50%',
              border: '1px solid var(--accent)', opacity: 0.5,
              animation: 'city-pulse 1.2s ease-out forwards',
            }} />
          )}
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'var(--font-data)', fontSize: 8, color: 'var(--fg3)',
            whiteSpace: 'nowrap', letterSpacing: '.04em',
          }}>{city.name}</div>
        </div>
      ))}
      {/* Connection lines (SVG) */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}>
        {BROKER_CITIES.map((city, i) => i > 0 && (
          <line key={i}
            x1={`${BROKER_CITIES[0].x}%`} y1={`${BROKER_CITIES[0].y}%`}
            x2={`${city.x}%`} y2={`${city.y}%`}
            stroke="var(--accent)" strokeWidth="0.5" strokeDasharray="3,3"
          />
        ))}
      </svg>
    </div>
  );
}

function MirrorVisual() {
  const [ticked, setTicked] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTicked((t) => t + 1), 1600);
    return () => clearInterval(iv);
  }, []);

  const traders = [
    { nm: 'AlphaGrid',  ret: '+31.2%', draw: '-4.1%', copiers: 412 },
    { nm: 'FXPulse',    ret: '+22.8%', draw: '-6.3%', copiers: 847 },
    { nm: 'NovaTrend',  ret: '+18.4%', draw: '-3.7%', copiers: 298 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {traders.map((t, i) => (
        <div key={t.nm} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', background: 'var(--bg-elevated)',
          border: '1px solid var(--border)', borderRadius: 8,
          transition: 'border-color .3s',
          borderColor: ticked % 3 === i ? 'var(--accent)' : 'var(--border)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-panel)',
            border: '1px solid var(--border-hi)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 600, color: 'var(--accent)',
          }}>{t.nm.slice(0, 2)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500, color: 'var(--fg1)' }}>{t.nm}</div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)' }}>{t.copiers} copiers</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 14, fontWeight: 600, color: 'var(--bull)', fontVariantNumeric: 'tabular-nums' }}>{t.ret}</div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--bear)' }}>{t.draw}</div>
          </div>
          <button style={{
            fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
            background: ticked % 3 === i ? 'var(--accent)' : 'var(--bg-panel)',
            color: ticked % 3 === i ? '#fff' : 'var(--fg3)',
            border: '1px solid var(--border-hi)', borderRadius: 4, padding: '5px 10px',
            cursor: 'pointer', transition: 'all .3s',
          }}>COPY</button>
        </div>
      ))}
    </div>
  );
}

function StatPills({ stats }: { stats: typeof IB_STATS }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
      {stats.map((s) => (
        <div key={s.l} style={{
          padding: '12px 20px', background: 'var(--bg-panel)', border: '1px solid var(--border)',
          borderRadius: 8, textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 20, fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--fg2)', marginTop: 2 }}>{s.l}</div>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{s.s}</div>
        </div>
      ))}
    </div>
  );
}

export function IBMirror() {
  return (
    <section id="brokers" style={{ background: 'var(--bg-base)', padding: '100px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* IB Portal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', marginBottom: 100 }} className="tab-col">
          <div>
            <RevealDiv><span className="sec-eye">IB PORTAL</span></RevealDiv>
            <RevealDiv delay={80}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,3vw,42px)', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--fg1)', lineHeight: 1.1, marginTop: 12, marginBottom: 16 }}>
                Your affiliates,<br /><span style={{ color: 'var(--accent)' }}>your distribution engine.</span>
              </h2>
            </RevealDiv>
            <RevealDiv delay={160}>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--fg2)', lineHeight: 1.7, marginBottom: 4 }}>
                Multi-tier IB network. Commission calculated on every tick. Paid automatically. Statements branded to your broker.
              </p>
            </RevealDiv>
            <RevealDiv delay={240}>
              <StatPills stats={IB_STATS} />
            </RevealDiv>
          </div>
          <RevealDiv delay={120}>
            <WorldMap />
          </RevealDiv>
        </div>

        {/* Mirror / Copy trading */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="tab-col tab-col-rev">
          <RevealDiv delay={120}>
            <MirrorVisual />
          </RevealDiv>
          <div>
            <RevealDiv><span className="sec-eye">OBSIDIAN MIRROR</span></RevealDiv>
            <RevealDiv delay={80}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,3vw,42px)', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--fg1)', lineHeight: 1.1, marginTop: 12, marginBottom: 16 }}>
                Copy the best.<br /><span style={{ color: 'var(--purple)' }}>Automatically.</span>
              </h2>
            </RevealDiv>
            <RevealDiv delay={160}>
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--fg2)', lineHeight: 1.7 }}>
                A signal marketplace embedded in your platform. Your clients copy verified traders. Performance fees collected and distributed automatically. You earn on every copied trade.
              </p>
            </RevealDiv>
            <RevealDiv delay={240}>
              <StatPills stats={MIR_STATS} />
            </RevealDiv>
          </div>
        </div>
      </div>
    </section>
  );
}
