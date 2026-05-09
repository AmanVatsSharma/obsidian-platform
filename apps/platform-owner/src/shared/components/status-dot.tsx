/**
 * File:        apps/platform-owner/src/shared/components/status-dot.tsx
 * Module:      platform-owner · Shared Components
 * Purpose:     Color-coded status indicator dot with optional label
 *
 * Exports:
 *   - StatusDot(props: StatusDotProps) — inline status indicator
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — cn()
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { cn } from '@obsidian/obsidian-ui';
import type { ServiceStatus } from '../../lib/types';

const STATUS_CONFIG: Record<ServiceStatus, { dot: string; text: string; label: string }> = {
  OPERATIONAL: { dot: 'bg-bull',  text: 'text-bull',  label: 'Operational' },
  WARNING:     { dot: 'bg-warn',  text: 'text-warn',  label: 'Warning' },
  DEGRADED:    { dot: 'bg-warn',  text: 'text-warn',  label: 'Degraded' },
  DOWN:        { dot: 'bg-bear',  text: 'text-bear',  label: 'Down' },
};

export interface StatusDotProps {
  status: ServiceStatus;
  showLabel?: boolean;
  pulse?: boolean;
  className?: string;
}

export function StatusDot({ status, showLabel = true, pulse = false, className }: StatusDotProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn('flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full shrink-0',
          config.dot,
          pulse && status === 'OPERATIONAL' && 'animate-pulse',
        )}
      />
      {showLabel && (
        <span className={cn('font-mono text-[11px]', config.text)}>{config.label}</span>
      )}
    </span>
  );
}

export function statusLabel(status: ServiceStatus): string {
  return STATUS_CONFIG[status].label;
}
