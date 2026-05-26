/**
 * File:        apps/platform-owner/src/app/brokers/page.tsx
 * Module:      platform-owner · All Brokers Page
 * Purpose:     All broker tenants — filterable, sortable, paginated table with plan badges,
 *              health scores, and AUM. Real API data with Obsidian skeleton loading states.
 *
 * Exports:
 *   - BrokersPage()  — client component; reads from real API + SkeletonTable
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-11
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { api, ApiBroker } from '../../lib/api/endpoints';
import { apiBrokerToUi } from '../../lib/api/broker-mappers';
import { BrokersTable } from '../../features/brokers';
import { SkeletonBrokerTable } from '../../shared/components/skeleton';
import { TableToolbar } from '../../components/TableToolbar';
import { PaginationControls } from '../../components/PaginationControls';
import type { Broker } from '../../lib/types';

const PAGE_SIZE = 10;

export default function BrokersPage() {
  const [apiBrokers, setApiBrokers] = useState<ApiBroker[] | null>(null);
  const [apiError, setApiError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setCurrentPage(1);
    api.getPlatformDashboardBrokers(200)
      .then((data) => { if (!cancelled) setApiBrokers(data?.brokers ?? null); })
      .catch(() => {
        if (cancelled) return;
        api.listBrokersWithMetrics().then(setApiBrokers).catch(() => { if (!cancelled) setApiError(true); });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const enriched = apiBrokers ? apiBrokers.map(apiBrokerToUi) : [];

  const filtered = enriched.filter((b) => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || b.status === statusFilter;
    const matchPlan = !planFilter || b.plan === planFilter;
    return matchSearch && matchStatus && matchPlan;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalAum = filtered.reduce((s, b) => s + b.aum, 0);
  const activeCt = filtered.filter((b) => b.status === 'ACTIVE').length;

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <div className="h-6 w-32 bg-[var(--bg-elevated)] animate-shimmer-slow rounded mb-2" />
            <div className="h-4 w-48 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
          </div>
          <div className="h-9 w-36 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
        </div>

        {/* Table skeleton */}
        <SkeletonBrokerTable rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">
            All Brokers
          </h1>
          <p className="mt-0.5 font-ui text-[12px] text-fg3">
            {apiBrokers ? apiBrokers.length : 0} tenants · {activeCt} active
            {apiError && <span className="ml-2 text-[var(--warn)]">· API offline</span>}
            {totalAum > 0 && (
              <span className="ml-2 font-mono text-fg2">
                · AUM: ${totalAum >= 1_000_000 ? `${(totalAum / 1_000_000).toFixed(1)}M` : `${(totalAum / 1000).toFixed(0)}K`}
              </span>
            )}
          </p>
        </div>
        <Link
          href="/brokers/new"
          className="flex items-center gap-2 rounded-r-md bg-accent px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.08em] text-white hover:bg-accent/90 transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
          ONBOARD BROKER
        </Link>
      </div>

      {/* Search + filters */}
      <TableToolbar
        searchValue={search}
        onSearch={(v) => { setSearch(v); setCurrentPage(1); }}
        filters={[
          { key: 'status', label: 'Status', options: [
            { value: 'ACTIVE', label: 'Active' },
            { value: 'SUSPENDED', label: 'Suspended' },
            { value: 'TRIAL', label: 'Trial' },
          ]},
          { key: 'plan', label: 'Plan', options: [
            { value: 'STARTER', label: 'Starter' },
            { value: 'GROWTH', label: 'Growth' },
            { value: 'PRO', label: 'Pro' },
            { value: 'ENTERPRISE', label: 'Enterprise' },
          ]},
        ]}
        filterValues={{ status: statusFilter, plan: planFilter }}
        onFilterChange={(key, value) => {
          if (key === 'status') { setStatusFilter(value); setCurrentPage(1); }
          if (key === 'plan') { setPlanFilter(value); setCurrentPage(1); }
        }}
        placeholder="Search brokers..."
      />

      {filtered.length === 0 && !loading ? (
        <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-12 text-center">
          <p className="font-ui text-[13px] text-fg3">No brokers match your filters</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setPlanFilter(''); }}
            className="mt-2 font-mono text-[11px] text-accent hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <BrokersTable brokers={paginated} />
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-fg3">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}