/**
 * File:        apps/web/app/(mobile)/m/workstation/page.tsx
 * Module:      Mobile · Workstation Page
 * Purpose:     Renders the full-screen mobile trading terminal — wired to backend via MobileWorkstation adapter.
 *              NO MOCK DATA - always connects to backend for data.
 *
 * Exports:
 *   - MobileWorkstationPage() → ReactNode   — full-screen mobile terminal (live data from backend)
 *
 * Depends on:
 *   - @/features/mobile-terminal — MobileWorkstation adapter component
 *
 * Side-effects:
 *   - GraphQL queries via Apollo Client hooks
 *
 * Key invariants:
 *   - MobileWorkstation always fetches from backend
 *   - Shows loading/empty/error states when no data
 *   - Parent (mobile)/layout.tsx deliberately omits AppShell; mobile terminal requires 100dvh
 *
 * Read order:
 *   1. This file — entry point
 *   2. features/mobile-terminal/components/mobile-workstation.tsx — adapter, wires Apollo hooks
 *   3. features/mobile-terminal/components/mobile-trading-dashboard.tsx — presentational UI
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

'use client';

import { MobileWorkstation } from '@/features/mobile-terminal';

export default function MobileWorkstationPage() {
  // NO demo mode - always fetch from backend
  return <MobileWorkstation desktopHref="/workstation?desktop=1" />;
}
