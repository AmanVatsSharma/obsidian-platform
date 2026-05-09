/**
 * File:        libs/web-auth/src/components/shared/spark-chart.tsx
 * Module:      web-auth · SparkChart
 * Purpose:     Deterministic 40-bar candlestick SVG chart used in the auth MarketHero pane.
 *
 * Exports:
 *   - SparkChart({ t }) — SVG candlestick chart; t is the current tick counter
 *
 * Side-effects: none
 * Key invariants:
 *   - Deterministic: given the same t, always renders the same bars (sin-based, no Math.random)
 *   - viewBox "0 0 400 120" — consumer scales via CSS
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import React from 'react';

interface SparkChartProps {
  t: number;
}

export function SparkChart({ t }: SparkChartProps) {
  const bars = Array.from({ length: 40 }, (_, i) => {
    const x = i * 10 + 2;
    const mid = 60 + Math.sin((i + t * 0.3) * 0.4) * 28;
    const h = 4 + Math.abs(Math.sin(i * 1.7 + t * 0.1)) * 18;
    const open = mid + Math.sin(i * 2.3) * 6;
    const close = mid - Math.sin(i * 1.9 + 0.5) * 6;
    const bull = close < open;
    return { x, mid, h, open, close, bull };
  });

  return (
    <svg viewBox="0 0 400 120" style={{ width: '100%', height: '100%', display: 'block' }}>
      {/* grid lines */}
      {[20, 40, 60, 80].map(y => (
        <line key={y} x1="0" y1={y} x2="400" y2={y}
          stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 4" />
      ))}
      {bars.map((b, i) => (
        <g key={i}>
          <line x1={b.x + 4} y1={b.mid - b.h} x2={b.x + 4} y2={b.mid + b.h}
            stroke={b.bull ? 'var(--bull)' : 'var(--bear)'} strokeWidth="1" opacity="0.5" />
          <rect x={b.x} y={Math.min(b.open, b.close)}
            width="7" height={Math.max(2, Math.abs(b.open - b.close))}
            rx="1"
            fill={b.bull ? 'var(--bull)' : 'var(--bear)'}
            opacity="0.85" />
        </g>
      ))}
    </svg>
  );
}
