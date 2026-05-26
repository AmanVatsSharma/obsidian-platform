/**
 * File:        apps/web/app/console/funding/page.tsx
 * Module:      web · Console · Routes
 * Purpose:     /console/funding — Deposit / Withdraw / Transfer + history.
 *
 * Exports:
 *   - default ConsoleFundingPage
 *
 * Depends on:
 *   - @/features/console — FundingSection
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import { FundingSection } from '@/features/console';

export default function ConsoleFundingPage() {
  return <FundingSection />;
}
