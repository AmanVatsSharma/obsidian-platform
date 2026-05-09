/**
 * File:        apps/platform-owner/src/features/health/service-grid.tsx
 * Module:      platform-owner · Health Feature
 * Purpose:     Platform service health cards with status, uptime, and latency
 *
 * Exports:
 *   - ServiceGrid(props) — server-compatible service status grid
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

interface ServiceGridProps {
  services: InfraService[];
}

export function ServiceGrid({ services }: ServiceGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((svc) => (
        <div key={svc.name} className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="font-ui text-[13px] font-medium text-fg1">{svc.name}</div>
              <div className="mt-0.5 font-ui text-[11px] text-fg3">{svc.description}</div>
            </div>
            <StatusDot status={svc.status} showLabel={false} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="font-display text-[9px] uppercase tracking-[0.08em] text-fg3">STATUS</div>
              <div className="mt-1">
                <StatusDot status={svc.status} showLabel={true} pulse={svc.status === 'OPERATIONAL'} />
              </div>
            </div>
            <div>
              <div className="font-display text-[9px] uppercase tracking-[0.08em] text-fg3">UPTIME</div>
              <div className="mt-1 font-mono text-[12px] tabular-nums text-fg1">{svc.uptime}</div>
            </div>
            <div>
              <div className="font-display text-[9px] uppercase tracking-[0.08em] text-fg3">LATENCY</div>
              <div className="mt-1 font-mono text-[12px] tabular-nums text-fg1">{svc.latency}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
