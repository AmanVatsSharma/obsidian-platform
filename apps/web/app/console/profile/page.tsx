/**
 * File:        apps/web/app/console/profile/page.tsx
 * Module:      web · Console · Routes
 * Purpose:     /console/profile — Personal info, address, locale.
 *
 * Exports:
 *   - default ConsoleProfilePage
 *
 * Depends on:
 *   - @/features/console — ProfileSection
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import { ProfileSection } from '@/features/console';

export default function ConsoleProfilePage() {
  return <ProfileSection />;
}
