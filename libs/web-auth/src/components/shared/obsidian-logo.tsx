/**
 * File:        libs/web-auth/src/components/shared/obsidian-logo.tsx
 * Module:      web-auth · ObsidianLogo
 * Purpose:     Pulsing accent dot + "OBSIDIAN" wordmark for auth screen headers.
 *
 * Exports:
 *   - ObsidianLogo({ size? }) — inline logo component; size controls font-size (default 16)
 *
 * Side-effects: none
 * Key invariants:
 *   - Requires obs-pulse @keyframes from auth.css to animate the dot
 *   - Uses var(--font-display) / var(--fg1) / var(--accent) CSS vars
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import React from 'react';

interface ObsidianLogoProps {
  size?: number;
}

export function ObsidianLogo({ size = 16 }: ObsidianLogoProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: 'var(--font-display)', fontSize: size, fontWeight: 800,
      letterSpacing: '0.12em', color: 'var(--fg1)', textTransform: 'uppercase',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)',
        animation: 'obs-pulse 2s infinite',
        display: 'inline-block',
      }} />
      OBSIDIAN
    </div>
  );
}
