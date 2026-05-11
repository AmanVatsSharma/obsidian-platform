/**
 * File:        apps/platform-owner/src/app/audit-controls/page.tsx
 * Module:      platform-owner · Audit Controls Page
 * Purpose:     Read-only impersonation audit log — fetches from real API.
 *              Obsidian skeleton loading states.
 *
 * Exports:
 *   - AuditControlsPage() — client component; reads from API
 *
 * Depends on:
 *   - ../../lib/api/endpoints   — api.listAllAudit, api.listTenants
 *   - ../../shared/components/skeleton — SkeletonTable
 *   - @obsidian/obsidian-ui     — cn
 *
 * Side-effects:
 *   - GET /api/saas/audit/impersonations, /api/saas/brokers on mount
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

interface AuditRecord {
  id: string;
  tenantId: string;
  actorUserId: string;
  targetUserId: string;
  reason: string;
  action: string;
  createdAt: string;
}

interface TenantInfo {
  id: string;
  displayName: string;
}

const ACTION_STYLE: Record<string, string> = {
  IMPERSONATE_START: 'border-warn/25 bg-warn/10 text-warn',
  IMPERSONATE_END:   'border-bull/25 bg-bull/10 text-bull',
};

export default function AuditControlsPage() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.listAllAudit().catch(() => null),
      api.listTenants().catch(() => null),
    ]).then(([auditData, tenantData]) => {
      if (auditData) setAudits(auditData as AuditRecord[]);
      if (tenantData) setTenants(tenantData as unknown as TenantInfo[]);
    }).catch(() => setError('Failed to load audit records')).finally(() => setLoading(false));
  }, []);

  const tenantName = (id: string) => tenants.find((t) => t.id === id)?.displayName ?? id;

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Header skeleton */}
        <div className="border-b border-[var(--border)] pb-4">
          <div className="h-6 w-36 bg-[var(--bg-elevated)] animate-shimmer-slow rounded mb-2" />
          <div className="h-4 w-80 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" />
        </div>

        {/* Table skeleton */}
        <SkeletonTable rows={6} cols={6} />
      </div>
    );
  }

  if (error && !audits.length) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
          <p className="font-display text-[14px] uppercase tracking-[0.08em] text-[var(--bear)]">{error}</p>
          <button onClick={() => window.location.reload()} className="font-mono text-[12px] text-accent hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">Audit Controls</h1>
        <p className="mt-0.5 font-ui text-[12px] text-fg3">Support impersonation log — read-only record of all actor sessions</p>
      </div>

      <div className="overflow-x-auto rounded-r-lg border border-[var(--border)]">
        <table className="w-full text-left">
          <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
            <tr>
              {['Tenant', 'Actor', 'Target User', 'Reason', 'Action', 'Timestamp'].map((h) => (
                <th key={h} className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-panel)]">
            {audits.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-ui text-[12px] text-fg3">No audit records.</td>
              </tr>
            ) : (
              audits.map((a) => (
                <tr key={a.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-4 py-3 font-ui text-[13px] text-fg1">{tenantName(a.tenantId)}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-fg2">{a.actorUserId}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-fg2">{a.targetUserId}</td>
                  <td className="px-4 py-3 font-ui text-[12px] text-fg2">{a.reason ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase', ACTION_STYLE[a.action] ?? 'border-[var(--border)] text-fg3')}>
                      {a.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-fg3">
                    {new Date(a.createdAt).toLocaleString('en-GB')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}