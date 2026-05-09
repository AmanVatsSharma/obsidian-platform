/**
 * @file layout.tsx
 * @module web
 * @description Trader route group shell using Obsidian UI AppShell and navigation
 * @author BharatERP
 * @created 2026-04-03
 */

import Link from 'next/link';
import {
  AppShell,
  ContentFrame,
  ObsidianTooltip,
  PageHeader,
  type UiNavItem,
  buildSectionTitle,
} from '@obsidian/obsidian-ui';

const traderNavItems: UiNavItem[] = [
  { label: 'Workstation', href: '/workstation', description: 'Chart, DOM, order ticket, and watchlists' },
  { label: 'Onboarding', href: '/onboarding', description: 'KYC, profile, and broker profile completion' },
  { label: 'Portfolio', href: '/portfolio', description: 'Positions, holdings, and PnL surfaces' },
  { label: 'Orders', href: '/orders', description: 'Live orders, history, and advanced order types' },
  { label: 'Funds', href: '/funds', description: 'Deposits, withdrawals, and transfer controls' },
  { label: 'Settings', href: '/settings', description: 'Security, sessions, API keys, and preferences' },
];

export default function TraderLayout({ children }: { children: React.ReactNode }) {
  const topBar = (
    <ContentFrame variant="wide" className="py-3">
      <PageHeader
        title={buildSectionTitle('Trader Workspace')}
        description="Portfolio, orders, funds, settings, and onboarding."
      />
    </ContentFrame>
  );

  const sidebar = (
    <nav className="flex flex-col gap-1 p-obs" aria-label="Trader navigation">
      {traderNavItems.map((item) => (
        <ObsidianTooltip key={item.href} content={item.description ?? item.label}>
          <Link
            href={item.href}
            className="rounded-obs px-3 py-2 text-sm text-obsidian-primary hover:bg-obsidian-muted"
          >
            {item.label}
          </Link>
        </ObsidianTooltip>
      ))}
    </nav>
  );

  return (
    <AppShell topBar={topBar} sidebar={sidebar} mainAriaLabel="Trader workspace content">
      <ContentFrame variant="wide" className="py-obs-2">
        {children}
      </ContentFrame>
    </AppShell>
  );
}
