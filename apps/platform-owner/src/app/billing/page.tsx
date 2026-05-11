/**
 * File:        apps/platform-owner/src/app/billing/page.tsx
 * Module:      platform-owner · Billing Page
 * Purpose:     Per-tenant billing management — invoice list and creation form.
 *              Fetches from backend API with Obsidian skeleton loading states.
 *
 * Exports:
 *   - BillingPage() — client component; reads and creates via API
 *
 * Depends on:
 *   - ../../lib/api/endpoints   — api.listAllBilling, api.listTenants, api.createBilling
 *   - ../../shared/components/skeleton — SkeletonTable
 *   - @obsidian/obsidian-ui      — cn
 *
 * Side-effects:
 *   - GET /api/saas/billing/invoices, /api/saas/brokers on mount
 *   - POST /api/saas/billing/invoices on submit
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-11
 */

'use client';

import { useEffect, useState } from 'react';
import { cn } from '@obsidian/obsidian-ui';
import { api } from '../../lib/api/endpoints';
import { SkeletonTable } from '../../shared/components/skeleton';
import { ApiError } from '../../lib/api/client';

interface BillingInvoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface TenantInfo {
  id: string;
  code: string;
  displayName: string;
}

const STATUS_STYLE: Record<string, string> = {
  PAID:    'bg-bull/10  text-bull  border-bull/25',
  DRAFT:   'bg-warn/10  text-warn  border-warn/25',
  OVERDUE: 'bg-bear/10  text-bear  border-bear/25',
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    tenantId: '',
    invoiceNumber: '',
    amount: '',
    currency: 'USD',
  });

  useEffect(() => {
    Promise.all([
      api.listAllBilling().catch(() => null),
      api.listTenants().catch(() => null),
    ]).then(([invData, tenantData]) => {
      if (invData) setInvoices(invData as BillingInvoice[]);
      if (tenantData) {
        setTenants(tenantData as unknown as TenantInfo[]);
        if (tenantData.length > 0) setForm((f) => ({ ...f, tenantId: (tenantData[0] as unknown as { id: string }).id }));
      }
    }).catch(() => setError('Failed to load billing data')).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!form.tenantId || !form.invoiceNumber || !form.amount) {
      setError('All fields are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createBilling(form);
      setSuccess(`Invoice ${form.invoiceNumber} created.`);
      setForm((f) => ({ ...f, invoiceNumber: '', amount: '' }));
      const updated = await api.listAllBilling();
      setInvoices(updated as BillingInvoice[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const tenantName = (id: string) => tenants.find((t) => t.id === id)?.displayName ?? id;
  const inputCls = 'w-full rounded-r-sm border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-[12px] text-fg1 placeholder:text-fg4 focus:border-accent focus:outline-none';

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Header skeleton */}
        <div className="border-b border-[var(--border)] pb-4">
          <div className="h-6 w-32 bg-[var(--bg-elevated)] animate-shimmer-slow rounded mb-2" />
          <div className="h-4 w-64 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
        </div>

        {/* Form skeleton */}
        <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-5">
          <div className="h-4 w-32 bg-[var(--bg-elevated)] animate-shimmer-slow rounded mb-4" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-16 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
                <div className="h-10 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Table skeleton */}
        <SkeletonTable rows={6} cols={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">Tenant Billing</h1>
        <p className="mt-0.5 font-ui text-[12px] text-fg3">Per-tenant billing management and invoice creation</p>
      </div>

      {/* Create invoice form */}
      <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-5">
        <div className="mb-4 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">Create Invoice</div>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[10px] uppercase tracking-[0.06em] text-fg3">Tenant</span>
            <select value={form.tenantId} onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))} className={inputCls}>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.displayName}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[10px] uppercase tracking-[0.06em] text-fg3">Invoice Number</span>
            <input type="text" value={form.invoiceNumber} onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))} placeholder="INV-2026-001" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[10px] uppercase tracking-[0.06em] text-fg3">Amount</span>
            <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="5000.00" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[10px] uppercase tracking-[0.06em] text-fg3">Currency</span>
            <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} className={inputCls}>
              <option value="USD">USD</option>
              <option value="INR">INR</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </label>
          {error && <p className="col-span-full font-ui text-[12px] text-[var(--bear)]">{error}</p>}
          {success && <p className="col-span-full font-ui text-[12px] text-bull">{success}</p>}
          <div className="col-span-full">
            <button type="submit" disabled={submitting} className={cn('rounded-r-sm border border-accent bg-accent/10 px-4 py-2 font-mono text-[12px] text-accent transition-colors hover:bg-accent hover:text-white', submitting && 'opacity-50 cursor-not-allowed')}>
              {submitting ? 'Creating…' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>

      {/* Invoice table */}
      <div className="overflow-x-auto rounded-r-lg border border-[var(--border)]">
        <table className="w-full text-left">
          <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
            <tr>
              {['Invoice', 'Tenant', 'Amount', 'Currency', 'Status', 'Date'].map((h) => (
                <th key={h} className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-panel)]">
            {invoices.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center font-ui text-[12px] text-fg3">No invoices yet.</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-4 py-3 font-mono text-[12px] text-accent">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 font-ui text-[13px] text-fg1">{tenantName(inv.tenantId)}</td>
                  <td className="px-4 py-3 font-mono text-[13px] tabular-nums text-fg1">${Number(inv.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-fg3">{inv.currency}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase', STATUS_STYLE[inv.status] ?? 'text-fg3 border-[var(--border)]')}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-fg3">{new Date(inv.createdAt).toLocaleDateString('en-GB')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}