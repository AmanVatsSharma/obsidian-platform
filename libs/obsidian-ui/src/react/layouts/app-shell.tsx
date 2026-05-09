/**
 * @file app-shell.tsx
 * @module obsidian-ui
 * @description Application chrome: optional top bar, sidebar region, and main content.
 * @author BharatERP
 * @created 2026-04-03
 */

import * as React from 'react';

import { cn } from '../utils/cn';

export type AppShellProps = {
  /** Top region (brand, global actions). */
  topBar?: React.ReactNode;
  /** Collapsible or fixed sidebar. */
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Main landmark label for a11y. */
  mainAriaLabel?: string;
};

export function AppShell({ topBar, sidebar, children, className, mainAriaLabel }: AppShellProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-obsidian-canvas text-obsidian-primary',
        className,
      )}
    >
      {topBar ? (
        <header className="sticky top-0 z-40 border-b border-obsidian-border bg-obsidian-elevated shadow-obs-sm">
          {topBar}
        </header>
      ) : null}
      <div className="flex flex-1">
        {sidebar ? (
          <aside className="hidden w-64 shrink-0 border-r border-obsidian-border bg-obsidian-elevated md:block">
            {sidebar}
          </aside>
        ) : null}
        <main
          className="flex-1 overflow-auto p-obs-2"
          aria-label={mainAriaLabel ?? 'Main content'}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
