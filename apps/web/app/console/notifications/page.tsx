/**
 * File:        apps/web/app/console/notifications/page.tsx
 * Module:      web · Console · Routes
 * Purpose:     /console/notifications — Channels, event matrix, price alerts.
 *
 * Exports:
 *   - default ConsoleNotificationsPage
 *
 * Depends on:
 *   - @/features/console — NotificationsSection
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import { NotificationsSection } from '@/features/console';

export default function ConsoleNotificationsPage() {
  return <NotificationsSection />;
}
