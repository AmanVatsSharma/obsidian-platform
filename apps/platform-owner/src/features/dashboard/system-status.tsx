/**
 * File:        apps/platform-owner/src/features/dashboard/system-status.tsx
 * Module:      platform-owner · Dashboard Feature
 * Purpose:     Service status summary ring showing 4 key platform services
 *
 * Exports:
 *   - SystemStatus(props) — server-compatible status grid
 *
 * Depends on:
 *   - ../../shared/components/status-dot — StatusDot
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { StatusDot } from '../../shared/components/status-dot';
import type { InfraService } from '../../lib/types';

interface SystemStatusProps {
  services: InfraService[];
}

export function SystemStatus({ services }: SystemStatusProps) {
  const summary = services.slice(0, 4);

  return (
    <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">
          System Status
        </span>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {summary.map((svc) => (
          <div key={svc.name} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="font-ui text-[13px] text-fg1">{svc.name}</div>
              <div className="font-mono text-[10px] text-fg3">{svc.latency} · {svc.uptime}</div>
            </div>
            <StatusDot status={svc.status} showLabel={true} />
          </div>
        ))}
      </div>
    </div>
  );
}
