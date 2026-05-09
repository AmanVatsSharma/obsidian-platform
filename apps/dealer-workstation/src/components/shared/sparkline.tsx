/**
 * File:        apps/dealer-workstation/src/components/shared/sparkline.tsx
 * Module:      dealer-workstation · Shared
 * Purpose:     SVG polyline price sparkline for price tiles — renders a small trend line.
 *
 * Exports:
 *   - Sparkline({ ticks, bullish }) — SVG spark chart; bullish=true uses bull color, false uses bear
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

interface SparklineProps {
  ticks: number[];
  bullish: boolean;
}

export function Sparkline({ ticks, bullish }: SparklineProps) {
  const w = 160;
  const h = 28;
  if (!ticks || ticks.length < 2) return null;
  const mn = Math.min(...ticks);
  const mx = Math.max(...ticks);
  const range = mx - mn || 1;
  const pts = ticks
    .map((v, i) => {
      const x = (i / (ticks.length - 1)) * w;
      const y = h - ((v - mn) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline
        fill="none"
        stroke={bullish ? 'var(--bull)' : 'var(--bear)'}
        strokeWidth="1.5"
        points={pts}
        strokeOpacity="0.8"
      />
    </svg>
  );
}
