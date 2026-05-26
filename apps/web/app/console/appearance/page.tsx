/**
 * File:        apps/web/app/console/appearance/page.tsx
 * Module:      web · Console · Routes
 * Purpose:     /console/appearance — Theme, accent, density, chart options.
 *
 * Exports:
 *   - default ConsoleAppearancePage
 *
 * Depends on:
 *   - @/features/console — AppearanceSection
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import { AppearanceSection } from '@/features/console';

export default function ConsoleAppearancePage() {
  return <AppearanceSection />;
}
