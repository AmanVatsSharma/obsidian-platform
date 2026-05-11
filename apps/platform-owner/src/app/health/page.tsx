/**
 * File:        apps/platform-owner/src/app/health/page.tsx
 * Module:      platform-owner · Platform Health Page
 * Purpose:     Infrastructure health — services grid, node grid, LP connectivity.
 *              Fetches real data from backend API with Obsidian skeleton loading states.
 *
 * Exports:
 *   - HealthPage() — client component; data from API with skeleton loading states
 *
 * Depends on:
 *   - ../../lib/api/endpoints   — api.getPlatformHealth
 *   - ../../features/health     — ServiceGrid, NodeGrid, LpStatus
 *   - ../../shared/components/skeleton — SkeletonPanel, SkeletonTable
 *
 * Side-effects:
 *   - GET /api/saas/health on mount
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-11
 */

'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api/endpoints';
import { ServiceGrid, NodeGrid, LpStatus } from '../../features/health';
import { SkeletonPanel, SkeletonTable } from '../../shared/components/skeleton';
import type { InfraService, InfraNode, LiquidityProvider } from '../../lib/types';
import { ApiError } from '../../lib/api/client';

interface PlatformHealthResponse {
  services: InfraService[];
  nodes: InfraNode[];
  liquidityProviders: LiquidityProvider[];
}

export default function HealthPage() {
  const [health, setHealth] = useState<PlatformHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getPlatformHealth()
      .then((data) => setHealth(data as PlatformHealthResponse))
      .catch((err: unknown) => {
        if (err instanceof ApiError) setError(err.message);
        else setError('Failed to load health data');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <div className="h-6 w-40 bg-[var(--bg-elevated)] animate-shimmer-slow rounded mb-2" />
            <div className="h-4 w-64 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
          </div>
          <div className="h-7 w-24 bg-[var(--bg-elevated)] animate-shimmer-slow rounded-full" />
        </div>

        {/* Service grid skeleton */}
        <div>
          <div className="h-4 w-32 bg-[var(--bg-elevated)] animate-shimmer-slow rounded mb-3" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
                    <div className="h-3 w-32 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
                  </div>
                  <div className="h-3 w-3 rounded-full bg-[var(--bg-elevated)] animate-shimmer-slow" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="space-y-1">
                      <div className="h-2 w-10 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
                      <div className="h-3 w-12 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Node grid skeleton */}
        <div>
          <div className="h-4 w-28 bg-[var(--bg-elevated)] animate-shimmer-slow rounded mb-3" />
          <SkeletonTable rows={3} cols={4} />
        </div>

        {/* LP skeleton */}
        <div>
          <div className="h-4 w-40 bg-[var(--bg-elevated)] animate-shimmer-slow rounded mb-3" />
          <SkeletonTable rows={3} cols={5} />
        </div>
      </div>
    );
  }

  if (error && !health) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
          <p className="font-display text-[14px] uppercase tracking-[0.08em] text-[var(--bear)]">{error}</p>
          <button onClick={() => window.location.reload()} className="font-mono text-[12px] text-accent hover:underline">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const services = health?.services ?? [];
  const nodes = health?.nodes ?? [];
  const liquidityProviders = health?.liquidityProviders ?? [];
  const allOk = services.every((s) => s.status === 'OPERATIONAL');

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
        <ServiceGrid services={services} />
      </div>

      <div>
        <div className="mb-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">
          Server Nodes
        </div>
        <NodeGrid nodes={nodes} />
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