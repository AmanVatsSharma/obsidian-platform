/**
 * File:        apps/public-site/src/app/layout.tsx
 * Module:      public-site · Root Layout
 * Purpose:     Root Next.js layout — injects Obsidian Design System fonts,
 *              renders the custom cursor DOM elements, and mounts the
 *              client-side cursor controller.
 *
 * Exports:
 *   - metadata                   — Next.js page metadata (title, description, OG)
 *   - RootLayout(children)       — Root layout component
 *
 * Depends on:
 *   - next/font/google            — Self-hosted Google Fonts (Syne, IBM Plex Mono, DM Sans)
 *   - @/components/ui/Cursor      — Client-side cursor controller (attaches mousemove)
 *
 * Side-effects:
 *   - Injects CSS font variables (--font-display, --font-ui, --font-data) on <html>
 *   - Renders #obs-cursor, #obs-dot, #noise divs in <body> (targeted by Cursor + global.css)
 *
 * Key invariants:
 *   - Font variables must be on <html> (not <body>) so tokens.css :root fallbacks are overridden
 *   - #obs-cursor / #obs-dot are aria-hidden — invisible to screen readers
 *   - No ObsidianProvider needed — public site has no auth or Radix UI components
 *   - suppressHydrationWarning on <html> prevents mismatches from next/font className injection
 *
 * Read order:
 *   1. Font declarations — variable names match tokens.css --font-* vars
 *   2. RootLayout — how fonts, cursor DOM, and providers compose
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import './global.css';
import { DM_Sans, IBM_Plex_Mono, Syne } from 'next/font/google';
import { Cursor } from '@/components/ui/Cursor';

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
  title: 'Obsidian — The Trading Platform Brokers Deserve',
  description:
    'White-label the full-stack trading infrastructure. From matching engine to mobile app — launch your branded broker in weeks, not years.',
};

export const viewport = {
  themeColor: '#06080A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${syne.variable} ${ibmPlexMono.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen antialiased">
        {/* Film grain overlay — pure CSS, no JS */}
        <div id="noise" aria-hidden="true" />
        {/* Custom cursor — aria-hidden, pointer-events: none */}
        <div id="obs-cursor" aria-hidden="true" />
        <div id="obs-dot"    aria-hidden="true" />
        {/* Client cursor controller — attaches mousemove listeners */}
        <Cursor />
        {children}
      </body>
    </html>
  );
}
