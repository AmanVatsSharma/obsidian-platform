/**
 * File:        apps/ib-portal/src/app/(portal)/layout.tsx
 * Module:      ib-portal · Portal Shell Layout
 * Purpose:     Shell layout for all portal routes — sidebar + topbar + scrollable main content area
 *
 * Exports:
 *   - PortalLayout({ children }) — client component (needs useState for collapsed)
 *
 * Depends on:
 *   - ../../shared/sidebar/sidebar — IBSidebar
 *   - ../../shared/topbar/topbar   — IBTopbar
 *
 * Key invariants:
 *   - flex h-screen overflow-hidden prevents double scrollbars
 *   - main.overflow-y-auto is the only scrollable container
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { IBSidebar } from '../../shared/sidebar/sidebar';
import { IBTopbar } from '../../shared/topbar/topbar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      <IBSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <IBTopbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
