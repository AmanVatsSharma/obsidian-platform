/**
 * File:        apps/web/app/(mobile)/m/workstation/page.tsx
 * Module:      Mobile · Workstation Page
 * Purpose:     Renders the full-screen mobile trading terminal — no auth gate, demo mode.
 *
 * Exports:
 *   - MobileWorkstationPage() → ReactNode   — full-screen mobile terminal (mock data when unauthenticated)
 *
 * Depends on:
 *   - @/features/mobile-terminal — MobileTradingDashboard component
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - No useAuth() or accessToken check — MobileTradingDashboard uses mock data always in demo mode
 *   - Parent (mobile)/layout.tsx deliberately omits AppShell; mobile terminal requires 100dvh
 *
 * Read order:
 *   1. This file — entry point
 *   2. features/mobile-terminal/components/mobile-trading-dashboard.tsx — full implementation
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { MobileTradingDashboard } from '@/features/mobile-terminal';

export default function MobileWorkstationPage() {
  return <MobileTradingDashboard />;
}
