/**
 * File:        apps/platform-owner/src/app/brokers/[id]/page.tsx
 * Module:      platform-owner · Broker Detail Page
 * Purpose:     Tabbed detail view for a specific broker tenant
 *
 * Exports:
 *   - BrokerDetailPage() — client component; reads broker from MockDataContext by id param
 *
 * Depends on:
 *   - ../../../features/brokers — BrokerDetail
 *   - next/navigation            — useParams
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useMockData } from '../../../lib/mock-data-context';
import { BrokerDetail } from '../../../features/brokers';

export default function BrokerDetailPage() {
  const params = useParams();
  const { brokers } = useMockData();
  const broker = brokers.find((b) => String(b.id) === String(params?.id));

  if (!broker) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
        <p className="font-display text-[14px] uppercase tracking-[0.08em] text-fg3">Broker not found</p>
        <Link href="/brokers" className="font-mono text-[12px] text-accent hover:underline">
          ← Back to All Brokers
        </Link>
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
