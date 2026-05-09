/**
 * File:        apps/ib-portal/src/app/layout.tsx
 * Module:      ib-portal · Root Layout
 * Purpose:     Root Next.js layout — injects Obsidian fonts, wraps app with MockIBDataProvider
 *
 * Exports:
 *   - metadata    — Next.js page metadata
 *   - RootLayout() — root layout component
 *
 * Depends on:
 *   - next/font/google               — self-hosted Syne, IBM Plex Mono, DM Sans
 *   - @obsidian/obsidian-ui         — ObsidianProvider
 *   - ../lib/mock-data-context       — MockIBDataProvider
 *
 * Side-effects:
 *   - Injects CSS font variables (--font-display, --font-ui, --font-data) on <html>
 *
 * Key invariants:
 *   - defaultTheme="system" — first visit respects OS preference; subsequent visits restore localStorage
 *   - Font vars on <html> so tokens.css :root fallbacks are overridden
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import './global.css';
import { DM_Sans, IBM_Plex_Mono, Syne } from 'next/font/google';
import { ObsidianProvider } from '@obsidian/obsidian-ui';
import { MockIBDataProvider } from '../lib/mock-data-context';

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
  title: 'IB Portal — ArcaFX Markets',
  description: 'Introducing broker portal — network, earnings, marketing, and client management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${ibmPlexMono.variable} ${dmSans.variable}`}
    >
      <body className="bg-bg-base text-fg1 antialiased">
        <ObsidianProvider defaultTheme="system">
          <MockIBDataProvider>
            {children}
          </MockIBDataProvider>
        </ObsidianProvider>
      </body>
    </html>
  );
}
