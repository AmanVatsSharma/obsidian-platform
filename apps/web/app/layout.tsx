/**
 * File:        apps/web/app/layout.tsx
 * Module:      web · Root Layout
 * Purpose:     Root Next.js layout — injects Obsidian Design System fonts,
 *              applies dark-terminal theme, and wraps the app in ObsidianProvider.
 *
 * Exports:
 *   - metadata                       — Next.js page metadata
 *   - RootLayout(children)           — Root layout component
 *
 * Depends on:
 *   - next/font/google               — Self-hosted Google Fonts (Syne, IBM Plex Mono, DM Sans)
 *   - @obsidian/obsidian-ui         — ObsidianProvider (theme context + Radix Tooltip provider)
 *   - @/shared/providers/auth-provider — AuthProvider
 *
 * Side-effects:
 *   - Injects CSS font variables (--font-display, --font-ui, --font-data) on <html>
 *   - Sets data-theme="dark" and adds .obsidian-root class via ObsidianProvider
 *
 * Key invariants:
 *   - defaultTheme="dark" — Obsidian is always dark; system preference not consulted
 *   - Font variables must be on <html> (not <body>) so tokens.css :root fallbacks are overridden
 *
 * Read order:
 *   1. Font declarations — CSS variable names match tokens.css --font-* vars
 *   2. RootLayout — how fonts and providers are composed
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import './global.css';
import { DM_Sans, IBM_Plex_Mono, Syne } from 'next/font/google';
import { ObsidianProvider } from '@obsidian/obsidian-ui';
import { AuthProvider } from '@/shared/providers/auth-provider';

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
  title: 'Obsidian — Professional Trading Terminal',
  description: 'Multi-asset FX/CFD trading platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${syne.variable} ${ibmPlexMono.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen antialiased">
        <ObsidianProvider defaultTheme="dark" defaultDensity="comfortable">
          <AuthProvider>{children}</AuthProvider>
        </ObsidianProvider>
      </body>
    </html>
  );
}
