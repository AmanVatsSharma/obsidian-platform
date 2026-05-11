'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';
import { api } from '../../lib/api/endpoints';

interface OnboardingQueueItem {
  tenantId: string;
  tenantCode: string;
  displayName: string;
  provisioningStatus: string;
  requestedBy: string;
  createdAt: string;
  daysPending: number;
}

export default function OnboardingPage() {
  const [queue, setQueue] = useState<Array<{
    tenantId: string;
    tenantCode: string;
    displayName: string;
    provisioningStatus: string;
    requestedBy: string;
    createdAt: string;
    daysPending: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listPendingOnboarding()
      .then((data) => { if (!cancelled) setQueue(data); })
      .catch(() => { if (!cancelled) setError('Failed to load onboarding queue'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function advanceItem(tenantId: string) {
    setAdvancing(tenantId);
    try {
      await api.advanceProvisioning(tenantId);
      setQueue((q) => q.filter((i) => i.tenantId !== tenantId));
    } catch {
      setError('Failed to advance provisioning step');
    } finally {
      setAdvancing(null);
    }
  }

  const warnItems = queue.filter((i) => i.daysPending > 7);
  const normalItems = queue.filter((i) => i.daysPending <= 7);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="border-b border-[var(--border)] pb-4">
          <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">
            Onboarding Queue
          </h1>
          <p className="mt-0.5 font-ui text-[12px] text-fg3">Loading...</p>
        </div>
        <div className="rounded-r-lg border border-[var(--border)] overflow-hidden">
          <div className="flex gap-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
            {[20, 35, 15, 12, 12, 15].map((w, i) => (
              <div key={i} className="h-3 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-[var(--border)]">
              {[25, 30, 12, 10, 10, 12].map((w, j) => (
                <div key={j} className="h-3 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" style={{ width: `${w}%` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && queue.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="border-b border-[var(--border)] pb-4">
          <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">
            Onboarding Queue
          </h1>
        </div>
        <div className="rounded-r-lg border border-[var(--bear)] bg-[var(--bear-dim)] p-6 text-center">
          <p className="font-mono text-[12px] text-[var(--bear)]">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-2 font-mono text-[11px] text-accent hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="border-b border-[var(--border)] pb-4">
          <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">
            Onboarding Queue
          </h1>
          <p className="mt-0.5 font-ui text-[12px] text-fg3">No pending onboardings</p>
        </div>
        <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-12 text-center">
          <CheckCircle size={24} className="mx-auto mb-3 text-bull" />
          <p className="font-ui text-[13px] text-fg3">No pending onboardings</p>
          <p className="mt-1 font-mono text-[11px] text-fg3">All brokers are active</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">
          Onboarding Queue
        </h1>
        <p className="mt-0.5 font-ui text-[12px] text-fg3">
          {queue.length} pending &middot; {warnItems.length} overdue
        </p>
      </div>

      {warnItems.length > 0 && (
        <div className="rounded-r-lg border border-[var(--bear)] bg-[var(--bear-dim)] p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--bear)]" />
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.08em] text-[var(--bear)]">Overdue onboardings</p>
            <p className="mt-0.5 font-ui text-[11px] text-fg2">
              {warnItems.length} pending over 7 days
            </p>
          </div>
        </div>
      )}

      <div className="rounded-r-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
            <tr>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">Broker</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">Status</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">Days</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">Requested By</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-panel)]">
            {[...warnItems, ...normalItems].map((item) => (
              <tr key={item.tenantId} className="hover:bg-[var(--bg-hover)] transition-colors">
                <td className="px-4 py-3">
                  <div className="font-ui text-[13px] font-medium text-fg1">{item.displayName}</div>
                  <div className="font-mono text-[10px] text-fg3">{item.tenantCode}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase',
                    item.provisioningStatus === 'IN_PROGRESS'
                      ? 'border-warn/25 bg-warn/10 text-warn'
                      : 'border-accent/25 bg-accent/10 text-accent',
                  )}>
                    {item.provisioningStatus.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 font-mono text-[12px]">
                    <Clock size={12} className={item.daysPending > 7 ? 'text-[var(--bear)]' : 'text-fg3'} />
                    <span className={item.daysPending > 7 ? 'text-[var(--bear)]' : 'text-fg2'}>
                      {item.daysPending}d
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-fg3">{item.requestedBy}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-fg3">
                  {new Date(item.createdAt).toLocaleDateString('en-GB')}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => advanceItem(item.tenantId)}
                    disabled={advancing === item.tenantId}
                    className={cn(
                      'rounded-r-md border px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.06em] transition-colors',
                      advancing === item.tenantId
                        ? 'opacity-50 cursor-not-allowed border-[var(--border)] text-fg3'
                        : 'border-bull bg-bull/10 text-bull hover:bg-bull hover:text-fg1',
                    )}
                  >
                    {advancing === item.tenantId ? 'Advancing...' : 'Advance'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}