/**
 * File:        apps/public-site/src/components/sections/Hero.tsx
 * Module:      public-site · Sections
 * Purpose:     Full-viewport hero section. Stacks: grid background, static radial
 *              glow, mouse-reactive glow, 3D particle field (dynamic import),
 *              typewriter headline, CTA buttons, animated stat strip, and Ticker.
 *
 * Exports:
 *   - Hero()  — the main hero section component
 *
 * Depends on:
 *   - next/dynamic                            — SSR-safe dynamic import for ParticleField
 *   - @/components/ui/Counter                 — animated stat numbers
 *   - @/components/ui/Ticker                  — live price ticker bar
 *   - @/lib/data                              — PHRASES, HERO_STATS
 *
 * Side-effects:
 *   - window.addEventListener: mousemove (hero glow tracking)
 *   - setTimeout chain for typewriter phase transitions
 *   - setInterval indirectly via Ticker component
 *
 * Key invariants:
 *   - ParticleField is loaded with next/dynamic({ ssr: false }) — never runs on server
 *   - Typewriter phases: 'type' → 'pause' → 'del' → next phrase → 'type'
 *   - Entry animations use inline style transitions (opacity + translateY) triggered
 *     by a boolean array [v0..v5] set via staggered setTimeout on mount
 *
 * Read order:
 *   1. ParticleFieldDynamic — how Three.js is kept off the server
 *   2. Hero — typewriter effect state machine, then render
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Counter } from '@/components/ui/Counter';
import { Ticker }  from '@/components/ui/Ticker';
import { PHRASES, HERO_STATS } from '@/lib/data';

const ParticleFieldDynamic = dynamic(
  () => import('./ParticleField').then((m) => ({ default: m.ParticleField })),
  { ssr: false },
);

type Phase = 'type' | 'pause' | 'del';

export function Hero() {
  const heroRef  = useRef<HTMLElement>(null);
  const glowRef  = useRef<HTMLDivElement>(null);

  // ── Typewriter state ─────────────────────────────────────────────
  const [pi,    setPi]    = useState(0);
  const [txt,   setTxt]   = useState('');
  const [phase, setPhase] = useState<Phase>('type');
  const charIdx = useRef(0);
  const timer   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Staggered entry animation ────────────────────────────────────
  const [v, setV] = useState([false, false, false, false, false, false]);

  useEffect(() => {
    const delays = [0, 160, 320, 500, 680, 880];
    delays.forEach((d, i) =>
      setTimeout(() => setV((p) => { const n = [...p]; n[i] = true; return n; }), d),
    );
  }, []);

  // ── Typewriter phase machine ─────────────────────────────────────
  useEffect(() => {
    const phrase = PHRASES[pi].txt;
    clearTimeout(timer.current);

    if (phase === 'type') {
      if (charIdx.current < phrase.length) {
        timer.current = setTimeout(() => {
          setTxt(phrase.slice(0, charIdx.current + 1));
          charIdx.current++;
        }, 38);
      } else {
        timer.current = setTimeout(() => setPhase('pause'), 80);
      }
    } else if (phase === 'pause') {
      timer.current = setTimeout(() => setPhase('del'), 3200);
    } else if (phase === 'del') {
      if (charIdx.current > 0) {
        timer.current = setTimeout(() => {
          charIdx.current--;
          setTxt(phrase.slice(0, charIdx.current));
        }, 20);
      } else {
        setPi((p) => (p + 1) % PHRASES.length);
        setPhase('type');
      }
    }

    return () => clearTimeout(timer.current);
  }, [phase, txt, pi]);

  // ── Mouse-reactive glow ──────────────────────────────────────────
  useEffect(() => {
    const hero = heroRef.current;
    const glow = glowRef.current;
    if (!hero || !glow) return;

    const onMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      glow.style.left = `${e.clientX - rect.left}px`;
      glow.style.top  = `${e.clientY - rect.top}px`;
    };

    hero.addEventListener('mousemove', onMove, { passive: true });
    return () => hero.removeEventListener('mousemove', onMove);
  }, []);

  const fade = (i: number, d = 0): React.CSSProperties => ({
    opacity:   v[i] ? 1 : 0,
    transform: v[i] ? 'none' : 'translateY(24px) scale(.97)',
    transition: `opacity 640ms cubic-bezier(.16,1,.3,1) ${d}ms, transform 640ms cubic-bezier(.16,1,.3,1) ${d}ms`,
  });

  return (
    <section
      id="hero"
      ref={heroRef}
      style={{
        minHeight: '100dvh', background: 'var(--bg-base)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', position: 'relative',
      }}
    >
      {/* Grid background */}
      <div className="grid-bg" />

      {/* Static radial glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 800px 600px at 50% 40%, rgba(59,130,246,.056) 0%, transparent 70%)',
      }} />

      {/* Mouse-reactive glow */}
      <div
        ref={glowRef}
        id="hero-mouse-glow"
        style={{ left: '50%', top: '40%' }}
      />

      {/* 3D Particle field */}
      <ParticleFieldDynamic containerRef={heroRef} />

      {/* ── Main content ─────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flex: 1, padding: '100px 24px 40px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 900, width: '100%' }}>

          {/* Eyebrow pill */}
          <div style={{ ...fade(0), display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div className="eyebrow-pill">
              <span className="live-dot" />
              <span>LIVE PLATFORM — 14 BROKERS — 8,412 TRADERS</span>
            </div>
          </div>

          {/* Headline + typewriter */}
          <div style={{ ...fade(1, 120), marginBottom: 20 }}>
            <h1 className="hero-h1">The trading platform</h1>
            <h1 className="hero-h1" style={{ minHeight: '1.1em' }}>
              <span style={{ color: PHRASES[pi].col, transition: 'color .35s ease' }}>{txt}</span>
              <span className="tw-caret" />
            </h1>
          </div>

          {/* Sub-headline */}
          <div style={{ ...fade(2, 200), display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
            <p style={{
              fontSize: 'clamp(15px, 1.8vw, 18px)', color: 'var(--fg2)',
              lineHeight: 1.65, maxWidth: 600, fontFamily: 'var(--font-ui)',
            }}>
              White-label the full-stack trading infrastructure. From matching engine to mobile app —
              launch your branded broker in weeks, not years.
            </p>
          </div>

          {/* CTAs */}
          <div style={{ ...fade(3, 260), display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 40 }}>
            <button className="btn-p" style={{ padding: '14px 28px', fontSize: 15 }}>
              Start Building Your Broker <span className="arr">→</span>
            </button>
            <button className="btn-g" style={{ padding: '14px 24px', fontSize: 15 }}>
              <span style={{ color: 'var(--accent)' }}>▷</span> Watch Live Demo
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg3)', marginLeft: 6 }}>2:34</span>
            </button>
          </div>

          {/* Trust bar */}
          <div style={fade(4, 320)}>
            <p style={{ fontSize: 13, color: 'var(--fg3)', letterSpacing: '.05em', marginBottom: 14, fontFamily: 'var(--font-ui)' }}>
              Trusted by regulated brokers in 18 countries
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              {[80, 64, 96, 72, 56].map((w, i) => (
                <div
                  key={i}
                  className="tl-logo"
                  style={{ width: w, height: 28, background: 'var(--border-md)', borderRadius: 4, opacity: 0.22 }}
                />
              ))}
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg3)' }}>+ 11 more</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat strip ───────────────────────────────────────────── */}
      <div style={{
        ...fade(5, 400),
        position: 'relative', zIndex: 10,
        borderTop: '1px solid var(--border)',
        background: 'rgba(12,14,18,.65)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', maxWidth: 960, margin: '0 auto' }}>
          {HERO_STATS.map((s, i) => (
            <div
              key={s.lbl}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '20px 12px', textAlign: 'center',
                borderRight: i < 3 ? '1px solid var(--border)' : 'none',
              }}
            >
              <Counter val={s.val} pre={s.pre} suf={s.suf} dec={s.dec} comma={s.comma} dur={1900} sz="clamp(20px,2.8vw,28px)" />
              <div style={{ fontSize: 10, color: 'var(--fg3)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 6, fontFamily: 'var(--font-ui)' }}>
                {s.lbl}
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg3)', opacity: 0.65, fontFamily: 'var(--font-ui)' }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live ticker ───────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Ticker />
      </div>
    </section>
  );
}
