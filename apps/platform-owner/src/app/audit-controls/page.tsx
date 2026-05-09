/**
 * File:        apps/platform-owner/src/app/audit-controls/page.tsx
 * Module:      platform-owner · Audit Controls Page
 * Purpose:     Read-only impersonation audit log with Obsidian styling
 *
 * Exports:
 *   - AuditControlsPage() — client component; reads from MockDataContext
 *
 * Depends on:
 *   - ../../lib/mock-data-context — useMockData
 *   - @obsidian/obsidian-ui      — cn
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { cn } from '@obsidian/obsidian-ui';
import { useMockData } from '../../lib/mock-data-context';

export default function AuditControlsPage() {
  const { tenants, impersonationAudits } = useMockData();
  const tenantName = (id: string) => tenants.find((t) => t.id === id)?.displayName ?? id;

  const actionColor: Record<string, string> = {
    STARTED: 'border-warn/25 bg-warn/10 text-warn',
    ENDED:   'border-bull/25 bg-bull/10 text-bull',
  };

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
            {impersonationAudits.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-ui text-[12px] text-fg3">No audit records.</td>
              </tr>
            ) : (
              impersonationAudits.map((a) => (
                <tr key={a.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-4 py-3 font-ui text-[13px] text-fg1">{tenantName(a.tenantId)}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-fg2">{a.actorUserId}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-fg2">{a.targetUserId}</td>
                  <td className="px-4 py-3 font-ui text-[12px] text-fg2">{a.reason}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase', actionColor[a.action] ?? 'border-[var(--border)] text-fg3')}>
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
