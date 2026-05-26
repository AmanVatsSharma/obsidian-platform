/**
 * File:        libs/obsidian-ui/src/react/primitives/toggle.tsx
 * Module:      obsidian-ui · Primitives
 * Purpose:     Small switch control matching the design's `.tg` style — a 34×18 pill
 *              with a sliding 12-px knob. Single boolean.
 *
 * Exports:
 *   - ObsidianToggle      — React.FC<ObsidianToggleProps>
 *   - ObsidianToggleProps — props contract
 *
 * Depends on:
 *   - ../utils/cn — class composition
 *
 * Side-effects:
 *   - none (pure presentational, fires onChange on click / keyboard activate)
 *
 * Key invariants:
 *   - Renders as a button with role="switch" + aria-checked for screen readers.
 *   - Disabled toggles don't fire onChange and reduce opacity to 50%.
 *   - The `on` colour pulls --accent so accent picker propagates instantly.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as React from 'react';

import { cn } from '../utils/cn';

export type ObsidianToggleProps = {
  on: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
};

export function ObsidianToggle({
  on,
  onChange,
  disabled,
  className,
  'aria-label': ariaLabel,
}: ObsidianToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!on)}
      className={cn(
        'relative h-[18px] w-[34px] flex-shrink-0 rounded-[10px] border border-[color:var(--border)] transition-colors duration-trading ease-trading',
        on ? 'bg-[color:var(--accent)] border-[color:var(--accent)]' : 'bg-[color:var(--bg-active)]',
        disabled && 'cursor-not-allowed opacity-50',
        !disabled && 'cursor-pointer',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-[2px] left-[2px] h-[12px] w-[12px] rounded-full transition-transform duration-trading ease-trading',
          on ? 'translate-x-[16px] bg-white' : 'bg-[color:var(--fg2)]',
        )}
      />
    </button>
  );
}
