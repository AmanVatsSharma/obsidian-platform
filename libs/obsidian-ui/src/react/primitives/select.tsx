/**
 * File:        libs/obsidian-ui/src/react/primitives/select.tsx
 * Module:      obsidian-ui · Primitives
 * Purpose:     Token-styled native <select> wrapped in the design's `.ip` chrome.
 *              Lightweight and accessible; for richer behaviour use a Radix Select.
 *
 * Exports:
 *   - ObsidianSelect              — React.FC<ObsidianSelectProps<T>>
 *   - ObsidianSelectOption<T>     — string | { value, label }
 *   - ObsidianSelectProps<T>
 *
 * Depends on:
 *   - ../utils/cn — class composition
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Uses native <select> for keyboard / accessibility / mobile support out of the box.
 *   - Custom caret rendered via background-image gradients to match the design's chevron;
 *     hides the native arrow via appearance:none.
 *   - The wrapper hover/focus styles match the design's `.ip` input convention so this
 *     visually composes with TextField etc.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as React from 'react';

import { cn } from '../utils/cn';

export type ObsidianSelectOption<T extends string> =
  | T
  | { value: T; label: React.ReactNode };

export type ObsidianSelectProps<T extends string> = {
  value: T;
  onChange: (next: T) => void;
  options: readonly ObsidianSelectOption<T>[];
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
};

function isObjectOption<T extends string>(
  o: ObsidianSelectOption<T>,
): o is { value: T; label: React.ReactNode } {
  return typeof o === 'object' && o !== null;
}

export function ObsidianSelect<T extends string>({
  value,
  onChange,
  options,
  className,
  disabled,
  'aria-label': ariaLabel,
}: ObsidianSelectProps<T>) {
  return (
    <div
      className={cn(
        'flex h-9 items-center rounded-r-md border border-[color:var(--border)] bg-[color:var(--bg-elevated)] transition-colors duration-trading ease-trading hover:border-[color:var(--border-hi)] focus-within:border-[color:var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-dim)]',
        disabled && 'opacity-50',
        className,
      )}
    >
      <select
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-full w-full cursor-pointer appearance-none border-none bg-transparent bg-no-repeat px-3 pr-8 font-sans text-[13px] text-[color:var(--fg1)] outline-none [background-image:linear-gradient(45deg,transparent_50%,var(--fg3)_50%),linear-gradient(135deg,var(--fg3)_50%,transparent_50%)] [background-position:calc(100%-14px)_16px,calc(100%-9px)_16px] [background-size:5px_5px]"
      >
        {options.map((opt) => {
          const v = isObjectOption(opt) ? opt.value : opt;
          const l = isObjectOption(opt) ? opt.label : opt;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
    </div>
  );
}
