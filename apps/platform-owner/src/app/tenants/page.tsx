/**
 * @file page.tsx
 * @module platform-owner
 * @description Tenants list and create flow with mock data
 * @author BharatERP
 * @created 2026-03-15
 */

'use client';

import { useState } from 'react';
import { useMockData } from '../../lib/mock-data-context';
import type { CreateTenantInput, TenantStatus } from '../../lib/types';

const STATUS_OPTIONS: TenantStatus[] = ['PENDING', 'ACTIVE', 'SUSPENDED'];

export default function TenantsPage() {
  const { tenants, addTenant } = useMockData();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateTenantInput>({
    code: '',
    displayName: '',
    timezone: 'UTC',
    jurisdictionProfile: 'GLOBAL',
    status: 'PENDING',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.code.trim() || !form.displayName.trim()) {
      setError('Code and display name are required.');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(form.code)) {
      setError('Code must be lowercase letters, numbers, and hyphens only.');
      return;
    }
    if (form.code.length < 3 || form.code.length > 128) {
      setError('Code must be 3–128 characters.');
      return;
    }
    setLoading(true);
    try {
      const created = addTenant({
        code: form.code.trim(),
        displayName: form.displayName.trim(),
        timezone: form.timezone || 'UTC',
        jurisdictionProfile: form.jurisdictionProfile || 'GLOBAL',
        status: form.status || 'PENDING',
      });
      setSuccess(`Tenant "${created.displayName}" created (${created.id}).`);
      setForm({ code: '', displayName: '', timezone: 'UTC', jurisdictionProfile: 'GLOBAL', status: 'PENDING' });
    } catch {
      setError('Failed to add tenant.');
    } finally {
      setLoading(false);
    }
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 16,
  };
  const thTdStyle: React.CSSProperties = {
    border: '1px solid #334155',
    padding: '12px 16px',
    textAlign: 'left',
  };

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <h2>Tenant Provisioning</h2>
      <p>Onboard brokers, legal entities, and environment allocations. Data is mock until backend is connected.</p>

      <section>
        <h3 style={{ marginBottom: 12 }}>Create tenant</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Code (lowercase, 3–128 chars)</span>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="e.g. broker-delta"
              style={{ padding: 8, borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Display name</span>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="e.g. Broker Delta Inc"
              style={{ padding: 8, borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Timezone</span>
            <input
              type="text"
              value={form.timezone}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              placeholder="UTC"
              style={{ padding: 8, borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Jurisdiction profile</span>
            <input
              type="text"
              value={form.jurisdictionProfile}
              onChange={(e) => setForm((f) => ({ ...f, jurisdictionProfile: e.target.value }))}
              placeholder="GLOBAL"
              style={{ padding: 8, borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TenantStatus }))}
              style={{ padding: 8, borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0' }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          {error && <p style={{ color: '#f87171', margin: 0 }}>{error}</p>}
          {success && <p style={{ color: '#34d399', margin: 0 }}>{success}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px 16px', cursor: loading ? 'not-allowed' : 'pointer', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 6, fontWeight: 600 }}
          >
            {loading ? 'Creating…' : 'Create tenant'}
          </button>
        </form>
      </section>

      <section>
        <h3 style={{ marginBottom: 12 }}>Tenants</h3>
        {tenants.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No tenants yet. Create one above.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>Code</th>
                <th style={thTdStyle}>Display name</th>
                <th style={thTdStyle}>Status</th>
                <th style={thTdStyle}>Timezone</th>
                <th style={thTdStyle}>Jurisdiction</th>
                <th style={thTdStyle}>Created</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td style={thTdStyle}>{t.code}</td>
                  <td style={thTdStyle}>{t.displayName}</td>
                  <td style={thTdStyle}>{t.status}</td>
                  <td style={thTdStyle}>{t.timezone}</td>
                  <td style={thTdStyle}>{t.jurisdictionProfile}</td>
                  <td style={thTdStyle}>{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
