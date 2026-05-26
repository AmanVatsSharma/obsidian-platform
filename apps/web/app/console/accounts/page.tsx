/**
 * File:        apps/web/app/console/accounts/page.tsx
 * Module:      web · Console · Routes
 * Purpose:     /console/accounts — Trading accounts grid + new-account modal.
 *
 * Exports:
 *   - default ConsoleAccountsPage
 *
 * Depends on:
 *   - @/features/console — AccountsSection
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import { AccountsSection } from '@/features/console';

export default function ConsoleAccountsPage() {
  return <AccountsSection />;
}
