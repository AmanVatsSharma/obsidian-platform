/**
 * File:        apps/web/app/console/referrals/page.tsx
 * Module:      web · Console · Routes
 * Purpose:     /console/referrals — Referral hero, KPIs, IB sub-section, table.
 *
 * Exports:
 *   - default ConsoleReferralsPage
 *
 * Depends on:
 *   - @/features/console — ReferralsSection
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import { ReferralsSection } from '@/features/console';

export default function ConsoleReferralsPage() {
  return <ReferralsSection />;
}
