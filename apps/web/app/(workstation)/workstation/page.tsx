/**
 * File:        apps/web/app/(workstation)/workstation/page.tsx
 * Module:      Workstation · Desktop Page
 * Purpose:     Renders the full-screen desktop trading workstation — no auth gate, demo mode.
 *
 * Exports:
 *   - WorkstationPage() → ReactNode   — full-screen trading terminal (mock data when unauthenticated)
 *
 * Depends on:
 *   - @/features/trading-terminal — TradingWorkstation component (handles no-token gracefully)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - No useAuth() or accessToken check — TradingWorkstation falls back to mock data automatically
 *   - Parent (workstation)/layout.tsx deliberately omits AppShell; workstation requires 100vh
 *
 * Read order:
 *   1. This file — entry point
 *   2. features/trading-terminal/components/trading-workstation.tsx — full implementation
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { TradingWorkstation } from '@/features/trading-terminal';

export default function WorkstationPage() {
  return <TradingWorkstation mobileHref="/m/workstation" />;
}
