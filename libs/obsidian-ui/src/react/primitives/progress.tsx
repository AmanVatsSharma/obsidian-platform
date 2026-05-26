/**
 * File:        libs/obsidian-ui/src/react/primitives/progress.tsx
 * Module:      obsidian-ui · Primitives
 * Purpose:     Slim 4-px linear progress bar, semantic-colour aware.
 *              Matches the design's `.prog` / `.prog .fill` pair.
 *
 * Exports:
 *   - ObsidianProgress      — React.FC<ObsidianProgressProps>
 *   - ObsidianProgressKind  — 'accent' | 'bull' | 'warn' | 'bear'
 *   - ObsidianProgressProps
 *
 * Depends on:
 *   - ../utils/cn
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Value is clamped to [0, max]. Width is animated for 400ms with the trading easing
 *     so changes feel deliberate, not instantaneous.
 *   - Default kind 'accent' picks up --accent so the user's accent choice flows through.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as React from 'react';

import { cn } from '../utils/cn';

export type ObsidianProgressKind = 'accent' | 'bull' | 'warn' | 'bear';

export type ObsidianProgressProps = {
  value: number;
  max?: number;
  kind?: ObsidianProgressKind;
  className?: string;
  'aria-label'?: string;
};

const FILL_COLOUR: Record<ObsidianProgressKind, string> = {
  accent: 'bg-[color:var(--accent)]',
  bull:   'bg-[color:var(--bull)]',
  warn:   'bg-[color:var(--warn)]',
  bear:   'bg-[color:var(--bear)]',
};

export function ObsidianProgress({
  value,
  max = 100,
  kind = 'accent',
  className,
  'aria-label': ariaLabel,
}: ObsidianProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'h-1 overflow-hidden rounded-r-sm bg-[color:var(--bg-active)]',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-r-sm transition-[width] duration-[400ms] ease-trading',
          FILL_COLOUR[kind],
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
