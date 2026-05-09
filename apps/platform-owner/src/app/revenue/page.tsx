/**
 * File:        apps/platform-owner/src/app/revenue/page.tsx
 * Module:      platform-owner · SaaS Revenue Page
 * Purpose:     Revenue overview — MRR chart, plan breakdown, invoice table
 *
 * Exports:
 *   - RevenuePage() — client component; reads from MockDataContext
 *
 * Depends on:
 *   - ../../features/revenue — RevenueChart, PlanBreakdown, InvoiceTable
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useMockData } from '../../lib/mock-data-context';
import { RevenueChart, PlanBreakdown, InvoiceTable } from '../../features/revenue';

export default function RevenuePage() {
  const { revenueSeries, planRevenue, billingInvoices, brokers } = useMockData();
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
        <InvoiceTable invoices={billingInvoices} brokers={brokers} />
      </div>
    </div>
  );
}
