/**
 * File:        apps/platform-owner/src/app/revenue/page.tsx
 * Module:      platform-owner · SaaS Revenue Page
 * Purpose:     Revenue overview — MRR chart, plan breakdown, invoice table.
 *              Fetches real data from backend API with Obsidian skeleton loading states.
 *
 * Exports:
 *   - RevenuePage() — client component; data from API with skeleton loading states
 *
 * Depends on:
 *   - ../../lib/api/endpoints   — api.getRevenueSeries, api.getPlanRevenueBreakdown, api.listAllBilling, api.listBrokersWithMetrics
 *   - ../../lib/api/broker-mappers — apiBrokerToUi
 *   - ../../features/revenue     — RevenueChart, PlanBreakdown, InvoiceTable
 *   - ../../shared/components/skeleton — SkeletonChart, SkeletonKpiGrid, SkeletonTable
 *
 * Side-effects:
 *   - GET /api/saas/revenue-series, /api/saas/revenue/plan-breakdown, /api/saas/billing/invoices, /api/saas/brokers/metrics
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-11
 */

'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api/endpoints';
import { apiBrokerToUi } from '../../lib/api/broker-mappers';
import { RevenueChart, PlanBreakdown, InvoiceTable } from '../../features/revenue';
import { SkeletonChart, SkeletonTable } from '../../shared/components/skeleton';
import type { Broker, RevenuePoint, PlanRevenueSplit, BillingInvoicePlaceholder, BrokerPlan } from '../../lib/types';
import { ApiError } from '../../lib/api/client';

interface PlanRevenueApi {
  plan: string;
  amount: number;
  tenants: number;
}

export default function RevenuePage() {
  const [revenueSeries, setRevenueSeries] = useState<RevenuePoint[]>([]);
  const [planRevenue, setPlanRevenue] = useState<PlanRevenueSplit[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoicePlaceholder[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [revenueData, planData, invoicesData, brokersData] = await Promise.all([
          api.getRevenueSeries().catch(() => null),
          api.getPlanRevenueBreakdown().catch(() => null),
          api.listAllBilling().catch(() => null),
          api.listBrokersWithMetrics().catch(() => null),
        ]);

        if (cancelled) return;

        if (revenueData) setRevenueSeries(revenueData);
        if (planData) {
          const cast: PlanRevenueSplit[] = planData.map((p) => ({
            plan: p.plan as BrokerPlan,
            amount: p.amount,
            tenants: p.tenants,
          }));
          setPlanRevenue(cast);
        }
        if (invoicesData) setInvoices(invoicesData);
        if (brokersData) setBrokers(brokersData.map(apiBrokerToUi));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load revenue data');
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
        {/* Header skeleton */}
        <div className="border-b border-[var(--border)] pb-4">
          <div className="h-6 w-32 bg-[var(--bg-elevated)] animate-shimmer-slow rounded mb-2" />
          <div className="h-4 w-56 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
        </div>

        {/* Chart + breakdown skeleton */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SkeletonChart className="h-full" />
          </div>
          <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4">
            <div className="h-4 w-32 bg-[var(--bg-elevated)] animate-shimmer-slow rounded mb-4" />
            <div className="h-32 w-32 mx-auto bg-[var(--bg-elevated)] animate-shimmer-slow rounded-full" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
                  <div className="h-3 w-16 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Invoice table skeleton */}
        <SkeletonTable rows={6} />
      </div>
    );
  }

  if (error && !revenueSeries.length) {
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

  const totalMrr = revenueSeries[revenueSeries.length - 1]?.mrr ?? 0;
  const totalTenants = planRevenue.reduce((s, p) => s + p.tenants, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">
            SaaS Revenue
          </h1>
          <p className="mt-0.5 font-ui text-[12px] text-fg3">
            ${(totalMrr / 1000).toFixed(1)}K MRR · {totalTenants} paying tenants
          </p>
        </div>
      </div>

      {/* Revenue chart + plan breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueSeries} />
        </div>
        <PlanBreakdown data={planRevenue} />
      </div>

      {/* Invoice table */}
      <div>
        <div className="mb-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">
          Recent Invoices
        </div>
        <InvoiceTable invoices={invoices} brokers={brokers} />
      </div>
    </div>
  );
}