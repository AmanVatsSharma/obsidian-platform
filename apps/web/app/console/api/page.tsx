/**
 * File:        apps/web/app/console/api/page.tsx
 * Module:      web · Console · Routes
 * Purpose:     /console/api — REST/WS hero, API keys, IP allowlist, webhooks.
 *
 * Exports:
 *   - default ConsoleApiPage
 *
 * Depends on:
 *   - @/features/console — ApiSection
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import { ApiSection } from '@/features/console';

export default function ConsoleApiPage() {
  return <ApiSection />;
}
