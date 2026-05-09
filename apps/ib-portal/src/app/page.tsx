/**
 * File:        apps/ib-portal/src/app/page.tsx
 * Module:      ib-portal · Root Page
 * Purpose:     Redirect root path to /dashboard
 *
 * Exports:
 *   - IndexPage() — redirects to /dashboard via next/navigation
 *
 * Side-effects:
 *   - Performs a server-side permanent redirect to /dashboard
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { redirect } from 'next/navigation';

export default function IndexPage() {
  redirect('/dashboard');
}
