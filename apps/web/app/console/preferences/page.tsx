/**
 * File:        apps/web/app/console/preferences/page.tsx
 * Module:      web · Console · Routes
 * Purpose:     /console/preferences — Order entry, charts, hotkeys, risk controls.
 *
 * Exports:
 *   - default ConsolePreferencesPage
 *
 * Depends on:
 *   - @/features/console — PreferencesSection
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import { PreferencesSection } from '@/features/console';

export default function ConsolePreferencesPage() {
  return <PreferencesSection />;
}
