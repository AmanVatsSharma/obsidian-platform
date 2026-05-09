/**
 * File:        apps/platform-owner/src/features/brokers/broker-status-badge.tsx
 * Module:      platform-owner · Brokers Feature
 * Purpose:     Pill badge for broker operational status with Obsidian semantic colors
 *
 * Exports:
 *   - BrokerStatusBadge(props) — inline status pill
 *   - PlanBadge(props)         — inline plan tier pill
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { cn } from '@obsidian/obsidian-ui';
import type { BrokerPlan, BrokerStatus } from '../../lib/types';

const STATUS_STYLE: Record<BrokerStatus, string> = {
  ACTIVE:    'bg-bull/10  text-bull  border-bull/25',
  SUSPENDED: 'bg-bear/10  text-bear  border-bear/25',
  TRIAL:     'bg-warn/10  text-warn  border-warn/25',
  PENDING:   'bg-fg3/10   text-fg2   border-[var(--border)]',
};

const PLAN_STYLE: Record<BrokerPlan, string> = {
  ENTERPRISE: 'bg-purple/10 text-purple border-purple/25',
  PRO:        'bg-accent/10 text-accent  border-accent/25',
  GROWTH:     'bg-bull/10   text-bull    border-bull/25',
  STARTER:    'bg-fg3/10    text-fg3     border-[var(--border)]',
};

export function BrokerStatusBadge({ status }: { status: BrokerStatus }) {
  return (
    <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider', STATUS_STYLE[status])}>
      {status}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: BrokerPlan }) {
  return (
    <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider', PLAN_STYLE[plan])}>
      {plan}
    </span>
  );
}
