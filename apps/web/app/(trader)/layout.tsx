/**
 * File:        apps/web/app/(trader)/layout.tsx
 * Module:      web · (trader) Route Group
 * Purpose:     Next.js route-group layout for the authenticated trader shell.
 *              Calls useGetMeQuery on mount to validate the JWT stored by AuthProvider;
 *              error-link.ts redirects to /login on 401. Shows a skeleton spinner
 *              while the query is in-flight so the page is not blank during auth.
 *              Also mounts the global MarginBreachModal so blocking margin-call
 *              dialogs surface on every trader page.
 *
 * Exports:
 *   - default TraderLayout({ children }) — Next.js layout component ('use client')
 *
 * Depends on:
 *   - @/gql/hooks               — useGetMeQuery
 *   - @/features/global/margin-breach-modal — PranaStream-driven global modal
 *   - next/navigation           — useRouter (for future programmatic nav)
 *   - @obsidian/obsidian-ui     — AppShell, ContentFrame, ObsidianTooltip, PageHeader, buildSectionTitle
 *   - next/link                 — Link
 *
 * Side-effects:
 *   - Calls GET /graphql (GetMe query) on mount — triggers redirect to /login on 401
 *   - Subscribes to PranaStream margin.breach via MarginBreachModal
 *   - No localStorage writes; AuthProvider owns token persistence
 *
 * Key invariants:
 *   - error-link.ts (gql/client/error-link.ts) handles 401 → redirect('/login').
 *     This layout does NOT need its own redirect logic.
 *   - 'use client' is required because useGetMeQuery is a React hook.
 *   - Skeleton uses CSS animation matching the dark obsidian theme — no external spinner component needed.
 *   - MarginBreachModal renders once per layout; only one dialog is shown at a time
 *     (severity ordering: breach > critical > warning).
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

'use client';

import Link from 'next/link';
import { useGetMeQuery } from '@/gql/hooks';
import { MarginBreachModal } from '@/features/global/margin-breach-modal';
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
  { label: 'Account console', href: '/console', description: 'Profile, security, accounts, KYC, funding, API & preferences' },
  { label: 'Settings', href: '/settings', description: 'Legacy quick settings (will be merged into Account console)' },
];

// Skeleton shown while useGetMeQuery validates the JWT.
// error-link.ts (gql/client/error-link.ts) redirects to /login on 401,
// so we only need to handle the loading state here.
function AuthSkeleton() {
  return (
    <div
      className="flex h-screen items-center justify-center"
      aria-label="Verifying session…"
      role="status"
    >
      <span
        className="block h-8 w-8 rounded-full border-2 border-[color:var(--accent)] border-t-transparent"
        style={{ animation: 'obs-spin 0.7s linear infinite' }}
      />
    </div>
  );
}

export default function TraderLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useGetMeQuery();

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

  if (loading) return <AuthSkeleton />;

  return (
    <AppShell topBar={topBar} sidebar={sidebar} mainAriaLabel="Trader workspace content">
      <ContentFrame variant="wide" className="py-obs-2">
        {children}
      </ContentFrame>
      {/* Global margin-breach modal — subscribes to PranaStream
          margin.breach events. Renders a blocking dialog for critical/breach
          severities, dismissable warning banner for warnings. */}
      <MarginBreachModal />
    </AppShell>
  );
}
