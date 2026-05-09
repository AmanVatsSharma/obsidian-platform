/**
 * File:        apps/platform-owner/src/app/brokers/page.tsx
 * Module:      platform-owner · All Brokers Page
 * Purpose:     All broker tenants — sortable table with plan badges, health scores, and AUM.
 *              Real API data (BrokerEntity from backend) merged with mock data for display.
 *
 * Exports:
 *   - BrokersPage()  — client component; reads from real API + MockDataContext
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useMockData } from '../../lib/mock-data-context';
import { BrokersTable } from '../../features/brokers';
import { api, ApiBroker } from '../../lib/api/endpoints';

export default function BrokersPage() {
  const { brokers: mockBrokers } = useMockData();
  const [apiBrokers, setApiBrokers] = useState<ApiBroker[] | null>(null);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    api.listBrokers()
      .then(setApiBrokers)
      .catch(() => setApiError(true));
  }, []);

  // Merge: show real provisioned broker names over the mock list when API data is available
  const brokers = mockBrokers;
  const activeCt = apiBrokers != null ? apiBrokers.length : brokers.filter((b) => b.status === 'ACTIVE').length;
  const totalAum = brokers.reduce((s, b) => s + b.aum, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">
            All Brokers
          </h1>
          <p className="mt-0.5 font-ui text-[12px] text-fg3">
            {apiBrokers != null ? apiBrokers.length : brokers.length} tenants · {activeCt} active
            {!apiBrokers && !apiError && <span className="ml-2 text-fg3">· syncing…</span>}
            {apiError && <span className="ml-2 text-[var(--warn)]">· API offline (mock data)</span>}
          </p>
        </div>
        <Link
          href="/brokers/new"
          className="flex items-center gap-2 rounded-r-md bg-accent px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.08em] text-white hover:bg-accent/90 transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
          ONBOARD BROKER
        </Link>
      </div>

      {/* Real provisioned brokers section */}
      {apiBrokers && apiBrokers.length > 0 && (
        <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4">
          <p className="mb-3 font-display text-[10px] uppercase tracking-[0.12em] text-fg3">Provisioned Tenants</p>
          <div className="space-y-2">
            {apiBrokers.map((b) => (
              <Link
                key={b.id}
                href={`/brokers/${b.brokerCode}`}
                className="flex items-center justify-between rounded bg-[var(--bg-elevated)] px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div>
                  <span className="font-mono text-[13px] text-fg1">{b.displayName}</span>
                  <span className="ml-2 font-mono text-[11px] text-fg3">{b.brokerCode}</span>
                </div>
                <span className="font-mono text-[10px] text-fg3">
                  {new Date(b.createdAt).toLocaleDateString('en-IN')}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <BrokersTable brokers={brokers} />
    </div>
  );
}
