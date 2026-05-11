/**
 * File:        apps/platform-owner/src/app/entitlements/page.tsx
 * Module:      platform-owner · Entitlements Page
 * Purpose:     Feature entitlement plans per tenant — display and upsert via real API.
 *              Obsidian skeleton loading states.
 *
 * Exports:
 *   - EntitlementsPage() — client component; reads from API, writes via POST
 *
 * Depends on:
 *   - ../../lib/api/endpoints   — api.listAllEntitlements, api.listTenants, api.upsertEntitlements
 *   - ../../shared/components/skeleton — SkeletonTable
 *   - @obsidian/obsidian-ui   — cn
 *
 * Side-effects:
 *   - GET /api/saas/entitlements, /api/saas/brokers on mount
 *   - POST /api/saas/entitlements on form submit
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-11
 */

'use client';

import { useEffect, useState } from 'react';
import { cn } from '@obsidian/obsidian-ui';
import { api } from '../../lib/api/endpoints';
import { SkeletonTable } from '../../shared/components/skeleton';
import type { EntitlementPlan, Tenant } from '../../lib/types';
import { ApiError } from '../../lib/api/client';

interface UpsertEntitlementDto {
  tenantId: string;
  planCode: string;
  entitlements: Record<string, unknown>;
  featureFlags: Record<string, boolean>;
}

export default function EntitlementsPage() {
  const [entitlementPlans, setEntitlementPlans] = useState<EntitlementPlan[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UpsertEntitlementDto>({
    tenantId: '',
    planCode: 'STARTER',
    entitlements: { maxAccounts: 50, apiRateLimit: 1000 },
    featureFlags: { advancedCharts: false, algoTrading: false, whiteLabel: false },
  });

  useEffect(() => {
    Promise.all([
      api.listAllEntitlements().catch(() => null),
      api.listTenants().catch(() => null),
    ]).then(([ents, tens]) => {
      if (ents) setEntitlementPlans(ents as EntitlementPlan[]);
      if (tens) {
        setTenants(tens as unknown as Tenant[]);
        if (tens.length > 0) setForm((f) => ({ ...f, tenantId: (tens[0] as unknown as { id: string }).id }));
      }
    }).catch(() => setError('Failed to load entitlements')).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!form.tenantId || !form.planCode.trim()) {
      setError('Tenant and plan code are required.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.upsertEntitlements(form);
      setSuccess(`Entitlement plan "${result.planCode}" saved for tenant.`);
      const updated = await api.listAllEntitlements();
      setEntitlementPlans(updated as EntitlementPlan[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save entitlement.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full rounded-r-sm border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-[12px] text-fg1 placeholder:text-fg4 focus:border-accent focus:outline-none';

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Header skeleton */}
        <div className="border-b border-[var(--border)] pb-4">
          <div className="h-6 w-36 bg-[var(--bg-elevated)] animate-shimmer-slow rounded mb-2" />
          <div className="h-4 w-64 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
        </div>

        {/* Form skeleton */}
        <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-5">
          <div className="h-4 w-40 bg-[var(--bg-elevated)] animate-shimmer-slow rounded mb-4" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="h-3 w-16 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
              <div className="h-10 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
              <div className="h-10 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
            </div>
          </div>
        </div>

        {/* Table skeleton */}
        <SkeletonTable rows={5} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">Entitlements</h1>
        <p className="mt-0.5 font-ui text-[12px] text-fg3">Feature flags and plan entitlements per tenant</p>
      </div>

      {/* Form */}
      <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-5">
        <div className="mb-4 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">Upsert Entitlement Plan</div>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[10px] uppercase tracking-[0.06em] text-fg3">Tenant</span>
            <select
              value={form.tenantId}
              onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))}
              className={inputCls}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.displayName}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[10px] uppercase tracking-[0.06em] text-fg3">Plan Code</span>
            <select
              value={form.planCode}
              onChange={(e) => setForm((f) => ({ ...f, planCode: e.target.value }))}
              className={inputCls}
            >
              <option value="STARTER">STARTER</option>
              <option value="GROWTH">GROWTH</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
          </label>
          <div className="col-span-full flex flex-wrap gap-4">
            {Object.entries(form.featureFlags).map(([key, val]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={val}
                  onChange={(e) => setForm((f) => ({ ...f, featureFlags: { ...f.featureFlags, [key]: e.target.checked } }))}
                  className="accent-accent"
                />
                <span className="font-mono text-[11px] text-fg2">{key}</span>
              </label>
            ))}
          </div>
          {error  && <p className="col-span-full font-ui text-[12px] text-[var(--bear)]">{error}</p>}
          {success && <p className="col-span-full font-ui text-[12px] text-bull">{success}</p>}
          <div className="col-span-full">
            <button
              type="submit"
              disabled={submitting || !form.tenantId}
              className={cn('rounded-r-sm border border-accent bg-accent/10 px-4 py-2 font-mono text-[12px] text-accent transition-colors hover:bg-accent hover:text-white', (submitting || !form.tenantId) && 'opacity-50 cursor-not-allowed')}
            >
              {submitting ? 'Saving…' : 'Save Entitlement Plan'}
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-r-lg border border-[var(--border)]">
        <table className="w-full text-left">
          <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
            <tr>
              {['Tenant', 'Plan Code', 'Max Accounts', 'API Rate Limit', 'Flags', 'Updated'].map((h) => (
                <th key={h} className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-panel)]">
            {entitlementPlans.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-ui text-[12px] text-fg3">No entitlement plans yet.</td>
              </tr>
            ) : (
              entitlementPlans.map((ep) => {
                const tenant = tenants.find((t) => t.id === ep.tenantId);
                const flags = Object.entries(ep.featureFlags).filter(([, v]) => v).map(([k]) => k);
                return (
                  <tr key={ep.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-4 py-3 font-ui text-[13px] text-fg1">{tenant?.displayName ?? ep.tenantId}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-accent uppercase">{ep.planCode}</td>
                    <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-fg1">
                      {typeof (ep.entitlements as Record<string, unknown>).maxAccounts === 'number'
                        ? String((ep.entitlements as Record<string, unknown>).maxAccounts) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-fg1">
                      {typeof (ep.entitlements as Record<string, unknown>).apiRateLimit === 'number'
                        ? String((ep.entitlements as Record<string, unknown>).apiRateLimit) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-bull">{flags.length > 0 ? flags.join(', ') : '—'}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-fg3">{new Date(ep.updatedAt).toLocaleDateString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}