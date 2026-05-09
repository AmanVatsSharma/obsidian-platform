/**
 * File:        apps/platform-owner/src/app/page.tsx
 * Module:      platform-owner · Root Route
 * Purpose:     Root route redirects to /dashboard
 *
 * Exports:
 *   - default() — server redirect to /dashboard
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { redirect } from 'next/navigation';

export default function IndexPage() {
  redirect('/dashboard');
}
