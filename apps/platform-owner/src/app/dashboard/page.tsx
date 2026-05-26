/**
 * File:        apps/platform-owner/src/app/dashboard/page.tsx
 * Module:      platform-owner · Dashboard Page
 * Purpose:     Platform owner dashboard — KPI cards, revenue sparkline, broker health, system status.
 *              Fetches real data from backend API with Obsidian skeleton loading states.
 *
 * Exports:
 *   - DashboardPage() — client component; data from API with skeleton loading states
 *
 * Depends on:
 *   - ../../lib/api/endpoints     — api.getPlatformStats, api.getRevenueSeries, api.listBrokersWithMetrics
 *   - ../../lib/api/broker-mappers — apiBrokerToUi
 *   - ../../features/dashboard    — all dashboard feature components
 *   - ../../shared/components/skeleton — SkeletonKpiGrid, SkeletonTwoCol, SkeletonBrokerTable, SkeletonChart
 *
 * Side-effects:
 *   - GET /api/saas/stats, /api/saas/revenue-series, /api/saas/brokers/metrics on mount
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-11
 */

'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api/endpoints';
import { apiBrokerToUi } from '../../lib/api/broker-mappers';
import {
  DashboardKpiCards,
  RevenueSparkline,
  BrokerHealthTable,
  SystemStatus,
} from '../../features/dashboard';
import {
  SkeletonKpiGrid,
  SkeletonTwoCol,
  SkeletonBrokerTable,
} from '../../shared/components/skeleton';
import type { Broker, RevenuePoint, InfraService } from '../../lib/types';

interface PlatformStats {
  totalBrokers: number;
  activeBrokers: number;
  totalClients: number;
  totalAum: string;
  totalMonthlyRevenue: string;
  totalMonthlyRevenuePrev: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [revenueSeries, setRevenueSeries] = useState<RevenuePoint[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [infraServices, setInfraServices] = useState<InfraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statsData, revenueData, brokersData, healthData] = await Promise.all([
          api.getPlatformDashboardStats().catch(() => null),
          api.getPlatformDashboardRevenue().catch(() => null),
          api.getPlatformDashboardBrokers().catch(() => null),
          api.getPlatformHealth().catch(() => null),
        ]);

        if (cancelled) return;

        if (statsData) setStats(statsData);
        if (revenueData) setRevenueSeries(revenueData);
        if (brokersData?.brokers) setBrokers(brokersData.brokers.map(apiBrokerToUi));
        if (healthData) setInfraServices(healthData.services as InfraService[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Page header skeleton */}
        <div className="border-b border-[var(--border)] pb-4">
          <div className="h-6 w-32 bg-[var(--bg-elevated)] animate-shimmer-slow rounded mb-2" />
          <div className="h-4 w-64 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
        </div>

        {/* KPI skeleton */}
        <SkeletonKpiGrid />

        {/* Chart + panel skeleton */}
        <SkeletonTwoCol />

        {/* Table skeleton */}
        <SkeletonBrokerTable rows={5} />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
          <p className="font-display text-[14px] uppercase tracking-[0.08em] text-[var(--bear)]">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="font-mono text-[12px] text-accent hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const latestMrr = stats ? Number(stats.totalMonthlyRevenue) : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Page title */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">
            Dashboard
          </h1>
          <p className="mt-0.5 font-ui text-[12px] text-fg3">
            Platform-wide overview · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KPI cards — use real stats when available, fall back to computed from brokers */}
      <DashboardKpiCards
        brokers={brokers.length > 0 ? brokers : []}
        mrr={latestMrr}
      />

      {/* Revenue sparkline + system status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueSparkline data={revenueSeries.length > 0 ? revenueSeries : []} />
        </div>
        <SystemStatus services={infraServices.length > 0 ? infraServices : []} />
      </div>

      {/* Broker health table */}
      <BrokerHealthTable brokers={brokers.length > 0 ? brokers : []} />
    </div>
  );
}