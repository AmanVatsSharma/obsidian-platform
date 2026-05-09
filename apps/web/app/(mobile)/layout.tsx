/**
 * File:        apps/web/app/(mobile)/layout.tsx
 * Module:      Mobile · Route Group Layout
 * Purpose:     Full-screen layout for the mobile trading terminal — bypasses AppShell intentionally.
 *
 * Exports:
 *   - MobileLayout(children) → ReactNode   — bare passthrough that loads mobile CSS
 *
 * Depends on:
 *   - @/features/mobile-terminal/mobile.css — mobile design system (CSS variables + layout classes)
 *
 * Side-effects:
 *   - Injects mobile.css into the page for all routes in this group
 *
 * Key invariants:
 *   - NO AppShell, NO ContentFrame — mobile app must be full-viewport (height: 100dvh)
 *   - Root layout (ObsidianProvider + AuthProvider) still applies via tree inheritance
 *   - CSS is scoped via .mobile-app class on the root div — no html/body overrides
 *
 * Read order:
 *   1. This file — understand why AppShell is absent
 *   2. ./m/workstation/page.tsx — actual mobile workstation page
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import '@/features/mobile-terminal/mobile.css';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
