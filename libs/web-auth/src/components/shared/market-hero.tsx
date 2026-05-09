/**
 * File:        libs/web-auth/src/components/shared/market-hero.tsx
 * Module:      web-auth · MarketHero
 * Purpose:     520px right-side hero pane for auth split-layout. Shows live-feeling
 *              market data (sin-based ticks), session pills, spark chart, and status strip.
 *
 * Exports:
 *   - MarketHero({ variant?, title?, subtitle? }) — animated market hero pane
 *
 * Side-effects:
 *   - setInterval every 1600ms to tick price animation (cleaned up on unmount)
 *
 * Key invariants:
 *   - Deterministic: Math.sin(t + seed) pattern — no Math.random flicker on re-render
 *   - 520px fixed width driven by parent AuthShell grid
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import React, { useState, useEffect } from 'react';
import { SparkChart } from './spark-chart';
import { ObsidianLogo } from './obsidian-logo';

interface MarketHeroProps {
  variant?: 'default' | 'broker' | 'platform';
  title?: string;
  subtitle?: string;
}

const ROWS = [
  { sym: 'EUR/USD', px: 1.08452, pip: 5, base: 0.00020 },
  { sym: 'GBP/USD', px: 1.26340, pip: 5, base: -0.00034 },
  { sym: 'XAU/USD', px: 2341.20, pip: 2, base: 12.40 },
  { sym: 'BTC/USD', px: 68412.5, pip: 1, base: -412.8 },
  { sym: 'US30',    px: 39182,   pip: 0, base: 214 },
  { sym: 'USD/JPY', px: 154.812, pip: 3, base: -0.34 },
];

const SESSIONS = [
  { name: 'LONDON',  open: true },
  { name: 'NY',      open: true },
  { name: 'TOKYO',   open: false },
  { name: 'SYDNEY',  open: false },
];

export function MarketHero({ variant = 'default', title, subtitle }: MarketHeroProps) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(x => x + 1), 1600);
    return () => clearInterval(id);
  }, []);

  const tick = (seed: number) => Math.sin((t + seed) * 0.73) * 0.5;

  const heroTitle = title ?? (variant === 'broker'
    ? 'The institutional-grade broker platform'
    : variant === 'platform'
    ? 'Manage your broker ecosystem'
    : 'Trade every market from one terminal');

  const heroSub = subtitle ?? (variant === 'broker'
    ? 'Deploy your brand. Onboard clients. Go live today.'
    : variant === 'platform'
    ? 'Onboard brokers, manage tenants, control access.'
    : 'FX · Equities · Crypto · Commodities · Indices · Options');

  return (
    <div style={{
      position: 'relative', height: '100%', background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* top: logo + session pills */}
      <div style={{
        padding: '24px 28px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <ObsidianLogo size={13} />
        <div style={{ display: 'flex', gap: 6 }}>
          {SESSIONS.map(s => (
            <div key={s.name} style={{
              padding: '3px 8px', borderRadius: 'var(--r-sm)',
              background: s.open ? 'var(--bull-dim)' : 'var(--bg-elevated)',
              border: `1px solid ${s.open ? 'var(--bull)' : 'var(--border)'}`,
              fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 600,
              letterSpacing: '0.08em', color: s.open ? 'var(--bull)' : 'var(--fg3)',
            }}>{s.name}</div>
          ))}
        </div>
      </div>

      {/* headline */}
      <div style={{ padding: '28px 28px 20px' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
          color: 'var(--fg1)', lineHeight: 1.15, marginBottom: 8,
          letterSpacing: '0.01em',
        }}>{heroTitle}</div>
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--fg2)',
          lineHeight: 1.5,
        }}>{heroSub}</div>
      </div>

      {/* watchlist */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 28px' }}>
        {ROWS.map((r, i) => {
          const delta = r.base + tick(i) * r.base * 0.8;
          const price = r.px + delta;
          const bull = delta >= 0;
          return (
            <div key={r.sym} style={{
              display: 'grid', gridTemplateColumns: '90px 1fr 70px',
              alignItems: 'center', padding: '9px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{
                fontFamily: 'var(--font-data)', fontSize: 12, fontWeight: 600,
                letterSpacing: '0.04em', color: 'var(--fg1)',
              }}>{r.sym}</span>
              <span style={{
                fontFamily: 'var(--font-data)', fontSize: 13, fontWeight: 600,
                color: bull ? 'var(--bull)' : 'var(--bear)',
                fontFeatureSettings: '"tnum" 1',
              }}>
                {price.toFixed(r.pip)}
              </span>
              <span style={{
                fontFamily: 'var(--font-data)', fontSize: 11,
                color: bull ? 'var(--bull)' : 'var(--bear)',
                textAlign: 'right', fontFeatureSettings: '"tnum" 1',
              }}>
                {bull ? '+' : ''}{(delta).toFixed(r.pip > 0 ? r.pip : 0)}
              </span>
            </div>
          );
        })}
      </div>

      {/* spark chart */}
      <div style={{
        height: 80, padding: '0 0', borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
      }}>
        <SparkChart t={t} />
      </div>

      {/* status strip */}
      <div style={{
        padding: '10px 28px',
        display: 'flex', alignItems: 'center', gap: 16,
        fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)',
        letterSpacing: '0.06em',
      }}>
        <span style={{ color: 'var(--bull)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: 'var(--bull)',
            display: 'inline-block', boxShadow: '0 0 4px var(--bull)',
          }} />
          LIVE
        </span>
        <span>LATENCY · <span style={{ color: 'var(--fg1)' }}>12ms</span></span>
        <span>FEED · <span style={{ color: 'var(--fg1)' }}>STP</span></span>
        <span style={{ marginLeft: 'auto' }}>UTC {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
      </div>
    </div>
  );
}
