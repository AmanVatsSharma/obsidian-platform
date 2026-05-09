/**
 * File:        apps/ib-portal/src/app/(portal)/sub-ibs/page.tsx
 * Module:      ib-portal · Sub-IBs
 * Purpose:     Sub-IB network — tier tree + table view, override rates, recruit CTA
 *
 * Exports:
 *   - SubIBsPage() — client component (tree/table toggle)
 *
 * Depends on:
 *   - ../../../lib/mock-data-context — useIBData
 *   - lucide-react                   — Copy
 *
 * Key invariants:
 *   - Tree connector lines use stroke="var(--border-md)" for light-mode compatibility
 *   - SubIBTree is recursive — handles tier 2 children
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';
import { useIBData } from '../../../lib/mock-data-context';
import type { SubIB } from '../../../lib/types';

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n.toLocaleString()}`;

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={status === 'ACTIVE' ? 'status-active' : 'status-dormant'}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function TreeNode({ node, level = 0 }: { node: SubIB; level?: number }) {
  return (
    <div className={cn('relative', level > 0 && 'ml-7')}>
      {/* CSS connector lines for child nodes — theme-adaptive via CSS var */}
      {level > 0 && (
        <>
          <div className="absolute -left-4 top-6 h-px w-4 bg-[var(--border-md)]" />
          <div className="absolute -left-4 top-0 h-6 w-px bg-[var(--border-md)]" />
        </>
      )}
      <div className="mb-2.5 flex items-center gap-3.5 rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] px-4 py-3.5 hover:border-[var(--border-md)] transition-colors">
        <div className="flex h-9 w-9 min-w-[36px] items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-accent font-mono text-[11px] font-semibold text-white">
          {node.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-sans text-[13px] font-semibold text-fg1">{node.name}</div>
          <div className="font-mono text-[11px] text-fg2 mt-0.5">
            Tier {node.tier} Sub-IB · {node.clients} clients · Since {node.joined}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="font-mono text-[13px] font-semibold text-fg1">{fmt(node.volumeMTD)}</div>
            <div className="font-mono text-[10px] text-fg3 mt-0.5">VOL MTD</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[13px] font-semibold text-fg1">${node.earnings.toLocaleString()}</div>
            <div className="font-mono text-[10px] text-fg3 mt-0.5">THEIR EARN</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[13px] font-semibold text-bull">${node.myOverride.toLocaleString()}</div>
            <div className="font-mono text-[10px] text-fg3 mt-0.5">MY OVERRIDE</div>
          </div>
          <StatusBadge status={node.status} />
        </div>
      </div>
      {node.children.map(child => (
        <TreeNode key={child.id} node={child} level={level + 1} />
      ))}
    </div>
  );
}

export default function SubIBsPage() {
  const { ib, subIBs } = useIBData();
  const [view, setView] = useState<'tree' | 'table'>('tree');

  const flat = [...subIBs, ...subIBs.flatMap(s => s.children)];
  const totalClients = flat.reduce((a, s) => a + s.clients, 0);
  const totalVolume = flat.reduce((a, s) => a + s.volumeMTD, 0);
  const totalOverride = flat.reduce((a, s) => a + s.myOverride, 0);

  const recruitLink = `arcafx.com/ib/invite?ref=${ib.code}`;

  return (
    <div className="mx-auto max-w-[1400px] p-6 space-y-5">
      <div>
        <h1 className="font-display text-[22px] font-bold text-fg1">Sub-IB Network</h1>
        <p className="mt-0.5 font-sans text-[13px] text-fg2">Your referral downline — earn overrides on every trade they generate</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          ['Sub-IBs',          `${flat.length} total`,                  false],
          ['Active Clients',   String(totalClients),                   false],
          ['Combined Volume',  fmt(totalVolume),                       false],
          ['My Override MTD',  `$${totalOverride.toLocaleString()}`,   true ],
        ].map(([label, value, isBull]) => (
          <div key={label as string} className="card p-4">
            <div className={cn('font-mono text-[20px] font-bold', isBull ? 'text-bull' : 'text-fg1')}>{value}</div>
            <div className="mt-1 font-sans text-[12px] text-fg2">{label}</div>
          </div>
        ))}
      </div>

      {/* Override rates */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">MY OVERRIDE RATES</div>
        </div>
        <div className="px-4">
          {[
            { tier: 'Tier 1 Sub-IBs (direct recruits)', desc: 'You earn this % of everything they earn',    pct: '20%' },
            { tier: 'Tier 2 Sub-IBs (their recruits)',   desc: 'Passive earnings from your sub-IBs\' network', pct: '10%' },
          ].map((row, i) => (
            <div key={i} className={cn('flex items-center justify-between py-4', i === 0 && 'border-b border-[var(--border)]')}>
              <div>
                <div className="font-sans text-[13px] text-fg2">{row.tier}</div>
                <div className="mt-0.5 font-sans text-[11px] text-fg3">{row.desc}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[18px] font-bold text-bull">{row.pct}</div>
                <div className="font-mono text-[11px] text-fg3">of their commission</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recruit CTA */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">RECRUIT A SUB-IB</div>
        </div>
        <div className="flex items-center gap-3 flex-wrap px-4 py-3">
          <div className="flex-1 min-w-0 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-2.5 font-mono text-[12px] text-accent truncate">
            {recruitLink}
          </div>
          <button className="btn btn-ghost btn-sm shrink-0"><Copy size={12} strokeWidth={2} />Copy</button>
          <button className="btn btn-ghost btn-sm shrink-0">Email Template</button>
          <button className="btn btn-primary btn-sm shrink-0">+ Generate New Link</button>
        </div>
      </div>

      {/* Tree / Table toggle */}
      <div className="flex items-center justify-between">
        <div className="font-display text-[10px] tracking-[0.15em] text-fg2 uppercase">NETWORK OVERVIEW</div>
        <div className="chart-tabs">
          <button className={cn('chart-tab', view === 'tree' && 'active')} onClick={() => setView('tree')}>Tree</button>
          <button className={cn('chart-tab', view === 'table' && 'active')} onClick={() => setView('table')}>Table</button>
        </div>
      </div>

      {/* Tree view */}
      {view === 'tree' && (
        <div className="card p-4">
          {/* Root node — the IB themselves */}
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-bull to-accent font-mono text-[11px] font-semibold text-white">
              {ib.avatar}
            </div>
            <div>
              <div className="font-sans text-[13px] font-semibold text-fg1">
                {ib.name} <span className="font-mono text-[11px] text-fg3 font-normal">(You)</span>
              </div>
              <div className="font-sans text-[11px] text-fg2 mt-0.5">{ib.tier} Tier IB · {ib.broker}</div>
            </div>
          </div>
          <div className="pl-4">
            {subIBs.map(node => <TreeNode key={node.id} node={node} level={0} />)}
          </div>
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Tier</th><th>Clients</th><th>Vol MTD</th>
                <th>Their Earnings</th><th>My Override</th><th>Joined</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {flat.map((s, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#6366F1] to-accent font-mono text-[10px] text-white">
                        {s.initials}
                      </div>
                      <span className="font-sans text-[12px] font-medium text-fg1">{s.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="rounded-full border border-bull/20 bg-bull/10 px-2.5 py-0.5 font-mono text-[11px] text-bull">
                      Tier {s.tier}
                    </span>
                  </td>
                  <td className="mono-cell">{s.clients}</td>
                  <td className="mono-cell">{fmt(s.volumeMTD)}</td>
                  <td className="mono-cell">${s.earnings.toLocaleString()}</td>
                  <td className="mono-cell text-bull">${s.myOverride.toLocaleString()}</td>
                  <td className="font-mono text-[11px] text-fg3">{s.joined}</td>
                  <td><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
