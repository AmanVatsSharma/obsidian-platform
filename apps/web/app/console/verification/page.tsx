/**
 * File:        apps/web/app/console/verification/page.tsx
 * Module:      web · Console · Routes
 * Purpose:     /console/verification — KYC status + steps + tier comparison.
 *
 * Exports:
 *   - default ConsoleVerificationPage
 *
 * Depends on:
 *   - @/features/console — VerificationSection
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import { VerificationSection } from '@/features/console';

export default function ConsoleVerificationPage() {
  return <VerificationSection />;
}
