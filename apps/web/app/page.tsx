/**
 * File:        apps/web/app/page.tsx
 * Module:      Web · Landing Page
 * Purpose:     Obsidian-themed demo landing page linking to all major app surfaces.
 *
 * Exports:
 *   - Index() → ReactNode   — full-screen dark landing page with CTA cards
 *
 * Depends on:
 *   - next/link — client-side navigation
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Server Component (no 'use client') — zero client JS for this route
 *   - Uses obsidian-ui Tailwind tokens (bg-obsidian-canvas, text-obsidian-primary, etc.)
 *   - Root layout (ObsidianProvider) applies — theme tokens are available
 *
 * Read order:
 *   1. This file — entry point
 *   2. app/(workstation)/workstation/page.tsx — primary CTA destination
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import Link from 'next/link';

const DEMO_LINKS = [
  {
    href: '/workstation',
    label: 'Workstation',
    description: 'Full-screen desktop trading terminal with charting, DOM, and order book.',
    tag: 'Desktop',
    primary: true,
  },
  {
    href: '/m/workstation',
    label: 'Mobile Terminal',
    description: 'PWA-ready mobile app with bottom nav, 8 screens, and swipe-to-close positions.',
    tag: 'Mobile',
    primary: false,
  },
  {
    href: '/portfolio',
    label: 'Portfolio',
    description: 'Positions, holdings, and P&L surfaces inside the AppShell.',
    tag: 'Trader',
    primary: false,
  },
  {
    href: '/funds',
    label: 'Funds',
    description: 'Balances, linked accounts, deposits, withdrawals, and transaction history.',
    tag: 'Trader',
    primary: false,
  },
  {
    href: '/orders',
    label: 'Orders',
    description: 'Live orders, pending queue, and trade history with advanced filters.',
    tag: 'Trader',
    primary: false,
  },
  {
    href: '/onboarding',
    label: 'Onboarding',
    description: 'KYC, profile completion, and broker profile setup wizard.',
    tag: 'Trader',
    primary: false,
  },
] as const;

export default function Index() {
  return (
    <div className="min-h-screen bg-obsidian-canvas flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-obsidian-border">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight text-obsidian-primary">
            Nest<span className="text-obsidian-action">Trade</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded-obs bg-obsidian-muted text-obsidian-faint font-mono">
            demo
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-obsidian-faint">
          <Link href="/workstation" className="hover:text-obsidian-primary transition-colors">
            Workstation
          </Link>
          <Link href="/m/workstation" className="hover:text-obsidian-primary transition-colors">
            Mobile
          </Link>
          <Link
            href="/workstation"
            className="px-3 py-1.5 rounded-obs bg-obsidian-action text-obsidian-action-fg text-xs font-medium hover:bg-obsidian-action-hover transition-colors"
          >
            Open Terminal
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-16 gap-12">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-obsidian-primary mb-4">
            Professional trading,{' '}
            <span className="text-obsidian-action">demo-ready.</span>
          </h1>
          <p className="text-base text-obsidian-faint leading-relaxed">
            Obsidian is a multi-surface trading platform. All views below run on mock data —
            no login, no backend required.
          </p>
        </div>

        {/* Primary CTA */}
        <Link
          href="/workstation"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-obs bg-obsidian-action text-obsidian-action-fg font-semibold text-sm hover:bg-obsidian-action-hover transition-colors shadow-lg"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="2" width="14" height="10" rx="1.5" opacity="0.3" />
            <rect x="1" y="2" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="5" y1="14" x2="11" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="8" y1="12" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Open Trading Workstation
        </Link>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
          {DEMO_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col gap-2 p-5 rounded-obs bg-obsidian-elevated border border-obsidian-border hover:border-obsidian-border-strong transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-obsidian-primary group-hover:text-obsidian-action transition-colors">
                  {link.label}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-obsidian-muted text-obsidian-faint font-mono">
                  {link.tag}
                </span>
              </div>
              <p className="text-xs text-obsidian-faint leading-relaxed">{link.description}</p>
              <span className="text-xs text-obsidian-action opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-obsidian-border flex items-center justify-between text-xs text-obsidian-faint">
        <span>Obsidian · Demo build · No backend integration</span>
        <span className="font-mono">apps/web · Next.js 15 · App Router</span>
      </footer>
    </div>
  );
}
