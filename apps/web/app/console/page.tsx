/**
 * File:        apps/web/app/console/page.tsx
 * Module:      web · Console · Routes
 * Purpose:     /console — Overview page (default landing).
 *
 * Exports:
 *   - default ConsoleOverviewPage
 *
 * Depends on:
 *   - @/features/console — OverviewSection (public re-export)
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import { OverviewSection } from '@/features/console';

export default function ConsoleOverviewPage() {
  return <OverviewSection />;
}
