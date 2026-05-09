/**
 * File:        libs/web-auth/src/components/shared/auth-shell.tsx
 * Module:      web-auth · AuthShell
 * Purpose:     Split-layout shell for all Obsidian auth screens. Left pane = form area,
 *              right pane = 520px MarketHero or custom hero content.
 *
 * Exports:
 *   - AuthShell({ children, hero?, heroVariant?, heroTitle?, heroSubtitle? })
 *     children: form content (left pane)
 *     hero:     custom right-pane override (if omitted, MarketHero is used)
 *
 * Side-effects: none
 * Key invariants:
 *   - Grid: "1fr 520px" — hero is always fixed 520px
 *   - Full viewport height (100vh), overflow hidden
 *   - Left pane scrolls independently when form is taller than viewport
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import React, { ReactNode } from 'react';
import { MarketHero } from './market-hero';

interface AuthShellProps {
  children: ReactNode;
  hero?: ReactNode;
  heroVariant?: 'default' | 'broker' | 'platform';
  heroTitle?: string;
  heroSubtitle?: string;
}

export function AuthShell({ children, hero, heroVariant, heroTitle, heroSubtitle }: AuthShellProps) {
  return (
    <div
      className="obs-auth-root"
      style={{
        display: 'grid', gridTemplateColumns: '1fr 520px',
        height: '100vh', overflow: 'hidden',
        background: 'var(--bg-base)',
      }}
    >
      {/* left: form */}
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      {/* right: hero */}
      <div style={{ height: '100vh' }}>
        {hero ?? (
          <MarketHero
            variant={heroVariant}
            title={heroTitle}
            subtitle={heroSubtitle}
          />
        )}
      </div>
    </div>
  );
}
