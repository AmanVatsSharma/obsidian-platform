/**
 * File:        apps/dealer-workstation/src/components/shared/gauge-ring.tsx
 * Module:      dealer-workstation · Shared
 * Purpose:     SVG donut gauge showing exposure percentage against limit for the risk tab.
 *
 * Exports:
 *   - GaugeRing({ pct, symbol, used, limit }) — circular progress ring with color thresholds
 *
 * Key invariants:
 *   - green < 60%, amber 60-80%, red > 80% — matches dealer risk convention
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

interface GaugeRingProps {
  pct: number;
  symbol: string;
  used: string;
  limit: string;
}

function fmtMoney(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function GaugeRing({ pct, symbol, used, limit }: GaugeRingProps) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const fill = circ - (pct / 100) * circ;
  const color = pct < 60 ? 'var(--bull)' : pct < 80 ? 'var(--warn)' : 'var(--bear)';
  const textColor = pct < 60 ? 'var(--bull)' : pct < 80 ? 'var(--warn)' : 'var(--bear)';

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 8, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--fg2)', marginBottom: 4 }}>
        {symbol}
      </div>
      <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto 4px' }}>
        <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="28" cy="28" r={r} stroke="var(--bg-elevated)" strokeWidth="6" fill="none" />
          <circle
            cx="28" cy="28" r={r}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={fill}
            style={{ transition: 'stroke-dashoffset 1s' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-data)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: textColor }}>{pct}%</span>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)' }}>
        {used} / {limit}
      </div>
    </div>
  );
}
