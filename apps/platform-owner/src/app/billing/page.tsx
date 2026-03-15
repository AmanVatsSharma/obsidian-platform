/**
 * @file page.tsx
 * @module platform-owner
 * @description Billing invoice placeholders list and create with mock data
 * @author BharatERP
 * @created 2026-03-15
 */

'use client';

import { useState } from 'react';
import { useMockData } from '../../lib/mock-data-context';
import type { CreateBillingInput } from '../../lib/types';

export default function BillingPage() {
  const { tenants, billingInvoices, addBillingInvoice } = useMockData();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateBillingInput>({
    tenantId: tenants[0]?.id ?? '',
    invoiceNumber: '',
    amount: '',
    currency: 'USD',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.tenantId || !form.invoiceNumber.trim() || !form.amount.trim() || !form.currency.trim()) {
      setError('All fields are required.');
      return;
    }
    if (!/^\d+(\.\d+)?$/.test(form.amount)) {
      setError('Amount must be a number (e.g. 100 or 99.99).');
      return;
    }
    setLoading(true);
    try {
      const created = addBillingInvoice(form);
      setSuccess(`Invoice ${created.invoiceNumber} created (${created.id}).`);
      setForm({ tenantId: form.tenantId, invoiceNumber: '', amount: '', currency: 'USD' });
    } catch {
      setError('Failed to create invoice.');
    } finally {
      setLoading(false);
    }
  };

  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: 16 };
  const thTdStyle: React.CSSProperties = { border: '1px solid #334155', padding: '12px 16px', textAlign: 'left' };

  const tenantName = (id: string) => tenants.find((t) => t.id === id)?.displayName ?? id;

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <h2>Billing and Invoices</h2>
      <p>Invoice placeholders and plan metering. Data is mock until backend is connected.</p>

      <section>
        <h3 style={{ marginBottom: 12 }}>Create invoice placeholder</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Tenant</span>
            <select
              value={form.tenantId}
              onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))}
              style={{ padding: 8, borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0' }}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.displayName}</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Invoice number</span>
            <input
              type="text"
              value={form.invoiceNumber}
              onChange={(e) => setForm((f) => ({ ...f, invoiceNumber: e.target.value }))}
              placeholder="INV-2026-003"
              style={{ padding: 8, borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Amount</span>
            <input
              type="text"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="1000.00"
              style={{ padding: 8, borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Currency</span>
            <input
              type="text"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              placeholder="USD"
              style={{ padding: 8, borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0' }}
            />
          </label>
          {error && <p style={{ color: '#f87171', margin: 0 }}>{error}</p>}
          {success && <p style={{ color: '#34d399', margin: 0 }}>{success}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px 16px', cursor: loading ? 'not-allowed' : 'pointer', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 6, fontWeight: 600 }}
          >
            {loading ? 'Creating…' : 'Create invoice'}
          </button>
        </form>
      </section>

      <section>
        <h3 style={{ marginBottom: 12 }}>Invoices</h3>
        {billingInvoices.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No invoices yet.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>Tenant</th>
                <th style={thTdStyle}>Invoice number</th>
                <th style={thTdStyle}>Amount</th>
                <th style={thTdStyle}>Currency</th>
                <th style={thTdStyle}>Status</th>
                <th style={thTdStyle}>Created</th>
              </tr>
            </thead>
            <tbody>
              {billingInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={thTdStyle}>{tenantName(inv.tenantId)}</td>
                  <td style={thTdStyle}>{inv.invoiceNumber}</td>
                  <td style={thTdStyle}>{inv.amount}</td>
                  <td style={thTdStyle}>{inv.currency}</td>
                  <td style={thTdStyle}>{inv.status}</td>
                  <td style={thTdStyle}>{new Date(inv.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
