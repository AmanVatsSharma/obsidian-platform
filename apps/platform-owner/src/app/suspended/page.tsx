'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertOctagon, ArrowUpRight, RefreshCw } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';
import { api } from '../../lib/api/endpoints';

interface SuspendedBroker {
  id: string;
  tenantId: string;
  brokerCode: string;
  displayName: string;
  status: string;
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  SUSPENDED: 'border-[var(--bear)] bg-[var(--bear-dim)] text-[var(--bear)]',
  PENDING:   'border-[var(--warn)]  bg-[var(--warn-dim)]  text-[var(--warn)]',
};

const getStatusStyle = (status: string) => STATUS_STYLE[status] ?? 'text-fg3 border-[var(--border)]';

export default function SuspendedPage() {
  const [brokers, setBrokers] = useState<SuspendedBroker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactivating, setReactivating] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listSuspendedBrokers()
      .then((data) => { if (!cancelled) setBrokers(data); })
      .catch(() => { if (!cancelled) setError('Failed to load suspended brokers'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function reactivate(brokerCode: string) {
    setReactivating(brokerCode);
    try {
      await api.reactivateBroker(brokerCode);
      setBrokers((prev) => prev.filter((b) => b.brokerCode !== brokerCode));
    } catch {
      setError('Failed to reactivate broker');
    } finally {
      setReactivating(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">
          Suspended Brokers
        </h1>
        <p className="mt-0.5 font-ui text-[12px] text-fg3">
          {brokers.length === 0 ? 'No suspended brokers' : `${brokers.length} suspended · reactivate when resolved`}
        </p>
      </div>

      {loading ? (
        <div className="rounded-r-lg border border-[var(--border)] overflow-hidden">
          <div className="flex gap-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
            {[25, 20, 15, 12, 15].map((w, i) => (
              <div key={i} className="h-3 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-[var(--border)] last:border-0">
              {[25, 20, 15, 12, 12].map((w, j) => (
                <div key={j} className="h-3 bg-[var(--bg-elevated)] animate-shimmer-slow rounded" style={{ width: `${w}%` }} />
              ))}
            </div>
          ))}
        </div>
      ) : error && !brokers.length ? (
        <div className="rounded-r-lg border border-[var(--bear)] bg-[var(--bear-dim)] p-6 text-center">
          <p className="font-mono text-[12px] text-[var(--bear)]">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-2 font-mono text-[11px] text-accent hover:underline">Retry</button>
        </div>
      ) : brokers.length === 0 ? (
        <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-12 text-center">
          <AlertOctagon size={24} className="mx-auto mb-3 text-fg3" />
          <p className="font-ui text-[13px] text-fg3">No suspended brokers</p>
          <p className="mt-1 font-mono text-[11px] text-fg3">All brokers are active</p>
        </div>
      ) : (
        <div className="space-y-3">
          {brokers.map((b) => (
            <div
              key={b.brokerCode}
              className="rounded-r-lg border border-[var(--bear)] bg-[var(--bg-panel)] p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-ui text-[14px] font-medium text-fg1">{b.displayName}</h3>
                    <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase', getStatusStyle(b.status))}>
                      {b.status}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-fg3">
                    {b.brokerCode} · ID: {b.tenantId}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-fg4">
                    Suspended: {new Date(b.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/brokers/${b.brokerCode}`}
                    className="flex items-center gap-1 rounded-r-md border border-[var(--border)] px-3 py-1.5 font-mono text-[10px] text-fg3 transition-colors hover:border-fg3 hover:text-fg2"
                  >
                    <ArrowUpRight size={12} strokeWidth={2} />
                    View
                  </Link>
                  <button
                    onClick={() => reactivate(b.brokerCode)}
                    disabled={reactivating === b.brokerCode}
                    className={cn(
                      'flex items-center gap-1.5 rounded-r-md border border-bull bg-bull/10 px-3 py-1.5 font-mono text-[10px] text-bull transition-colors hover:bg-bull hover:text-fg1',
                      reactivating === b.brokerCode && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    <RefreshCw size={12} strokeWidth={2} className={reactivating === b.brokerCode ? 'animate-spin' : ''} />
                    {reactivating === b.brokerCode ? 'Reactivating…' : 'Reactivate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}