/**
 * File:        apps/ib-portal/src/shared/topbar/topbar.tsx
 * Module:      ib-portal · Topbar
 * Purpose:     Global top chrome — UTC clock, system status indicator, theme toggle, user avatar
 *
 * Exports:
 *   - IBTopbar() — client component
 *
 * Depends on:
 *   - lucide-react             — Bell, HelpCircle, LogOut, Moon, Settings, Sun
 *   - @obsidian/obsidian-ui   — cn, useObsidian
 *   - ../../lib/mock-data-context — useIBData
 *
 * Side-effects:
 *   - Runs a 1s setInterval for the UTC clock
 *   - Theme toggle writes to localStorage via ObsidianProvider.setTheme
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useEffect, useState } from 'react';
import { Bell, HelpCircle, LogOut, Moon, Settings, Sun } from 'lucide-react';
import { cn, useObsidian } from '@obsidian/obsidian-ui';
import { useIBData } from '../../lib/mock-data-context';

function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function IBTopbar() {
  const time = useClock();
  const { ib } = useIBData();
  const { resolvedTheme, setTheme } = useObsidian();

  const initials = ib.name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4">
      {/* Left — status + clock */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-bull animate-pulse" />
          <span className="font-mono text-[11px] text-fg3">All systems operational</span>
        </span>
        <span className="h-3 w-px bg-[var(--border-md)]" />
        <span className={cn('font-mono text-[11px] text-fg3', !time && 'opacity-0')}>
          {time} UTC
        </span>
      </div>

      {/* Right — actions + identity */}
      <div className="flex items-center gap-0.5">
        <button className="rounded-sm p-2 text-fg3 hover:bg-[var(--bg-hover)] hover:text-fg2 transition-colors" title="Help">
          <HelpCircle size={14} strokeWidth={2} />
        </button>

        <button className="relative rounded-sm p-2 text-fg3 hover:bg-[var(--bg-hover)] hover:text-fg2 transition-colors" title="Notifications">
          <Bell size={14} strokeWidth={2} />
          <span className="absolute right-1 top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-bear px-0.5 font-mono text-[9px] font-bold text-white">3</span>
        </button>

        <button className="rounded-sm p-2 text-fg3 hover:bg-[var(--bg-hover)] hover:text-fg2 transition-colors" title="Settings">
          <Settings size={14} strokeWidth={2} />
        </button>

        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="rounded-sm p-2 text-fg3 hover:bg-[var(--bg-hover)] hover:text-fg2 transition-colors"
          title={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {resolvedTheme === 'dark'
            ? <Sun size={14} strokeWidth={2} />
            : <Moon size={14} strokeWidth={2} />
          }
        </button>

        <span className="mx-1 h-4 w-px bg-[var(--border-md)]" />

        {/* User identity */}
        <button className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-fg2 hover:bg-[var(--bg-hover)] hover:text-fg1 transition-colors">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#6366F1] font-mono text-[10px] font-bold text-white">
            {initials}
          </span>
          <span className="hidden font-sans text-[12px] sm:block">{ib.name}</span>
          <span className="hidden font-mono text-[10px] text-fg3 sm:block">· IB</span>
        </button>

        <span className="mx-1 h-4 w-px bg-[var(--border-md)]" />

        <button className="rounded-sm p-2 text-bear hover:bg-bear/10 transition-colors" title="Sign out">
          <LogOut size={14} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
