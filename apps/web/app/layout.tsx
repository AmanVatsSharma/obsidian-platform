/**
 * File:        apps/web/app/layout.tsx
 * Module:      web · Root Layout
 * Purpose:     Root Next.js layout — injects Obsidian Design System fonts,
 *              applies dark-terminal theme, and wraps the app in ObsidianProvider
 *              + ToastProvider so any descendant can call useToast().
 *              BrandProvider fetches per-tenant branding (logo, colors, name)
 *              from GET /tenancy/brand-config and applies it to CSS vars + title.
 *
 * Exports:
 *   - metadata                       — Next.js page metadata
 *   - RootLayout(children)           — Root layout component
 *
 * Depends on:
 *   - next/font/google               — Self-hosted Google Fonts (Syne, IBM Plex Mono, DM Sans)
 *   - @obsidian/obsidian-ui          — ObsidianProvider, ToastProvider
 *   - @/shared/providers/auth-provider — AuthProvider
 *   - ../lib/brand-provider          — BrandProvider (tenant branding via subdomain)
 *
 * Side-effects:
 *   - Injects CSS font variables (--font-display, --font-ui, --font-data) on <html>
 *   - Sets data-theme / data-density / --accent vars via ObsidianProvider
 *   - Mounts a fixed bottom-right toast viewport via ToastProvider
 *   - BrandProvider writes --primary-color, --bull, --bear CSS vars to document root
 *   - BrandProvider updates document.title from brand config
 *
 * Key invariants:
 *   - defaultTheme="dark" is the brand default; ObsidianProvider hydrates from localStorage
 *     on mount, so a saved 'light' preference will replace it before first paint.
 *   - defaultDensity="regular" is the product default (matches the Account Console design).
 *   - defaultAccent="blue" matches the brand accent.
 *   - Font variables must be on <html> (not <body>) so tokens.css :root fallbacks are overridden.
 *   - BrandProvider resolves tenant code from subdomain hostname on mount.
 *
 * Read order:
 *   1. Font declarations — CSS variable names match tokens.css --font-* vars
 *   2. RootLayout       — how fonts and providers are composed
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-19
 */

import './global.css';
import { DM_Sans, IBM_Plex_Mono, Syne } from 'next/font/google';
import { ObsidianProvider, ToastProvider } from '@obsidian/obsidian-ui';
import { AuthProvider } from '@/shared/providers/auth-provider';
import { BrandProvider } from '../lib/brand-provider';
import { ApolloProviderWrapper } from '@/gql/client/apollo-provider';
import { PranaProviderClient } from '../lib/prana-stream/prana-provider-client';

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
        <ObsidianProvider defaultTheme="dark" defaultDensity="regular" defaultAccent="blue">
          <ToastProvider>
            <AuthProvider>
              <ApolloProviderWrapper>
                <BrandProvider>
                  <PranaProviderClient>{children}</PranaProviderClient>
                </BrandProvider>
              </ApolloProviderWrapper>
            </AuthProvider>
          </ToastProvider>
        </ObsidianProvider>
      </body>
    </html>
  );
}
