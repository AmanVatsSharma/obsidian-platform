/**
 * File:        apps/platform-owner/src/shared/sidebar/sidebar.tsx
 * Module:      platform-owner · Sidebar Navigation
 * Purpose:     Collapsible Obsidian-styled sidebar with 8 nav groups and active link detection
 *
 * Exports:
 *   - Sidebar() — client component rendering collapsible navigation
 *
 * Depends on:
 *   - ./nav-config       — full NAV_GROUPS tree
 *   - @obsidian/obsidian-ui — cn()
 *   - next/navigation    — usePathname()
 *   - lucide-react       — icons
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - 'use client' required for usePathname + useState
 *   - Collapsed state: width 56px, labels hidden; expanded: 240px
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Activity, Users, UserCheck, UserX, Lightbulb,
  Layers, Zap, BarChart2, DollarSign, FileText, Receipt,
  Shield, AlertTriangle, FileWarning, Code, Webhook, Package,
  Users2, ClipboardList, Bell, Settings, Server, Wifi, Database,
  ChevronsLeft, ChevronsRight, Heart,
} from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';
import { NAV_GROUPS } from './nav-config';

const ICON_MAP: Record<string, React.ReactNode> = {
  dashboard:      <LayoutDashboard size={15} strokeWidth={2} />,
  health:         <Heart size={15} strokeWidth={2} />,
  activity:       <Activity size={15} strokeWidth={2} />,
  brokers:        <Users size={15} strokeWidth={2} />,
  onboarding:     <UserCheck size={15} strokeWidth={2} />,
  suspended:      <UserX size={15} strokeWidth={2} />,
  features:       <Lightbulb size={15} strokeWidth={2} />,
  instruments:    <Layers size={15} strokeWidth={2} />,
  lps:            <Zap size={15} strokeWidth={2} />,
  pricing:        <BarChart2 size={15} strokeWidth={2} />,
  fees:           <DollarSign size={15} strokeWidth={2} />,
  nodes:          <Server size={15} strokeWidth={2} />,
  gateway:        <Zap size={15} strokeWidth={2} />,
  ws:             <Wifi size={15} strokeWidth={2} />,
  db:             <Database size={15} strokeWidth={2} />,
  revenue:        <BarChart2 size={15} strokeWidth={2} />,
  billing:        <Receipt size={15} strokeWidth={2} />,
  invoices:       <FileText size={15} strokeWidth={2} />,
  compliance:     <Shield size={15} strokeWidth={2} />,
  aml:            <AlertTriangle size={15} strokeWidth={2} />,
  incidents:      <FileWarning size={15} strokeWidth={2} />,
  developer:      <Code size={15} strokeWidth={2} />,
  webhooks:       <Webhook size={15} strokeWidth={2} />,
  sdks:           <Package size={15} strokeWidth={2} />,
  team:           <Users2 size={15} strokeWidth={2} />,
  'audit-controls': <ClipboardList size={15} strokeWidth={2} />,
  notifications:  <Bell size={15} strokeWidth={2} />,
  settings:       <Settings size={15} strokeWidth={2} />,
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] transition-[width] duration-200 ease-in-out shrink-0 overflow-hidden',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-3 py-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-r-md bg-gradient-to-br from-accent to-purple text-white text-xs font-bold font-display">
          ⬡
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="truncate font-display text-[13px] font-bold tracking-wider text-fg1 uppercase">
              Obsidian Hub
            </div>
            <div className="font-mono text-[10px] text-fg3">v2.4.1 · Platform</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            'ml-auto shrink-0 rounded-r-sm p-1 text-fg3 hover:bg-[var(--bg-hover)] hover:text-fg2 transition-colors',
            collapsed && 'mx-auto',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight size={14} strokeWidth={2} /> : <ChevronsLeft size={14} strokeWidth={2} />}
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.section} className="mb-1">
            {!collapsed && (
              <div className="px-3 pb-1 pt-3 font-display text-[9px] font-semibold tracking-[0.12em] text-fg3 uppercase">
                {group.section}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'mx-1 my-0.5 flex items-center gap-2 rounded-r-sm px-2 py-1.5 text-[12px] transition-colors',
                    isActive
                      ? 'border border-accent/20 bg-accent/10 text-accent'
                      : 'text-fg2 hover:bg-[var(--bg-hover)] hover:text-fg1',
                    collapsed && 'justify-center px-0',
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="shrink-0">{ICON_MAP[item.id] ?? <LayoutDashboard size={15} strokeWidth={2} />}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'rounded-full border px-1.5 font-mono text-[10px]',
                            item.badgeWarn
                              ? 'border-warn/30 bg-warn/10 text-warn'
                              : 'border-[var(--border-md)] bg-[var(--bg-elevated)] text-fg3',
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-[var(--border)] px-3 py-3">
          <div className="font-mono text-[10px] text-fg3">Platform Owner Console</div>
          <div className="font-mono text-[10px] text-fg3 mt-0.5">Obsidian SaaS v2.4.1</div>
        </div>
      )}
    </aside>
  );
}
