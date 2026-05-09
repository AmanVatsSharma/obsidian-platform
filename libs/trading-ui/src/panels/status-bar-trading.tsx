/**
 * File:        libs/trading-ui/src/panels/status-bar-trading.tsx
 * Module:      trading-ui · Panels
 * Purpose:     Footer connection/server/latency strip — platform-agnostic (no next/link dependency).
 *
 * Exports:
 *   - StatusBarTrading({ ping, account, mobileHref? }) → ReactNode
 *
 * Depends on:
 *   - ../types/instrument — AccountSnapshot
 *   - lucide-react — Database, Wifi, Zap icons
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - mobileHref is optional; when absent the mobile link is not rendered (correct for desktop app)
 *   - Uses plain <a> instead of next/link so the component works in Electron renderer without Next.js
 *
 * Read order:
 *   1. StatusBarTrading — trivial render
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { Database, Wifi, Zap } from 'lucide-react';
import type { AccountSnapshot } from '../types/instrument';

export function StatusBarTrading({
  ping,
  account,
  mobileHref,
}: {
  ping: number;
  account: AccountSnapshot;
  mobileHref?: string;
}) {
  const now = new Date();
  return (
    <footer className="statusbar">
      <div className="statusbar-item">
        <div className="status-dot green" />
        <span>Connected</span>
      </div>
      <div className="statusbar-item">
        <Wifi size={10} />
        <span>{account.server}</span>
      </div>
      <div className="statusbar-item">
        <Zap size={10} />
        <span>{ping}ms</span>
      </div>
      <div className="statusbar-item">
        <Database size={10} />
        <span>{account.accountType} · {account.leverage}</span>
      </div>
      <div className="statusbar-item">
        <span>v2.4.1</span>
      </div>
      {mobileHref ? (
        <div className="statusbar-item">
          <a href={mobileHref} style={{ color: 'inherit', textDecoration: 'none' }}>
            Mobile
          </a>
        </div>
      ) : null}
      <div className="statusbar-item">
        <span>{now.toLocaleTimeString('en-US', { hour12: false })} UTC</span>
      </div>
    </footer>
  );
}
