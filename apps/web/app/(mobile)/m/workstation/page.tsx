/**
 * File:        apps/web/app/(mobile)/m/workstation/page.tsx
 * Module:      Mobile · Workstation Page
 * Purpose:     Renders the full-screen mobile trading terminal — wired to backend via MobileWorkstation adapter.
 *
 * Exports:
 *   - MobileWorkstationPage() → ReactNode   — full-screen mobile terminal (live data when authenticated)
 *
 * Depends on:
 *   - @/features/mobile-terminal — MobileWorkstation adapter component
 *
 * Side-effects:
 *   - GraphQL queries via Apollo Client hooks
 *
 * Key invariants:
 *   - MobileWorkstation handles auth fallback to mock data
 *   - Parent (mobile)/layout.tsx deliberately omits AppShell; mobile terminal requires 100dvh
 *   - Supports ?demo=1 query param for demo mode without backend
 *
 * Read order:
 *   1. This file — entry point
 *   2. features/mobile-terminal/components/mobile-workstation.tsx — adapter, wires Apollo hooks
 *   3. features/mobile-terminal/components/mobile-trading-dashboard.tsx — presentational UI
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-07
 */

'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { MobileWorkstation } from '@/features/mobile-terminal';

export default function MobileWorkstationPage() {
  const searchParams = useSearchParams();
  const demoMode = useMemo(() => searchParams.get('demo') === '1', [searchParams]);

  return <MobileWorkstation demoMode={demoMode} desktopHref="/workstation?desktop=1" />;
}
