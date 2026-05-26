/**
 * File:        apps/web/app/console/statements/page.tsx
 * Module:      web · Console · Routes
 * Purpose:     /console/statements — Generate statements, recent list, tax docs.
 *
 * Exports:
 *   - default ConsoleStatementsPage
 *
 * Depends on:
 *   - @/features/console — StatementsSection
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import { StatementsSection } from '@/features/console';

export default function ConsoleStatementsPage() {
  return <StatementsSection />;
}
