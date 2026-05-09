/**
 * File:        apps/ib-portal/src/app/(portal)/clients/page.tsx
 * Module:      ib-portal · My Clients
 * Purpose:     Client list with search, status filter pills, data table, and slide-out detail drawer
 *
 * Exports:
 *   - ClientsPage() — client component (filter, search, drawer state)
 *
 * Depends on:
 *   - ../../../lib/mock-data-context — useIBData
 *   - lucide-react                   — Search, X, Mail, Flag
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { Flag, Mail, Search, X } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';
import { useIBData } from '../../../lib/mock-data-context';
import type { Client } from '../../../lib/types';

type Filter = 'All' | 'Active' | 'Dormant' | 'Unverified';

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n.toLocaleString()}`;

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    ACTIVE:     'status-active',
    DORMANT:    'status-dormant',
    UNVERIFIED: 'status-unverified',
  };
  return (
    <span className={cls[status] ?? 'badge badge-muted'}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function ClientDrawer({ client, onClose }: { client: Client; onClose: () => void }) {
  const activityHeights = [0.2, 0.4, 0.6, 0.8, 0.5, 1.0];
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-[18px] font-bold text-fg1">{client.name}</h2>
          <button className="text-fg2 hover:text-fg1 transition-colors" onClick={onClose}>
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="mb-4"><StatusBadge status={client.status} /></div>

        {/* Client details */}
        <div className="mb-5">
          <div className="mb-3 font-mono text-[10px] tracking-[0.15em] text-fg3 uppercase">CLIENT DETAILS</div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              ['Account Type', client.type],
              ['Joined',       client.joined],
              ['Referral Link', client.link],
              ['Last Trade',   client.lastTrade],
            ].map(([label, val]) => (
              <div key={label} className="rounded-md bg-[var(--bg-elevated)] px-3 py-2.5">
                <div className="font-sans text-[11px] text-fg3 mb-1">{label}</div>
                <div className="font-sans text-[13px] font-semibold text-fg1">{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity chart */}
        <div className="mb-5">
          <div className="mb-3 font-mono text-[10px] tracking-[0.15em] text-fg3 uppercase">ACTIVITY (LAST 6 MONTHS)</div>
          <div className="flex h-20 items-end gap-1.5 rounded-md bg-[var(--bg-elevated)] p-3">
            {activityHeights.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${h * 100}%`,
                  background: client.volumeMTD > 0 ? 'var(--bull)' : 'var(--bg-hover)',
                  opacity: 0.85,
                }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[10px] text-fg3">
            {months.map(m => <span key={m}>{m}</span>)}
          </div>
        </div>

        {/* MTD performance */}
        <div className="mb-5">
          <div className="mb-3 font-mono text-[10px] tracking-[0.15em] text-fg3 uppercase">MTD PERFORMANCE</div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              ['Volume MTD',  client.volumeMTD > 0 ? fmt(client.volumeMTD) : '$0', false],
              ['Trades MTD',  String(client.tradesMTD || 0),                        false],
              ['Commission',  client.commission > 0 ? `$${client.commission.toLocaleString()}` : '$0', true],
            ].map(([label, val, isBull]) => (
              <div key={label as string} className="rounded-md bg-[var(--bg-elevated)] px-3 py-2.5">
                <div className="font-sans text-[11px] text-fg3 mb-1">{label}</div>
                <div className={cn('font-mono text-[13px] font-semibold', isBull ? 'text-bull' : 'text-fg1')}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement tools */}
        <div>
          <div className="mb-3 font-mono text-[10px] tracking-[0.15em] text-fg3 uppercase">ENGAGEMENT TOOLS</div>
          <div className="flex flex-col gap-2">
            {client.status === 'DORMANT' && (
              <button className="btn btn-bull w-full">
                <Mail size={13} strokeWidth={2} />Send Reactivation Email
              </button>
            )}
            <button className="btn btn-ghost w-full">
              <Flag size={13} strokeWidth={2} />Flag for Support
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ClientsPage() {
  const { allClients } = useIBData();
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);

  const filters: Filter[] = ['All', 'Active', 'Dormant', 'Unverified'];

  const dormantCount = allClients.filter(c => c.status === 'DORMANT').length;

  const filtered = allClients.filter(c => {
    const matchesFilter = filter === 'All' || c.status.toUpperCase() === filter.toUpperCase();
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-[1400px] p-6 space-y-5">
      <div>
        <h1 className="font-display text-[22px] font-bold text-fg1">My Clients</h1>
        <p className="mt-0.5 font-sans text-[13px] text-fg2">{allClients.length} total referred clients · privacy protected view</p>
      </div>

      {/* Dormant warning */}
      {dormantCount > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-warn/25 bg-warn/10 px-4 py-3.5">
          <div className="flex-1">
            <div className="font-sans text-[13px] font-semibold text-warn">{dormantCount} dormant clients detected</div>
            <div className="mt-0.5 font-sans text-[12px] text-fg2">Clients inactive for 30+ days. Re-engage to recover commission potential.</div>
          </div>
          <button className="btn btn-ghost btn-sm shrink-0">Send Reactivation Campaign</button>
        </div>
      )}

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            className={cn('filter-pill', filter === f && 'active')}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto relative">
          <Search size={13} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg3 pointer-events-none" />
          <input
            className="input input-sm pl-8 w-48"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client</th><th>Joined</th><th>Type</th>
              <th>Volume MTD</th><th>Trades</th><th>Commission</th>
              <th>Last Trade</th><th>Status</th><th>Ref Link</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={i} className="cursor-pointer" onClick={() => setSelected(c)}>
                <td className="font-sans text-[12px] font-medium text-fg1">{c.name}</td>
                <td className="font-mono text-[11px] text-fg3">{c.joined}</td>
                <td className="font-sans text-[11px] text-fg2">{c.type}</td>
                <td className="mono-cell">{c.volumeMTD > 0 ? fmt(c.volumeMTD) : '—'}</td>
                <td className="mono-cell">{c.tradesMTD || '—'}</td>
                <td className="mono-cell text-bull">{c.commission > 0 ? `$${c.commission.toLocaleString()}` : '—'}</td>
                <td className="font-sans text-[12px] text-fg2">{c.lastTrade}</td>
                <td><StatusBadge status={c.status} /></td>
                <td className="font-mono text-[11px] text-fg3">{c.link}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <ClientDrawer client={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
