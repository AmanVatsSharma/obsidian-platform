/**
 * File:        apps/platform-owner/src/app/entitlements/page.tsx
 * Module:      platform-owner · Entitlements Page
 * Purpose:     Feature entitlement plans per tenant — Obsidian-styled list and upsert form
 *
 * Exports:
 *   - EntitlementsPage() — client component; reads and mutates via MockDataContext
 *
 * Depends on:
 *   - ../../lib/mock-data-context — useMockData
 *   - @obsidian/obsidian-ui      — cn
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useState } from 'react';
import { cn } from '@obsidian/obsidian-ui';
import { useMockData } from '../../lib/mock-data-context';
import type { UpsertEntitlementInput } from '../../lib/types';

export default function EntitlementsPage() {
  const { tenants, entitlementPlans, upsertEntitlement } = useMockData();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<UpsertEntitlementInput>({
    tenantId: tenants[0]?.id ?? '',
    planCode: 'starter',
    entitlements: { maxAccounts: 50, apiRateLimit: 1000 },
    featureFlags: { advancedCharts: false, algoTrading: false, whiteLabel: false },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!form.tenantId || !form.planCode.trim()) {
      setError('Tenant and plan code are required.');
      return;
    }
    setLoading(true);
    try {
      upsertEntitlement(form);
      setSuccess(`Entitlement plan "${form.planCode}" saved for tenant ${form.tenantId}.`);
    } catch {
      setError('Failed to save entitlement.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full rounded-r-sm border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-[12px] text-fg1 placeholder:text-fg4 focus:border-accent focus:outline-none';

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
            <input
              type="text" value={form.planCode}
              onChange={(e) => setForm((f) => ({ ...f, planCode: e.target.value }))}
              placeholder="starter / growth / pro / enterprise"
              className={inputCls}
            />
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
          {error  && <p className="col-span-full font-ui text-[12px] text-bear">{error}</p>}
          {success && <p className="col-span-full font-ui text-[12px] text-bull">{success}</p>}
          <div className="col-span-full">
            <button
              type="submit" disabled={loading}
              className={cn('rounded-r-sm border border-accent bg-accent/10 px-4 py-2 font-mono text-[12px] text-accent transition-colors hover:bg-accent hover:text-white', loading && 'opacity-50 cursor-not-allowed')}
            >
              {loading ? 'Saving…' : 'Save Entitlement Plan'}
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
            {entitlementPlans.map((ep) => {
              const tenant = tenants.find((t) => t.id === ep.tenantId);
              const flags = Object.entries(ep.featureFlags).filter(([, v]) => v).map(([k]) => k);
              return (
                <tr key={ep.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-4 py-3 font-ui text-[13px] text-fg1">{tenant?.displayName ?? ep.tenantId}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-accent uppercase">{ep.planCode}</td>
                  <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-fg1">{String((ep.entitlements as Record<string, unknown>).maxAccounts ?? '—')}</td>
                  <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-fg1">{String((ep.entitlements as Record<string, unknown>).apiRateLimit ?? '—')}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-bull">{flags.length > 0 ? flags.join(', ') : '—'}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-fg3">{new Date(ep.updatedAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
