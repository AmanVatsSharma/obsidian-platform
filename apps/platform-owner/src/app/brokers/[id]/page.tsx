/**
 * File:        apps/platform-owner/src/app/brokers/[id]/page.tsx
 * Module:      platform-owner · Broker Detail Page
 * Purpose:     Tabbed detail view for a specific broker tenant.
 *              Fetches real data from backend API with Obsidian skeleton loading states.
 *
 * Exports:
 *   - BrokerDetailPage() — client component; reads broker from API by tenantCode param
 *
 * Depends on:
 *   - ../../../lib/api/endpoints  — api.getBroker
 *   - ../../../lib/api/broker-mappers — apiBrokerToUi
 *   - ../../../features/brokers   — BrokerDetail
 *   - ../../../shared/components/skeleton — SkeletonBrokerDetail
 *   - next/navigation             — useParams
 *
 * Side-effects:
 *   - GET /api/saas/brokers/:tenantCode on mount
 *
 * Key invariants:
 *   - Route param [id] is the broker's tenantCode (slug), NOT the UUID.
 *     Onboarding form redirects to /brokers/{brokerCode} after success.
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-11
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../../lib/api/endpoints';
import { apiBrokerToUi } from '../../../lib/api/broker-mappers';
import { BrokerDetail } from '../../../features/brokers';
import { SkeletonBrokerDetail } from '../../../shared/components/skeleton';
import type { Broker } from '../../../lib/types';
import { ApiError } from '../../../lib/api/client';

export default function BrokerDetailPage() {
  const params = useParams();
  const [broker, setBroker] = useState<Broker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;

    const tenantCode = String(params.id);
    setLoading(true);
    setError(null);

    api.getBroker(tenantCode)
      .then((apiBroker) => setBroker(apiBrokerToUi(apiBroker)))
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load broker');
        }
      })
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return <SkeletonBrokerDetail />;
  }

  if (error || !broker) {
    return (
      <div className="space-y-4 p-6">
        <Link
          href="/brokers"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-fg3 hover:text-fg2 transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          All Brokers
        </Link>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
          <p className="font-display text-[14px] uppercase tracking-[0.08em] text-[var(--bear)]">
            {error ?? 'Broker not found'}
          </p>
          <Link href="/brokers" className="font-mono text-[12px] text-accent hover:underline">
            ← Back to All Brokers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <Link
        href="/brokers"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-fg3 hover:text-fg2 transition-colors"
      >
        <ArrowLeft size={13} strokeWidth={2} />
        All Brokers
      </Link>
      <BrokerDetail broker={broker} />
    </div>
  );
}