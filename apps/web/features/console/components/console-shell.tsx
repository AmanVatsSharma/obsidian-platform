/**
 * File:        apps/web/features/console/components/console-shell.tsx
 * Module:      web · Console · Shell
 * Purpose:     The console's chrome — fixed top bar (logo, breadcrumbs, actions,
 *              user chip) + collapsible sidebar (account card, grouped nav,
 *              system footer) + main header (h1 + subtitle + status badges).
 *              Wraps the section content in a scroll container.
 *
 * Exports:
 *   - ConsoleShell — props: { children: ReactNode } — the layout-level wrapper
 *
 * Depends on:
 *   - next/link, next/navigation — usePathname for active-state detection
 *   - @obsidian/obsidian-ui      — ObsidianBadge, ObsidianIcon, ObsidianTooltip
 *   - ../lib/sections, ../lib/use-console-user
 *
 * Side-effects:
 *   - none beyond standard React state (no fetches, no localStorage writes here)
 *
 * Key invariants:
 *   - This component MUST be a client component — it relies on usePathname for
 *     highlighting the active sidebar item. (Next.js Link still works correctly
 *     for prefetched navigation.)
 *   - Active section detection: exact match for /console; prefix match for nested
 *     routes (so /console/profile/edit would still highlight 'profile').
 *   - Sidebar warning badges: KYC pending → warn on Verification; missing 2FA →
 *     warn on Security; balance == 0 with KYC approved → "New" accent on Funding.
 *     These mirror the prototype's `showBadge` helper.
 *   - "Open terminal" link routes to /workstation — the trader app's main terminal.
 *
 * Read order:
 *   1. activeSectionId — derives from URL
 *   2. Sidebar         — account card + grouped nav + footer
 *   3. TopBar          — logo, breadcrumbs, actions, user chip
 *   4. MainHeader      — h1 + sub + right-side status badge
 *   5. ConsoleShell    — composes everything; renders children inside .scroll
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import {
  ObsidianBadge,
  ObsidianIcon,
  type ObsidianBadgeKind,
  type ObsidianIconName,
} from '@obsidian/obsidian-ui';

import {
  GROUP_LABELS,
  SECTIONS,
  SECTION_DESC,
  SECTION_GROUPS,
  type ConsoleSection,
  type ConsoleSectionId,
} from '../lib/sections';
import type { ConsoleUser } from '../lib/seed-data';
import { useConsoleUser, useConsoleUserStatus } from '../lib/use-console-user';

type SidebarBadge = { kind: ObsidianBadgeKind; text: string } | null;

function deriveSidebarBadge(id: ConsoleSectionId, user: ConsoleUser): SidebarBadge {
  if (id === 'verification' && user.kycState !== 'approved') {
    return { kind: 'warn', text: user.kycState === 'pending' ? 'Pending' : '!' };
  }
  if (id === 'security' && !user.twoFA.app && !user.twoFA.sms) {
    return { kind: 'warn', text: '!' };
  }
  if (id === 'funding' && user.balanceTotal === 0 && user.kycState === 'approved') {
    return { kind: 'accent', text: 'New' };
  }
  return null;
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/console') return pathname === '/console';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function findSectionByPath(pathname: string): ConsoleSection {
  // Most specific match wins (longest href prefix).
  let best: ConsoleSection = SECTIONS[0];
  for (const s of SECTIONS) {
    if (isActive(pathname, s.href) && s.href.length >= best.href.length) {
      best = s;
    }
  }
  return best;
}

function TopBar({ user, currentLabel }: { user: ConsoleUser; currentLabel: string }) {
  return (
    <header className="topbar">
      <div className="logo">
        <span className="d" aria-hidden="true" />
        OBSIDIAN
      </div>
      <div className="crumbs">
        <ObsidianIcon name="Grid2x2" size={11} />
        <span>CONSOLE</span>
        <span className="sep">/</span>
        <span className="cur">{currentLabel}</span>
      </div>
      <div className="tb-right">
        <Link
          href="/workstation"
          className="btn sm ghost"
          style={{ marginRight: 6, textDecoration: 'none' }}
        >
          <ObsidianIcon name="LineChart" size={13} />
          Open terminal
        </Link>
        <button type="button" className="tb-btn" aria-label="Search">
          <ObsidianIcon name="Search" size={15} />
        </button>
        <button type="button" className="tb-btn" aria-label="Notifications">
          <ObsidianIcon name="Bell" size={15} />
          <span className="ndot" aria-hidden="true" />
        </button>
        <button type="button" className="tb-btn" aria-label="Help">
          <ObsidianIcon name="HelpCircle" size={15} />
        </button>
        <button type="button" className="chip" aria-label="Account menu">
          <span className="ava">{user.initials}</span>
          <div>
            <div className="nm">{user.name}</div>
            <div className="em">{user.id}</div>
          </div>
          <ObsidianIcon name="ChevronDown" size={12} />
        </button>
      </div>
    </header>
  );
}

function Sidebar({ user, pathname }: { user: ConsoleUser; pathname: string }) {
  const groupedSections = React.useMemo(() => {
    const out: Record<string, ConsoleSection[]> = {};
    for (const s of SECTIONS) {
      (out[s.group] = out[s.group] ?? []).push(s);
    }
    return out;
  }, []);

  return (
    <aside className="side" aria-label="Account console navigation">
      <div className="side-hd">
        <div className="acct-card">
          <div className="acct-row">
            <span className="ava-lg">{user.initials}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="acct-nm"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {user.name}
              </div>
              <div className="acct-id">{user.id}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`tier ${user.tier}`}>{user.tier}</span>
            {user.kycState === 'approved' ? (
              <ObsidianBadge kind="bull" dot>
                Verified
              </ObsidianBadge>
            ) : (
              <ObsidianBadge kind="warn" dot>
                {user.kycState}
              </ObsidianBadge>
            )}
          </div>
        </div>
      </div>

      {SECTION_GROUPS.map((groupId) => {
        const items = groupedSections[groupId] ?? [];
        if (items.length === 0) return null;
        return (
          <React.Fragment key={groupId}>
            <div className="nav-group-l">{GROUP_LABELS[groupId]}</div>
            <nav className="nav" aria-label={`${GROUP_LABELS[groupId]} sections`}>
              {items.map((s) => {
                const active = isActive(pathname, s.href);
                const badge = deriveSidebarBadge(s.id, user);
                return (
                  <Link
                    key={s.id}
                    href={s.href}
                    className={`nav-i ${active ? 'active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <ObsidianIcon name={s.icon as ObsidianIconName} size={15} />
                    <span className="lbl">{s.label}</span>
                    {badge && <span className={`badge ${badge.kind}`}>{badge.text}</span>}
                  </Link>
                );
              })}
            </nav>
          </React.Fragment>
        );
      })}

      <div className="side-ft">
        <div className="row">
          <span>
            <span className="live-dot" />
            System operational
          </span>
          <span>v4.21.2</span>
        </div>
        <div className="row">
          <span>Latency · LD4</span>
          <span style={{ color: 'var(--bull)' }}>4.2 ms</span>
        </div>
        <div className="row">
          <span>Server time</span>
          <span suppressHydrationWarning>—</span>
        </div>
      </div>
    </aside>
  );
}

function MainHeader({
  section,
  user,
}: {
  section: ConsoleSection;
  user: ConsoleUser;
}) {
  return (
    <div className="main-hd">
      <div>
        <h1>{section.label}</h1>
        <div className="sub" style={{ marginTop: 6 }}>
          {SECTION_DESC[section.id]}
        </div>
      </div>
      <div className="right">
        {section.id === 'overview' && (
          <ObsidianBadge kind="bull" dot>
            All systems normal
          </ObsidianBadge>
        )}
        {section.id === 'api' && <ObsidianBadge kind="accent">v1 · stable</ObsidianBadge>}
        {section.id === 'verification' && user.kycState === 'approved' && (
          <ObsidianBadge kind="bull" dot>
            Verified
          </ObsidianBadge>
        )}
      </div>
    </div>
  );
}

/**
 * StatusBanner — surfaces backend connectivity state at the top of the main
 * column. Three modes:
 *   - loading + authed → subtle "Refreshing…" with a pulse dot
 *   - error + authed   → warn-coloured "Showing cached data — refresh failed"
 *   - unauthed         → muted "Preview mode — sign in to sync your data"
 */
function StatusBanner({
  status,
}: {
  status: ReturnType<typeof useConsoleUserStatus>;
}) {
  if (!status.isAuthenticated) {
    return (
      <div
        className="status-banner muted"
        role="status"
        aria-live="polite"
        data-testid="console-banner-preview"
      >
        <span className="dot" aria-hidden="true" />
        <span>Preview mode — sign in to sync your real account data.</span>
      </div>
    );
  }
  if (status.error) {
    return (
      <div
        className="status-banner warn"
        role="status"
        aria-live="polite"
        data-testid="console-banner-error"
      >
        <span className="dot" aria-hidden="true" />
        <span>
          Showing cached data — refresh failed.{' '}
          <button
            type="button"
            className="link"
            onClick={() => {
              void status.refetch();
            }}
          >
            Retry
          </button>
        </span>
      </div>
    );
  }
  if (status.loading) {
    return (
      <div
        className="status-banner loading"
        role="status"
        aria-live="polite"
        data-testid="console-banner-loading"
      >
        <span className="dot pulse" aria-hidden="true" />
        <span>Refreshing account data…</span>
      </div>
    );
  }
  return null;
}

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/console';
  const user = useConsoleUser();
  const status = useConsoleUserStatus();
  const section = findSectionByPath(pathname);

  return (
    <div className="obsidian-console" data-screen-label={`Console · ${section.label}`}>
      <TopBar user={user} currentLabel={section.label} />
      <div className="body">
        <Sidebar user={user} pathname={pathname} />
        <main className="main">
          <MainHeader section={section} user={user} />
          <StatusBanner status={status} />
          <div className="scroll">{children}</div>
        </main>
      </div>
    </div>
  );
}
