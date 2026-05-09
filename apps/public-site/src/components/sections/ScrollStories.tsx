/**
 * File:        apps/public-site/src/components/sections/ScrollStories.tsx
 * Module:      public-site · Sections
 * Purpose:     Feature-showcase section with 3 story tabs (Charts, Execution, Risk)
 *              each containing 4 sticky-scroll frames with progress-driven content switching.
 *
 * Exports:
 *   - ScrollStories()  — client component
 *
 * Depends on:
 *   - @/lib/data  — STORIES
 *   - @/components/ui/RevealDiv  — scroll reveal
 *
 * Side-effects:
 *   - IntersectionObserver on each frame to drive active frame index
 *
 * Key invariants:
 *   - Each tab panel is a separate tall section; only one tab is visible at a time
 *   - Frames are observed individually; the last visible one sets activeFrame
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { STORIES } from '@/lib/data';
import { RevealDiv } from '@/components/ui/RevealDiv';

const VISUAL_ICONS: Record<string, string> = {
  chart:      '📈', indicators: '📊', drawings: '✏️', multi:    '⊞',
  latency:    '⚡', ordertypes: '📋', oneclick: '🎯', routing:  '🔀',
  gauges:     '🔴', abook:      '⚖️', status:   '✅', scale:    '🔼',
};

function FrameVisual({ v }: { v: string }) {
  const icon = VISUAL_ICONS[v] ?? '◈';
  const labels: Record<string, string[]> = {
    chart:      ['1m', '5m', '15m', '1h', '4h', 'D'],
    indicators: ['RSI 67.4', 'MACD +0.0023', 'BB 1.0845'],
    drawings:   ['Fib 0.382', 'Fib 0.618', 'Fib 0.786'],
    multi:      ['EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD'],
    latency:    ['8.2ms', '9.1ms', '7.8ms', '11.4ms'],
    ordertypes: ['Market', 'Limit', 'Stop', 'OCO'],
    oneclick:   ['BUY 1.0', 'SELL 0.5', 'Close'],
    routing:    ['A-Book 70%', 'B-Book 30%', 'LP1 > LP2'],
    gauges:     ['Net: -$1.2M', 'Hedge: 94%', 'Exposure: 4.2'],
    abook:      ['STP Route', 'Hedge', 'Internalize'],
    status:     ['99.97%', '0 Incidents', '<12ms'],
    scale:      ['50 clients', '5,000', '50,000'],
  };
  const pills = labels[v] ?? [];

  return (
    <div style={{
      width: '100%', aspectRatio: '4/3', background: 'var(--bg-elevated)',
      borderRadius: 12, border: '1px solid var(--border-hi)', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ fontSize: 56, marginBottom: 24, opacity: 0.8 }}>{icon}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {pills.map((p) => (
          <span key={p} style={{
            fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--accent)',
            background: 'var(--bg-panel)', border: '1px solid var(--border-hi)',
            padding: '4px 10px', borderRadius: 4, letterSpacing: '.04em',
          }}>{p}</span>
        ))}
      </div>
      {/* Decorative grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '40px 40px', borderRadius: 'inherit',
      }} />
    </div>
  );
}

export function ScrollStories() {
  const [activeTab, setActiveTab]     = useState(0);
  const [activeFrame, setActiveFrame] = useState(0);
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);

  const story = STORIES[activeTab];

  useEffect(() => {
    setActiveFrame(0);
    frameRefs.current = [];
  }, [activeTab]);

  const setRef = useCallback((el: HTMLDivElement | null, i: number) => {
    frameRefs.current[i] = el;
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    story.frames.forEach((_, i) => {
      const el = frameRefs.current[i];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveFrame(i); },
        { threshold: 0.5, rootMargin: '-10% 0px -10% 0px' },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [activeTab, story.frames]);

  return (
    <section id="stories" style={{ background: 'var(--bg-base)', padding: '100px 0 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <RevealDiv style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="sec-eye">PLATFORM DEEP-DIVE</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 800, letterSpacing: '-.02em', color: 'var(--fg1)', marginTop: 16, lineHeight: 1.08 }}>
            Every feature, <span style={{ color: 'var(--accent)' }}>production-grade.</span>
          </h2>
        </RevealDiv>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 0, borderBottom: '1px solid var(--border)', justifyContent: 'center' }}>
          {STORIES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveTab(i)}
              style={{
                fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: activeTab === i ? 600 : 400,
                color: activeTab === i ? 'var(--accent)' : 'var(--fg3)',
                background: 'none', border: 'none', borderBottom: activeTab === i ? '2px solid var(--accent)' : '2px solid transparent',
                padding: '14px 28px', cursor: 'pointer', transition: 'all .15s',
                marginBottom: -1,
              }}
            >
              {s.ti}
            </button>
          ))}
        </div>

        {/* Sticky scroll layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, paddingTop: 80 }} className="tab-col">

          {/* Left — sticky visual */}
          <div style={{ position: 'sticky', top: 120, height: 'fit-content' }}>
            <FrameVisual v={story.frames[activeFrame].v} />
            {/* Frame progress dots */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 20 }}>
              {story.frames.map((_, i) => (
                <div key={i} style={{
                  width: i === activeFrame ? 20 : 6, height: 6, borderRadius: 3,
                  background: i === activeFrame ? 'var(--accent)' : 'var(--border-hi)',
                  transition: 'all .3s',
                }} />
              ))}
            </div>
          </div>

          {/* Right — scroll frames */}
          <div>
            {story.frames.map((frame, i) => (
              <div
                key={i}
                ref={(el) => setRef(el, i)}
                style={{
                  minHeight: '55vh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  padding: '40px 0', borderBottom: i < story.frames.length - 1 ? '1px solid var(--border)' : 'none',
                  opacity: activeFrame === i ? 1 : 0.35, transition: 'opacity .4s',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--accent)',
                  letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16,
                }}>
                  {String(i + 1).padStart(2, '0')} / {String(story.frames.length).padStart(2, '0')}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,2.5vw,34px)', fontWeight: 700, color: 'var(--fg1)', lineHeight: 1.15, marginBottom: 20, letterSpacing: '-.01em' }}>
                  {frame.h}
                </h3>
                <p style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--fg2)', lineHeight: 1.75 }}>
                  {frame.b}
                </p>
              </div>
            ))}
            {/* Spacer so the last frame can scroll to center */}
            <div style={{ height: '25vh' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
