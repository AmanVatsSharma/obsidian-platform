/**
 * File:        apps/platform-owner/src/lib/auth/app-shell.tsx
 * Module:      platform-owner · App Shell
 * Purpose:     Conditionally renders Sidebar + Topbar for authenticated users.
 *              On the /login route, renders full-screen (no chrome).
 *
 * Exports:
 *   - AppShell({ children })  — client component
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Topbar } from '../../shared/topbar/topbar';
import { useAuth } from './auth-context';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-[var(--bg-base)]">
          {children}
        </main>
      </div>
    </div>
  );
}
