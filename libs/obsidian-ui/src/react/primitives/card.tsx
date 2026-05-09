/**
 * @file card.tsx
 * @module obsidian-ui
 * @description Elevated surface grouping (presentation). RSC-safe shell; subparts are static.
 * @author BharatERP
 * @created 2026-04-03
 */

import * as React from 'react';

import { cn } from '../utils/cn';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-obs-lg border border-obsidian-border bg-obsidian-elevated text-obsidian-primary shadow-obs-sm',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1 border-b border-obsidian-border p-4', className)} {...props} />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold tracking-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-obsidian-secondary', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center border-t border-obsidian-border p-4', className)} {...props} />
  );
}
