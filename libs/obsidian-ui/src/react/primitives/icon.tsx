/**
 * File:        libs/obsidian-ui/src/react/primitives/icon.tsx
 * Module:      obsidian-ui · Primitives
 * Purpose:     Lucide-react icon wrapper enforcing the brand defaults — 16-px size and
 *              stroke-width 2 — per CLAUDE.md §12 ("lucide-react 14-16px stroke 2").
 *
 * Exports:
 *   - ObsidianIcon       — React.FC<ObsidianIconProps>
 *   - ObsidianIconName   — Type alias for the Lucide icon name set
 *   - ObsidianIconProps  — props contract
 *
 * Depends on:
 *   - lucide-react        — icon component map (lazy lookup by name)
 *   - ../utils/cn
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Uses lucide-react's typed icons object so unknown names fail at build time.
 *   - Returns null for unknown names (defence in depth — the type already prevents this).
 *   - Defaults: size=16, strokeWidth=2. Override per-call as needed; do not change
 *     the defaults without updating CLAUDE.md §12.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as Lucide from 'lucide-react';
import * as React from 'react';

import { cn } from '../utils/cn';

type LucideMap = typeof Lucide;
type LucideKey = keyof LucideMap;

/** Names of all icon components exported by lucide-react. */
export type ObsidianIconName = Extract<LucideKey, string> & string;

export type ObsidianIconProps = Omit<React.SVGProps<SVGSVGElement>, 'name'> & {
  name: ObsidianIconName;
  size?: number;
  strokeWidth?: number;
};

export function ObsidianIcon({
  name,
  size = 16,
  strokeWidth = 2,
  className,
  ...rest
}: ObsidianIconProps) {
  const Component = Lucide[name] as React.ComponentType<React.SVGProps<SVGSVGElement> & {
    size?: number;
    strokeWidth?: number;
  }> | undefined;
  if (!Component) return null;
  return (
    <Component
      size={size}
      strokeWidth={strokeWidth}
      className={cn('shrink-0', className)}
      {...rest}
    />
  );
}
