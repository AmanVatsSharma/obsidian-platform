/**
 * File:        apps/platform-owner/src/app/brokers/new/page.tsx
 * Module:      platform-owner · Onboard New Broker Page
 * Purpose:     Page wrapper for the OnboardBrokerForm feature component.
 *
 * Exports:
 *   - OnboardBrokerPage()  — server component shell; client form is a child component
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { OnboardBrokerForm } from '../../../features/brokers/onboard-broker-form';

export default function OnboardBrokerPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="border-b border-[var(--border)] pb-4">
        <Link
          href="/brokers"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-fg3 hover:text-fg2 transition-colors mb-3"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          All Brokers
        </Link>
        <h1 className="font-display text-[18px] font-bold uppercase tracking-[0.06em] text-fg1">
          Onboard New Broker
        </h1>
        <p className="mt-0.5 font-ui text-[12px] text-fg3">
          Provisions a new broker tenant, seeds RBAC, and sends a welcome SMS to the admin.
        </p>
      </div>
      <OnboardBrokerForm />
    </div>
  );
}
