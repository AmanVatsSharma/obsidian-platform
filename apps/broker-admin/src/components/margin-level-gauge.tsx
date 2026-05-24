/**
 * File:        apps/broker-admin/src/components/margin-level-gauge.tsx
 * Module:      broker-admin · Risk · Margin Level Gauge
 * Purpose:     Arc gauge component for displaying margin level health status.
 *              Used by exposure-limits and risk-dashboard pages.
 *
 * Exports:
 *   - MarginLevelGauge(props) — renders SVG arc gauge
 *
 * Depends on:
 *   - lucide-react (none — self-contained SVG)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Color: green >= 150%, amber 100-150%, red < 100%
 *   - Semisweep arc spans 270° from 135° to 405° (SVG coords)
 *   - level is clamped to [0, 200] for percentage display
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

'use client';

const GAUGE_SIZE = 120;
const GAUGE_STROKE = 10;
const GAUGE_R = (GAUGE_SIZE - GAUGE_STROKE) / 2;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_R;
const GAUGE_SEMISWEEP = 270;
const GAUGE_OFFSET = (360 - GAUGE_SEMISWEEP) / 2; // 45° start

function polarToXY(deg: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: GAUGE_SIZE / 2 + r * Math.cos(rad), y: GAUGE_SIZE / 2 + r * Math.sin(rad) };
}

function arcPath(startDeg: number, endDeg: number, r: number): string {
  const s = polarToXY(startDeg, r);
  const e = polarToXY(endDeg, r);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function gaugeColor(level: number) {
  if (level >= 150) return 'var(--bull)';
  if (level >= 100) return 'var(--warn)';
  return 'var(--bear)';
}

const GAUGE_START = GAUGE_OFFSET;
const GAUGE_END   = GAUGE_OFFSET + GAUGE_SEMISWEEP;

export interface MarginLevelGaugeProps {
  level: number;
  size?: number;
}

export function MarginLevelGauge({ level }: MarginLevelGaugeProps) {
  const color = gaugeColor(level);
  const label = level >= 150 ? 'Healthy' : level >= 100 ? 'Warning' : 'Critical';
  const pctDisplay = Math.min((level / 200) * 100, 100);

  return (
    <div className="flex items-center gap-6">
      <svg
        width={GAUGE_SIZE}
        height={GAUGE_SIZE}
        viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
        className="shrink-0"
      >
        {/* Track arc */}
        <path
          d={arcPath(GAUGE_START, GAUGE_END, GAUGE_R)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={GAUGE_STROKE}
          strokeLinecap="round"
        />
        {/* Cap markers */}
        <path
          d={arcPath(GAUGE_START - 1, GAUGE_START + 1, GAUGE_R)}
          fill="none"
          stroke="var(--fg3)"
          strokeWidth={GAUGE_STROKE}
          strokeLinecap="round"
        />
        <path
          d={arcPath(GAUGE_END - 1, GAUGE_END + 1, GAUGE_R)}
          fill="none"
          stroke="var(--fg3)"
          strokeWidth={GAUGE_STROKE}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={arcPath(
            GAUGE_START,
            Math.min(GAUGE_START + (GAUGE_SEMISWEEP * level) / 200, GAUGE_END),
            GAUGE_R,
          )}
          fill="none"
          stroke={color}
          strokeWidth={GAUGE_STROKE}
          strokeLinecap="round"
        />
        {/* Center text */}
        <text
          x={GAUGE_SIZE / 2} y={GAUGE_SIZE / 2 - 6}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="20"
          fontWeight="bold"
          fill="var(--fg1)"
        >
          {level.toFixed(0)}%
        </text>
        <text
          x={GAUGE_SIZE / 2} y={GAUGE_SIZE / 2 + 10}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize="8"
          fill="var(--fg3)"
          letterSpacing="0.08em"
        >
          MARGIN LEVEL
        </text>
      </svg>
      <div>
        <p
          className="font-display text-[11px] font-semibold tracking-[0.08em] uppercase"
          style={{ color }}
        >
          {label}
        </p>
        <p className="mt-1 font-mono text-[10px] text-fg3">Threshold 150%</p>
        <div className="mt-1 h-1.5 w-24 rounded-full bg-[var(--bg-elevated)]">
          <div
            className="h-full rounded-full"
            style={{ width: `${pctDisplay}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}