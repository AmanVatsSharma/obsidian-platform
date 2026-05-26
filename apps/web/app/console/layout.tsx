/**
 * File:        apps/web/app/console/layout.tsx
 * Module:      web · Console · Layout
 * Purpose:     Next.js segment layout for /console/* — imports the scoped
 *              console.css and mounts <ConsoleShell> around every section.
 *
 * Exports:
 *   - default ConsoleLayout({ children })  — Next.js layout component
 *   - metadata                              — segment-level title/description
 *
 * Depends on:
 *   - ./console.css                          — scoped stylesheet (verbatim design CSS)
 *   - @/features/console (public API)        — ConsoleShell
 *
 * Side-effects:
 *   - Importing console.css applies its rules globally (CSS doesn't care which
 *     component imports it). Scoping is provided by the .obsidian-console class
 *     on the shell — selectors don't leak to other surfaces.
 *
 * Key invariants:
 *   - This layout sits OUTSIDE the (trader) and (workstation) route groups, so the
 *     console renders without any trader chrome.
 *   - Marked dynamic via the children pattern; sections themselves can be 'use client'
 *     when they hold form state.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import './console.css';

import { ConsoleShell } from '@/features/console';

export const metadata = {
  title: 'Account Console — Obsidian',
  description: 'Manage your Obsidian profile, security, accounts, funding, and preferences.',
};

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
