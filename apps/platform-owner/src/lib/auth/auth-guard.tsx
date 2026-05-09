/**
 * File:        apps/platform-owner/src/lib/auth/auth-guard.tsx
 * Module:      platform-owner · Auth Guard
 * Purpose:     Client-side redirect to /login when the user is not authenticated.
 *              Skips redirect on the /login path itself.
 *
 * Exports:
 *   - AuthGuard({ children })  — wraps protected layout sections
 *
 * Key invariants:
 *   - Renders null (blank) while auth state is hydrating to prevent flicker.
 *   - Uses next/navigation's usePathname + useRouter for App Router compatibility.
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, pathname, router]);

  if (!hydrated) return null;
  if (!isAuthenticated && pathname !== '/login') return null;

  return <>{children}</>;
}
