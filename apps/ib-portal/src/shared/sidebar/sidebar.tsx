/**
 * File:        apps/ib-portal/src/shared/sidebar/sidebar.tsx
 * Module:      ib-portal · Sidebar
 * Purpose:     Collapsible sidebar with IB profile card, tier badge, referral code copy, and nav groups
 *
 * Exports:
 *   - IBSidebar({ collapsed, onToggle }) — client component
 *
 * Depends on:
 *   - next/navigation          — usePathname for active state
 *   - next/link                — Link for navigation
 *   - lucide-react             — ChevronLeft, ChevronRight, Copy, Check
 *   - @obsidian/obsidian-ui   — cn (classname util)
 *   - ../../lib/mock-data-context — useIBData
 *   - ./nav-config             — NAV_GROUPS, ICON_MAP
 *
 * Side-effects:
 *   - Clipboard write on ref code copy
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';
import { useIBData } from '../../lib/mock-data-context';
import { ICON_MAP, NAV_GROUPS } from './nav-config';

interface IBSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function IBSidebar({ collapsed, onToggle }: IBSidebarProps) {
  const { ib } = useIBData();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  const initials = ib.name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(ib.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tierClass: Record<string, string> = {
    SILVER:   'tier-silver',
    GOLD:     'tier-gold',
    PLATINUM: 'tier-platinum',
  };

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] transition-[width] duration-[220ms]',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      {/* Profile section */}
      <div className={cn('ib-sidebar-profile border-b border-[var(--border)] flex flex-col gap-2.5', collapsed ? 'items-center px-2 py-4' : 'px-3.5 py-5')}>
        {/* Avatar + name row */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 min-w-[36px] items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#6366F1] font-mono text-[12px] font-semibold text-white border-2 border-accent/30">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate font-sans text-[13px] font-semibold text-fg1">{ib.name}</div>
              <div className="truncate font-sans text-[11px] text-fg2 mt-0.5">{ib.broker}</div>
            </div>
          )}
        </div>

        {/* Tier badge + ref code — expanded only */}
        {!collapsed && (
          <>
            <span className={cn('tier-badge', tierClass[ib.tier])}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {ib.tier}
            </span>

            <div className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[9px] tracking-[0.1em] text-fg3 uppercase">Ref Code</div>
                <div className="font-mono text-[11px] text-accent truncate">{ib.code}</div>
              </div>
              <button
                onClick={handleCopy}
                className={cn('rounded p-0.5 transition-colors', copied ? 'text-bull' : 'text-fg3 hover:text-bull')}
                title="Copy referral code"
              >
                {copied ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={2} />}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-none">
        {NAV_GROUPS.map(group => {
          const Icon = ICON_MAP[group.items[0]?.icon];
          return (
            <div key={group.label}>
              {!collapsed && (
                <div className="px-4 pb-1 pt-2.5 font-mono text-[9px] tracking-[0.15em] text-fg3 uppercase">
                  {group.label}
                </div>
              )}
              {group.items.map(item => {
                const ItemIcon = ICON_MAP[item.icon];
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-2.5 border-l-2 px-4 py-2 font-sans text-[13px] transition-colors duration-[120ms] whitespace-nowrap overflow-hidden',
                      isActive
                        ? 'border-accent bg-accent/8 text-accent font-medium'
                        : 'border-transparent text-fg2 hover:bg-[var(--bg-hover)] hover:text-fg1',
                      collapsed && 'justify-center px-0 py-2.5',
                    )}
                  >
                    {ItemIcon && <ItemIcon size={14} strokeWidth={2} className="shrink-0" />}
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 border-t border-[var(--border)] px-4 py-3 font-sans text-[12px] text-fg3 transition-colors hover:text-fg2',
          collapsed && 'justify-center px-0',
        )}
      >
        {collapsed
          ? <ChevronRight size={14} strokeWidth={2} />
          : <><ChevronLeft size={14} strokeWidth={2} /><span>Collapse</span></>
        }
      </button>
    </aside>
  );
}
