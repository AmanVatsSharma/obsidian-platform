/**
 * File:        apps/platform-owner/src/app/layout.tsx
 * Module:      platform-owner · Root Layout
 * Purpose:     Root Next.js layout — injects Obsidian fonts, wraps app with sidebar + topbar
 *
 * Exports:
 *   - metadata     — Next.js page metadata
 *   - RootLayout() — root layout component
 *
 * Depends on:
 *   - next/font/google                   — self-hosted Syne, IBM Plex Mono, DM Sans
 *   - @obsidian/obsidian-ui             — ObsidianProvider
 *   - ../shared/sidebar/sidebar          — Sidebar nav
 *   - ../shared/topbar/topbar            — Topbar chrome
 *
 * Side-effects:
 *   - Injects CSS font variables (--font-display, --font-ui, --font-data) on <html>
 *
 * Key invariants:
 *   - defaultTheme="dark" — Obsidian is always dark
 *   - Font vars on <html> so tokens.css :root fallbacks are overridden
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import './global.css';
import { DM_Sans, IBM_Plex_Mono, Syne } from 'next/font/google';
import { ObsidianProvider } from '@obsidian/obsidian-ui';
import { AuthProvider } from '../lib/auth/auth-context';
import { AuthGuard } from '../lib/auth/auth-guard';
import { AppShell } from '../lib/auth/app-shell';
import { ErrorBoundary } from '../components/ErrorBoundary';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-data',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-ui',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata = {
  title: 'Platform Owner — Obsidian Control Plane',
  description: 'Global SaaS governance, tenant management, and monetization control for Obsidian',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${ibmPlexMono.variable} ${dmSans.variable}`}
    >
      <body className="bg-bg-base text-fg1 antialiased">
        <ObsidianProvider defaultTheme="dark">
          <AuthProvider>
            <AuthGuard>
              <ErrorBoundary>
              <AppShell>
                {children}
              </AppShell>
            </ErrorBoundary>
            </AuthGuard>
          </AuthProvider>
        </ObsidianProvider>
      </body>
    </html>
  );
}
