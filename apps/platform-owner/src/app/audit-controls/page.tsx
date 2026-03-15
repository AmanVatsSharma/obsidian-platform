/**
 * @file page.tsx
 * @module platform-owner
 * @description Audit controls: read-only list of support impersonation audits with mock data
 * @author BharatERP
 * @created 2026-03-15
 */

'use client';

import { useMemo, useState } from 'react';
import { useMockData } from '../../lib/mock-data-context';

export default function AuditControlsPage() {
  const { tenants, impersonationAudits } = useMockData();
  const [tenantFilter, setTenantFilter] = useState<string>('');

  const filtered = useMemo(() => {
    if (!tenantFilter) return impersonationAudits;
    return impersonationAudits.filter((a) => a.tenantId === tenantFilter);
  }, [impersonationAudits, tenantFilter]);

  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: 16 };
  const thTdStyle: React.CSSProperties = { border: '1px solid #334155', padding: '12px 16px', textAlign: 'left' };

  const tenantName = (id: string) => tenants.find((t) => t.id === id)?.displayName ?? id;

  return (
    <main style={{ display: 'grid', gap: 24 }}>
      <h2>Audit and Support Controls</h2>
      <p>Support impersonation and elevated access logs. Data is mock until backend is connected.</p>

      <section>
        <h3 style={{ marginBottom: 12 }}>Impersonation audit log</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span>Filter by tenant</span>
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0' }}
          >
            <option value="">All tenants</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.displayName}</option>
            ))}
          </select>
        </label>
        {filtered.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No audit records found.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thTdStyle}>Tenant</th>
                <th style={thTdStyle}>Actor (support)</th>
                <th style={thTdStyle}>Target user</th>
                <th style={thTdStyle}>Reason</th>
                <th style={thTdStyle}>Action</th>
                <th style={thTdStyle}>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td style={thTdStyle}>{tenantName(a.tenantId)}</td>
                  <td style={thTdStyle}>{a.actorUserId}</td>
                  <td style={thTdStyle}>{a.targetUserId}</td>
                  <td style={thTdStyle}>{a.reason}</td>
                  <td style={thTdStyle}>{a.action}</td>
                  <td style={thTdStyle}>{new Date(a.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
