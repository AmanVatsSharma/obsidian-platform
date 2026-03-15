/**
 * @file page.tsx
 * @module platform-owner
 * @description Entitlements list and upsert flow with mock data
 * @author BharatERP
 * @created 2026-03-15
 */

'use client';

import { useState } from 'react';
import { useMockData } from '../../lib/mock-data-context';
import type { UpsertEntitlementInput } from '../../lib/types';

const defaultEntitlements = { maxAccounts: 10, apiRateLimit: 1000 };
const defaultFeatureFlags = { advancedCharts: true, algoTrading: false };

export default function EntitlementsPage() {
  const { tenants, entitlementPlans, upsertEntitlement } = useMockData();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? '');
  const [planCode, setPlanCode] = useState('');
  const [entitlementsJson, setEntitlementsJson] = useState(JSON.stringify(defaultEntitlements, null, 2));
  const [featureFlagsJson, setFeatureFlagsJson] = useState(JSON.stringify(defaultFeatureFlags, null, 2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!tenantId || !planCode.trim()) {
      setError('Tenant and plan code are required.');
      return;
    }
    let entitlements: Record<string, unknown> = {};
    let featureFlags: Record<string, boolean> = {};
    try {
      entitlements = JSON.parse(entitlementsJson) as Record<string, unknown>;
    } catch {
      setError('Entitlements must be valid JSON.');
      return;
    }
    try {
      featureFlags = JSON.parse(featureFlagsJson) as Record<string, boolean>;
    } catch {
      setError('Feature flags must be valid JSON (keys and boolean values).');
      return;
    }
    setLoading(true);
    try {
      upsertEntitlement({ tenantId, planCode: planCode.trim(), entitlements, featureFlags });
      setSuccess(`Plan "${planCode}" saved for tenant.`);
      setPlanCode('');
      setEntitlementsJson(JSON.stringify(defaultEntitlements, null, 2));
      setFeatureFlagsJson(JSON.stringify(defaultFeatureFlags, null, 2));
    } catch {
      setError('Failed to save entitlement plan.');
    } finally {
      setLoading(false);
    }
  };

  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: 16 };
  const thTdStyle: React.CSSProperties = { border: '1px solid #334155', padding: '12px 16px', textAlign: 'left' };

  const tenantName = (id: string) => tenants.find((t) => t.id === id)?.displayName ?? id;

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <h2>Entitlements and Feature Flags</h2>
      <p>Package matrices, seat controls, and tenant-level feature toggles. Data is mock until backend is connected.</p>

      <section>
        <h3 style={{ marginBottom: 12 }}>Add or update plan</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Tenant</span>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              style={{ padding: 8, borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0' }}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.displayName} ({t.code})</option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Plan code</span>
            <input
              type="text"
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
              placeholder="e.g. professional"
              style={{ padding: 8, borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Entitlements (JSON)</span>
            <textarea
              value={entitlementsJson}
              onChange={(e) => setEntitlementsJson(e.target.value)}
              rows={4}
              style={{ padding: 8, borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0', fontFamily: 'monospace' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 4 }}>
            <span>Feature flags (JSON)</span>
            <textarea
              value={featureFlagsJson}
              onChange={(e) => setFeatureFlagsJson(e.target.value)}
              rows={3}
              style={{ padding: 8, borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0', fontFamily: 'monospace' }}
            />
          </label>
          {error && <p style={{ color: '#f87171', margin: 0 }}>{error}</p>}
          {success && <p style={{ color: '#34d399', margin: 0 }}>{success}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px 16px', cursor: loading ? 'not-allowed' : 'pointer', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 6, fontWeight: 600 }}
          >
            {loading ? 'Saving…' : 'Save plan'}
          </button>
        </form>
      </section>

      <section>
        <h3 style={{ marginBottom: 12 }}>Plans</h3>
        {entitlementPlans.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No entitlement plans yet.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>Tenant</th>
                <th style={thTdStyle}>Plan code</th>
                <th style={thTdStyle}>Entitlements</th>
                <th style={thTdStyle}>Feature flags</th>
                <th style={thTdStyle}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {entitlementPlans.map((ep) => (
                <tr key={ep.id}>
                  <td style={thTdStyle}>{tenantName(ep.tenantId)}</td>
                  <td style={thTdStyle}>{ep.planCode}</td>
                  <td style={thTdStyle}>
                    <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(ep.entitlements)}</pre>
                  </td>
                  <td style={thTdStyle}>
                    <pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(ep.featureFlags)}</pre>
                  </td>
                  <td style={thTdStyle}>{new Date(ep.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
