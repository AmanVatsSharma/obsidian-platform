/**
 * @file input.tsx
 * @module obsidian-ui
 * @description Text field with Radix Label. Client component.
 * @author BharatERP
 * @created 2026-04-03
 */

'use client';

import * as Label from '@radix-ui/react-label';
import * as React from 'react';

import { cn } from '../utils/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, id, label, hint, error, ...props }, ref) => {
    return (
      <div className="grid gap-1.5">
        <Label.Root
          htmlFor={id}
          className="text-sm font-medium text-obsidian-primary"
        >
          {label}
        </Label.Root>
        <input
          id={id}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={
            [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') ||
            undefined
          }
          className={cn(
            'flex h-10 w-full rounded-obs border border-obsidian-border bg-obsidian-elevated px-3 py-2 text-sm text-obsidian-primary shadow-obs-sm',
            'placeholder:text-obsidian-faint',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-obsidian-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-obsidian-danger',
            className,
          )}
          {...props}
        />
        {hint ? (
          <p id={`${id}-hint`} className="text-xs text-obsidian-secondary">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${id}-error`} className="text-xs text-obsidian-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
