/**
 * File:        apps/platform-owner/src/shared/topbar/topbar.tsx
 * Module:      platform-owner · Topbar
 * Purpose:     Global top chrome with live clock, system status badge, user identity, and logout.
 *
 * Exports:
 *   - Topbar() — client component
 *
 * Side-effects:
 *   - Runs a 1s interval to keep the clock live
 *   - Clears sessionStorage on logout, redirects to /login
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-08
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';

function useClock() {
  const [time, setTime] = useState<string>('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Topbar() {
  const time = useClock();
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem('po_access_token');
    router.push('/login');
  };

  return (
    <header className="flex h-11 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4">
      {/* Left — system status */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-bull animate-pulse" />
          <span className="font-mono text-[11px] text-fg3">All systems operational</span>
        </span>
        <span className="h-3 w-px bg-[var(--border-md)]" />
        <span className={cn('font-mono text-[11px] text-fg3', time ? '' : 'opacity-0')}>
          {time} UTC
        </span>
      </div>

      {/* Right — notifications + user */}
      <div className="flex items-center gap-1">
        <button className="relative rounded-r-sm p-2 text-fg3 hover:bg-[var(--bg-hover)] hover:text-fg2 transition-colors">
          <Bell size={14} strokeWidth={2} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-warn" />
        </button>
        <div className="group relative">
          <button className="flex items-center gap-1.5 rounded-r-sm px-2 py-1.5 text-fg2 hover:bg-[var(--bg-hover)] hover:text-fg1 transition-colors">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 font-display text-[11px] font-bold text-accent">
              PO
            </span>
            <span className="font-ui text-[12px]">Platform Owner</span>
            <ChevronDown size={12} strokeWidth={2} className="text-fg3" />
          </button>
          {/* Dropdown */}
          <div className="invisible absolute right-0 top-full z-50 mt-1 w-36 rounded-r-lg border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2.5 font-mono text-[11px] text-fg3 hover:bg-[var(--bg-hover)] hover:text-fg1 transition-colors"
            >
              <LogOut size={12} strokeWidth={2} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
