/**
 * File:        apps/web/app/(workstation)/layout.tsx
 * Module:      Workstation · Route Group Layout
 * Purpose:     Full-screen layout for the trading workstation — bypasses AppShell intentionally.
 *
 * Exports:
 *   - WorkstationLayout(children) → ReactNode   — bare passthrough that loads workstation CSS
 *
 * Depends on:
 *   - ./workstation.css — Obsidian trading design system (CSS custom properties + layout classes)
 *
 * Side-effects:
 *   - Injects workstation.css into the page for all routes in this group
 *
 * Key invariants:
 *   - NO AppShell, NO ContentFrame — workstation must be full-viewport (height: 100vh)
 *   - Root layout (ObsidianProvider + AuthProvider) still applies via tree inheritance
 *
 * Read order:
 *   1. This file — understand why AppShell is absent
 *   2. ./workstation/page.tsx — actual workstation page
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import './workstation.css';

export default function WorkstationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
