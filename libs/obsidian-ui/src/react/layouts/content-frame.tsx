/**
 * @file content-frame.tsx
 * @module obsidian-ui
 * @description Max-width content column for readable line length.
 * @author BharatERP
 * @created 2026-04-03
 */

import * as React from 'react';

import { cn } from '../utils/cn';

export type ContentFrameProps = {
  children: React.ReactNode;
  className?: string;
  /** 'readable' ~65ch; 'wide' for dashboards. */
  variant?: 'readable' | 'wide' | 'full';
};

const widthMap = {
  readable: 'max-w-[65ch]',
  wide: 'max-w-6xl',
  full: 'max-w-none',
};

export function ContentFrame({ children, className, variant = 'readable' }: ContentFrameProps) {
  return (
    <div className={cn('mx-auto w-full px-obs', widthMap[variant], className)}>{children}</div>
  );
}
