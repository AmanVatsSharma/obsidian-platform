/**
 * File:        apps/web/app/dashboard/page.tsx
 * Module:      Web · Dashboard Redirect
 * Purpose:     Redirects legacy /dashboard URL to the trading workstation.
 *
 * Exports:
 *   - DashboardPage() → never   — issues a permanent redirect, never renders
 *
 * Depends on:
 *   - next/navigation — redirect()
 *
 * Side-effects:
 *   - Issues HTTP 308 redirect to /workstation on every request
 *
 * Key invariants:
 *   - Server Component (no 'use client') — redirect happens at request time, not in browser
 *   - redirect() throws internally; this function never returns
 *
 * Read order:
 *   1. This file — one-liner, nothing else to read
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { redirect } from 'next/navigation';

export default function DashboardPage() {
  redirect('/workstation');
}
