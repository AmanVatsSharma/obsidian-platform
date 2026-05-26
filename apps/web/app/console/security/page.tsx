/**
 * File:        apps/web/app/console/security/page.tsx
 * Module:      web · Console · Routes
 * Purpose:     /console/security — Sign-in, devices, login history, danger zone.
 *
 * Exports:
 *   - default ConsoleSecurityPage
 *
 * Depends on:
 *   - @/features/console — SecuritySection
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import { SecuritySection } from '@/features/console';

export default function ConsoleSecurityPage() {
  return <SecuritySection />;
}
