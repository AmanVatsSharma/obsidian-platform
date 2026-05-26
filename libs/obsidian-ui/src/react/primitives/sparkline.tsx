/**
 * File:        libs/obsidian-ui/src/react/primitives/sparkline.tsx
 * Module:      obsidian-ui · Primitives
 * Purpose:     Inline SVG sparkline — small line chart over a 30-point series.
 *              Mirrors the prototype's `Spark` component with optional gradient fill.
 *
 * Exports:
 *   - ObsidianSparkline      — React.FC<ObsidianSparklineProps>
 *   - ObsidianSparklineProps
 *
 * Depends on:
 *   - ../utils/cn
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Uses a stable gradientId per instance (React.useId) so multiple sparklines on the
 *     same page don't collide on `<defs>` ids.
 *   - viewBox is 240×height; preserveAspectRatio="none" so the chart stretches to its
 *     container width. Stroke-width stays visually consistent (1.5px) at any width.
 *   - Renders nothing for empty / 1-point series — defensive against partial data.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as React from 'react';

import { cn } from '../utils/cn';

export type ObsidianSparklineProps = {
  data: readonly number[];
  /** CSS colour. Defaults to `var(--bull)`. */
  color?: string;
  /** Pixel height. Width is fluid. */
  height?: number;
  /** Render the gradient area fill below the line. Default true. */
  fill?: boolean;
  className?: string;
  'aria-label'?: string;
};

export function ObsidianSparkline({
  data,
  color = 'var(--bull)',
  height = 56,
  fill = true,
  className,
  'aria-label': ariaLabel,
}: ObsidianSparklineProps) {
  const gradientId = React.useId();
  if (!data || data.length < 2) return null;

  const w = 240;
  const h = height;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const fillPath = `${path} L${w},${h} L0,${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
      className={cn('block w-full', className)}
      style={{ height }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill && <path d={fillPath} fill={`url(#${gradientId})`} />}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
