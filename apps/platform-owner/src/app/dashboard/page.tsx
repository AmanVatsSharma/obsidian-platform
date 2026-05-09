/**
 * File:        apps/platform-owner/src/app/dashboard/page.tsx
 * Module:      platform-owner · Dashboard Page
 * Purpose:     Platform owner dashboard — KPI cards, revenue sparkline, broker health, system status
 *
 * Exports:
 *   - DashboardPage() — server component; data pulled from MockDataContext via client wrappers
 *
 * Depends on:
 *   - ../../features/dashboard — all dashboard feature components
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useMockData } from '../../lib/mock-data-context';
import {
  DashboardKpiCards,
  RevenueSparkline,
  BrokerHealthTable,
  SystemStatus,
} from '../../features/dashboard';

export default function DashboardPage() {
  const { brokers, revenueSeries, infraServices } = useMockData();
  const latestMrr = revenueSeries[revenueSeries.length - 1]?.mrr ?? 0;

  return (
    <div className="space-y-6 p-6">
      {/* Page title */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">
            Dashboard
          </h1>
          <p className="mt-0.5 font-ui text-[12px] text-fg3">Platform-wide overview · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* KPI cards */}
      <DashboardKpiCards brokers={brokers} mrr={latestMrr} />

      {/* Revenue sparkline + system status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueSparkline data={revenueSeries} />
        </div>
        <SystemStatus services={infraServices} />
      </div>

      {/* Broker health table */}
      <BrokerHealthTable brokers={brokers} />
    </div>
  );
}
