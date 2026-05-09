/**
 * File:        apps/platform-owner/src/features/brokers/broker-detail.tsx
 * Module:      platform-owner · Brokers Feature
 * Purpose:     Tabbed broker detail view with 5 tabs: overview, config, billing, support, audit
 *
 * Exports:
 *   - BrokerDetail(props) — client component with tab state
 *
 * Depends on:
 *   - ./broker-status-badge  — BrokerStatusBadge, PlanBadge
 *   - @obsidian/obsidian-ui — cn()
 *   - lucide-react           — icons
 *
 * Key invariants:
 *   - 'use client' required for tab state
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useState } from 'react';
import { cn } from '@obsidian/obsidian-ui';
import { Building2, Settings2, Receipt, HeadphonesIcon, ClipboardList } from 'lucide-react';
import { BrokerStatusBadge, PlanBadge } from './broker-status-badge';
import type { Broker } from '../../lib/types';

type Tab = 'overview' | 'configuration' | 'billing' | 'support' | 'audit';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',       label: 'Overview',       icon: <Building2 size={13} strokeWidth={2} /> },
  { id: 'configuration',  label: 'Configuration',  icon: <Settings2 size={13} strokeWidth={2} /> },
  { id: 'billing',        label: 'Billing',        icon: <Receipt size={13} strokeWidth={2} /> },
  { id: 'support',        label: 'Support',        icon: <HeadphonesIcon size={13} strokeWidth={2} /> },
  { id: 'audit',          label: 'Audit Log',      icon: <ClipboardList size={13} strokeWidth={2} /> },
];

function fmtAum(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-3 last:border-0">
      <span className="font-ui text-[12px] text-fg3">{label}</span>
      <span className="font-mono text-[12px] tabular-nums text-fg1">{value}</span>
    </div>
  );
}

function OverviewTab({ broker }: { broker: Broker }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] px-4">
        <div className="border-b border-[var(--border)] py-3">
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">General</span>
        </div>
        <Row label="Name" value={broker.name} />
        <Row label="Country" value={`${broker.flag} ${broker.country}`} />
        <Row label="City" value={broker.city} />
        <Row label="Account Manager" value={broker.am} />
        <Row label="Contact Email" value={broker.contact} />
        <Row label="Member Since" value={broker.since} />
      </div>
      <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] px-4">
        <div className="border-b border-[var(--border)] py-3">
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">Trading Metrics</span>
        </div>
        <Row label="Active Clients" value={broker.clients.toLocaleString()} />
        <Row label="Assets Under Management" value={fmtAum(broker.aum)} />
        <Row label="Volume MTD" value={fmtAum(broker.volumeMTD)} />
        <Row label="Revenue / Mo" value={`$${broker.rev.toLocaleString()}`} />
        <Row label="Monthly Growth" value={`${broker.growth >= 0 ? '+' : ''}${broker.growth.toFixed(1)}%`} />
        <Row label="All-Time Revenue" value={`$${broker.allTimeRev.toLocaleString()}`} />
      </div>
      <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] px-4">
        <div className="border-b border-[var(--border)] py-3">
          <span className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">API & Connectivity</span>
        </div>
        <Row label="Trades (MTD)" value={broker.trades.toLocaleString()} />
        <Row label="API Calls (MTD)" value={broker.api.toLocaleString()} />
        <Row label="WS Connections" value={broker.wsConn.toLocaleString()} />
        <Row label="Health Score" value={`${broker.healthScore} / 100`} />
      </div>
    </div>
  );
}

function ConfigTab({ broker }: { broker: Broker }) {
  return (
    <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] px-4">
      <div className="border-b border-[var(--border)] py-3">
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">Plan & Subscription</span>
      </div>
      <Row label="Plan Tier" value={broker.plan} />
      <Row label="Monthly Subscription Fee" value={`$${broker.subFee.toLocaleString()}`} />
      <Row label="Status" value={broker.status} />
      <div className="border-b border-[var(--border)] py-3 mt-4">
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">Feature Flags</span>
      </div>
      {[
        { label: 'Advanced Charts', enabled: broker.plan !== 'STARTER' },
        { label: 'Algo Trading', enabled: broker.plan !== 'STARTER' },
        { label: 'White Label', enabled: broker.plan === 'ENTERPRISE' },
        { label: 'Copy Trading', enabled: broker.plan === 'ENTERPRISE' || broker.plan === 'PRO' },
        { label: 'Prop Desk', enabled: broker.plan === 'ENTERPRISE' },
      ].map(({ label, enabled }) => (
        <div key={label} className="flex items-center justify-between border-b border-[var(--border)] py-3 last:border-0">
          <span className="font-ui text-[12px] text-fg2">{label}</span>
          <span className={cn('font-mono text-[11px]', enabled ? 'text-bull' : 'text-fg3')}>
            {enabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </div>
      ))}
    </div>
  );
}

function BillingTab({ broker }: { broker: Broker }) {
  return (
    <div className="overflow-x-auto rounded-r-lg border border-[var(--border)]">
      <table className="w-full text-left">
        <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <tr>
            {['Invoice', 'Amount', 'Status', 'Date'].map((h) => (
              <th key={h} className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-panel)]">
          {[
            { inv: `INV-2026-${String(broker.id).padStart(3, '0')}A`, amount: broker.subFee, status: 'PAID',   date: 'Apr 1, 2026' },
            { inv: `INV-2026-${String(broker.id).padStart(3, '0')}B`, amount: broker.subFee, status: 'PAID',   date: 'Mar 1, 2026' },
            { inv: `INV-2026-${String(broker.id).padStart(3, '0')}C`, amount: broker.subFee, status: 'PAID',   date: 'Feb 1, 2026' },
          ].map((row) => (
            <tr key={row.inv} className="hover:bg-[var(--bg-hover)] transition-colors">
              <td className="px-4 py-3 font-mono text-[12px] text-accent">{row.inv}</td>
              <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-fg1">${row.amount.toLocaleString()}</td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-bull/25 bg-bull/10 px-2 py-0.5 font-mono text-[10px] text-bull uppercase">{row.status}</span>
              </td>
              <td className="px-4 py-3 font-mono text-[12px] text-fg2">{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SupportTab({ broker }: { broker: Broker }) {
  return (
    <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] px-4">
      <div className="border-b border-[var(--border)] py-3">
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">Support Contacts</span>
      </div>
      <Row label="Primary Contact" value={broker.contact} />
      <Row label="Account Manager" value={broker.am} />
      <Row label="Support Tier" value={broker.plan === 'ENTERPRISE' ? 'Priority 24/7' : broker.plan === 'PRO' ? 'Business Hours' : 'Standard'} />
      <div className="py-6 text-center">
        <p className="font-ui text-[12px] text-fg3">No open support tickets for this tenant.</p>
      </div>
    </div>
  );
}

function AuditTab({ broker }: { broker: Broker }) {
  const events = [
    { time: '2026-04-20 14:22', user: 'Sarah K.', action: `Enabled Copy Trading module for ${broker.name}`, type: 'CONFIG' },
    { time: '2026-04-15 09:44', user: 'platform-owner', action: `Plan upgraded to ${broker.plan}`, type: 'BILLING' },
    { time: '2026-04-10 11:30', user: 'support-agent-1', action: 'KYC document review session', type: 'SUPPORT' },
    { time: '2026-03-28 16:15', user: 'Mike R.', action: `Feature flag whiteLabel set to ${broker.plan === 'ENTERPRISE' ? 'true' : 'false'}`, type: 'CONFIG' },
  ];

  const typeColors: Record<string, string> = {
    CONFIG:  'text-accent border-accent/25 bg-accent/10',
    BILLING: 'text-bull   border-bull/25   bg-bull/10',
    SUPPORT: 'text-warn   border-warn/25   bg-warn/10',
  };

  return (
    <div className="overflow-x-auto rounded-r-lg border border-[var(--border)]">
      <table className="w-full text-left">
        <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <tr>
            {['Timestamp', 'Actor', 'Action', 'Type'].map((h) => (
              <th key={h} className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-panel)]">
          {events.map((ev, i) => (
            <tr key={i} className="hover:bg-[var(--bg-hover)] transition-colors">
              <td className="px-4 py-3 font-mono text-[11px] text-fg3">{ev.time}</td>
              <td className="px-4 py-3 font-mono text-[12px] text-fg2">{ev.user}</td>
              <td className="px-4 py-3 font-ui text-[12px] text-fg1">{ev.action}</td>
              <td className="px-4 py-3">
                <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase', typeColors[ev.type])}>
                  {ev.type}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BrokerDetail({ broker }: { broker: Broker }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div>
      {/* Broker header */}
      <div className="mb-6 flex items-start justify-between rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-r-lg border border-[var(--border)] bg-[var(--bg-elevated)] font-mono text-[20px]">
            {broker.flag}
          </div>
          <div>
            <h2 className="font-display text-[16px] font-bold text-fg1">{broker.name}</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-[11px] text-fg3">{broker.city}, {broker.country}</span>
              <span className="h-3 w-px bg-[var(--border-md)]" />
              <span className="font-mono text-[11px] text-fg3">Since {broker.since}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PlanBadge plan={broker.plan} />
          <BrokerStatusBadge status={broker.status} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-0 border-b border-[var(--border)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-4 py-2.5 font-ui text-[12px] transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-fg3 hover:text-fg2',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview'      && <OverviewTab broker={broker} />}
      {activeTab === 'configuration' && <ConfigTab broker={broker} />}
      {activeTab === 'billing'       && <BillingTab broker={broker} />}
      {activeTab === 'support'       && <SupportTab broker={broker} />}
      {activeTab === 'audit'         && <AuditTab broker={broker} />}
    </div>
  );
}
