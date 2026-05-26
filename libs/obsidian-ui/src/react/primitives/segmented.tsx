/**
 * File:        libs/obsidian-ui/src/react/primitives/segmented.tsx
 * Module:      obsidian-ui · Primitives
 * Purpose:     Segmented control — a row of mutually-exclusive small buttons.
 *              Matches the design's `.seg` style.
 *
 * Exports:
 *   - ObsidianSegmented              — React.FC<ObsidianSegmentedProps<T>>
 *   - ObsidianSegmentedProps<T>      — props contract; T is the value union
 *   - ObsidianSegmentedOption<T>     — { value: T, label: ReactNode } shape
 *
 * Depends on:
 *   - ../utils/cn — class composition
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Options accept either a string (used as both value and label) or a
 *     { value, label } object — mirrors the prototype's helper.
 *   - The active button gets a slight raised look via inset border + bg-active.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as React from 'react';

import { cn } from '../utils/cn';

export type ObsidianSegmentedOption<T extends string> =
  | T
  | { value: T; label: React.ReactNode };

export type ObsidianSegmentedProps<T extends string> = {
  value: T;
  onChange: (next: T) => void;
  options: readonly ObsidianSegmentedOption<T>[];
  className?: string;
  'aria-label'?: string;
};

function isObjectOption<T extends string>(
  o: ObsidianSegmentedOption<T>,
): o is { value: T; label: React.ReactNode } {
  return typeof o === 'object' && o !== null;
}

export function ObsidianSegmented<T extends string>({
  value,
  onChange,
  options,
  className,
  'aria-label': ariaLabel,
}: ObsidianSegmentedProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex gap-0 rounded-r-md border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-[2px]',
        className,
      )}
    >
      {options.map((opt) => {
        const v = isObjectOption(opt) ? opt.value : opt;
        const l = isObjectOption(opt) ? opt.label : opt;
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={cn(
              'rounded-[4px] px-3 py-[5px] font-sans text-[11px] font-semibold tracking-[0.02em] transition-colors duration-trading ease-trading',
              active
                ? 'bg-[color:var(--bg-active)] text-[color:var(--fg1)] shadow-[0_0_0_1px_var(--border)]'
                : 'text-[color:var(--fg3)] hover:text-[color:var(--fg1)]',
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
