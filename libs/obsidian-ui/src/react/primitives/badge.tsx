/**
 * File:        libs/obsidian-ui/src/react/primitives/badge.tsx
 * Module:      obsidian-ui · Primitives
 * Purpose:     Compact pill used for status, tier, and channel labelling. Matches the
 *              design's `.bdg` family — bull / bear / warn / accent / muted variants
 *              with optional pulse-dot.
 *
 * Exports:
 *   - ObsidianBadge          — React.FC<ObsidianBadgeProps>
 *   - ObsidianBadgeKind      — 'bull' | 'bear' | 'warn' | 'accent' | 'muted'
 *   - ObsidianBadgeProps     — props contract
 *
 * Depends on:
 *   - ../utils/cn — class composition
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Typography is `font-display`, ALL CAPS, letter-spacing 0.08em — non-negotiable
 *     per CLAUDE.md §12 (panel-title rhythm). Do not introduce a sentence-case variant.
 *   - When `dot` is true on the bull variant, the dot animates via the `obsidian-blink`
 *     keyframes (defined in console.css and any shared style sheet).
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as React from 'react';

import { cn } from '../utils/cn';

export type ObsidianBadgeKind = 'bull' | 'bear' | 'warn' | 'accent' | 'muted';

export type ObsidianBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  kind?: ObsidianBadgeKind;
  dot?: boolean;
  children: React.ReactNode;
};

const KIND_STYLES: Record<ObsidianBadgeKind, string> = {
  bull:   'bg-[color:var(--bull-dim)]   text-[color:var(--bull)]   border-[color:rgba(16,217,150,0.25)]',
  bear:   'bg-[color:var(--bear-dim)]   text-[color:var(--bear)]   border-[color:rgba(255,59,92,0.25)]',
  warn:   'bg-[color:var(--warn-dim)]   text-[color:var(--warn)]   border-[color:rgba(245,158,11,0.25)]',
  accent: 'bg-[color:var(--accent-dim)] text-[color:var(--accent)] border-[color:rgba(59,130,246,0.25)]',
  muted:  'bg-[color:var(--bg-elevated)] text-[color:var(--fg3)]   border-[color:var(--border)]',
};

export function ObsidianBadge({
  kind = 'muted',
  dot = false,
  className,
  children,
  ...rest
}: ObsidianBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-r-sm border px-2 py-[3px] font-display text-[9px] font-bold uppercase tracking-[0.08em]',
        KIND_STYLES[kind],
        className,
      )}
      {...rest}
    >
      {dot && (
        <span
          className={cn(
            'h-[5px] w-[5px] rounded-full bg-current',
            kind === 'bull' && 'animate-[obsidian-blink_1.5s_infinite]',
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
