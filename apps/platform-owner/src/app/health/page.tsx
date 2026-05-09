/**
 * File:        apps/platform-owner/src/app/health/page.tsx
 * Module:      platform-owner · Platform Health Page
 * Purpose:     Infrastructure health — services grid, node grid, LP connectivity
 *
 * Exports:
 *   - HealthPage() — client component; reads from MockDataContext
 *
 * Depends on:
 *   - ../../features/health — ServiceGrid, NodeGrid, LpStatus
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useMockData } from '../../lib/mock-data-context';
import { ServiceGrid, NodeGrid, LpStatus } from '../../features/health';

export default function HealthPage() {
  const { infraServices, infraNodes, liquidityProviders } = useMockData();
  const allOk = infraServices.every((s) => s.status === 'OPERATIONAL');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">
            Platform Health
          </h1>
          <p className="mt-0.5 font-ui text-[12px] text-fg3">
            {allOk ? 'All systems operational' : 'Some services require attention'} · Last checked just now
          </p>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] ${allOk ? 'border-bull/25 bg-bull/10 text-bull' : 'border-warn/25 bg-warn/10 text-warn'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${allOk ? 'bg-bull animate-pulse' : 'bg-warn'}`} />
          {allOk ? 'Operational' : 'Degraded'}
        </span>
      </div>

      <div>
        <div className="mb-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">
          Platform Services
        </div>
        <ServiceGrid services={infraServices} />
      </div>

      <div>
        <div className="mb-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">
          Server Nodes
        </div>
        <NodeGrid nodes={infraNodes} />
      </div>

      <div>
        <div className="mb-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">
          Liquidity Providers
        </div>
        <LpStatus providers={liquidityProviders} />
      </div>
    </div>
  );
}
