/**
 * File:        apps/platform-owner/src/features/health/node-grid.tsx
 * Module:      platform-owner · Health Feature
 * Purpose:     Server node cards with CPU load and memory bars
 *
 * Exports:
 *   - NodeGrid(props) — server-compatible node status grid
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — cn()
 *   - ../../shared/components/status-dot — StatusDot
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { cn } from '@obsidian/obsidian-ui';
import { StatusDot } from '../../shared/components/status-dot';
import type { InfraNode } from '../../lib/types';

interface NodeGridProps {
  nodes: InfraNode[];
}

function LoadBar({ value, label }: { value: number; label: string }) {
  const color = value >= 80 ? 'bg-bear' : value >= 60 ? 'bg-warn' : 'bg-bull';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-display text-[9px] uppercase tracking-[0.08em] text-fg3">{label}</span>
        <span className={cn('font-mono text-[11px] tabular-nums', value >= 80 ? 'text-bear' : value >= 60 ? 'text-warn' : 'text-bull')}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[var(--bg-elevated)]">
        <div className={cn('h-1.5 rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function NodeGrid({ nodes }: NodeGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {nodes.map((node) => (
        <div key={node.id} className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="font-mono text-[11px] text-fg3">{node.id}</div>
              <div className="mt-0.5 font-ui text-[13px] font-medium text-fg1">{node.location}</div>
            </div>
            <StatusDot status={node.status} showLabel={false} />
          </div>
          <div className="space-y-2">
            <LoadBar value={node.load} label="CPU Load" />
            <LoadBar value={node.memory} label="Memory" />
          </div>
          <div className="mt-3 font-mono text-[10px] text-fg3">{node.tenants} tenant{node.tenants !== 1 ? 's' : ''}</div>
        </div>
      ))}
    </div>
  );
}
