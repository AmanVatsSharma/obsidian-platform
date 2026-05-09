/**
 * @file page-header.tsx
 * @module obsidian-ui
 * @description Title stack for trader / ops pages with optional actions row.
 * @author BharatERP
 * @created 2026-04-03
 */

import * as React from 'react';

import { cn } from '../utils/cn';

export type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-obsidian-border pb-4 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-obsidian-primary">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-obsidian-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
