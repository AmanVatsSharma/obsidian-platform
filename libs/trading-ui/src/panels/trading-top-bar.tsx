/**
 * File:        libs/trading-ui/src/panels/trading-top-bar.tsx
 * Module:      trading-ui · Panels
 * Purpose:     Workstation header: pinned symbols ticker, search, session badges,
 *              and an account chip / settings affordance that deep-link to the
 *              hosting app's account console (e.g. /console in apps/web).
 *
 * Exports:
 *   - TradingTopBar({ activeInstrument, prices, onSymbolClick, account, pinned,
 *                     accountConsoleHref? }) → ReactNode
 *
 * Depends on:
 *   - ../types/instrument — Instrument, AccountSnapshot
 *   - ../lib/format-utils — fmt, fmtPrice, pnlClass, pnlSign
 *   - lucide-react — Bell, ChevronDown, Search, Settings icons
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - activeInstrument prop is accepted but not used for rendering (kept for
 *     future active-symbol highlight)
 *   - pinned list is typically the first 5 instruments from the watchlist
 *   - This file uses plain <a> (NOT next/link) because it is shared between the
 *     Next.js web app and the Electron desktop app. The hosting app supplies its
 *     own routing convention via `accountConsoleHref`. Default '/console' works
 *     for apps/web; desktop-pro can override or add the route as needed.
 *
 * Read order:
 *   1. TradingTopBar — component entry
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import { Bell, ChevronDown, Search, Settings } from 'lucide-react';
import type { AccountSnapshot, Instrument } from '../types/instrument';
import { fmt, fmtPrice, pnlClass, pnlSign } from '../lib/format-utils';

type PriceMap = Record<string, Instrument>;

export function TradingTopBar({
  prices,
  onSymbolClick,
  account,
  pinned,
  accountConsoleHref = '/console',
}: {
  activeInstrument: Instrument | null;
  prices: PriceMap;
  onSymbolClick: (i: Instrument) => void;
  account: AccountSnapshot | null;
  pinned: Instrument[];
  /**
   * Where to navigate when the user clicks the Settings gear or the account
   * chip in the top bar. Defaults to '/console' (apps/web Account Console).
   */
  accountConsoleHref?: string;
}) {
  return (
    <header className="topbar">
      <span className="topbar-logo">
        <span className="topbar-logo-dot" />
        OBSIDIAN
      </span>

      {pinned.map((inst) => {
        const p = prices[inst.symbol] ?? inst;
        return (
          <button
            key={inst.symbol}
            type="button"
            className="topbar-symbol"
            onClick={() => onSymbolClick(inst)}
          >
            <span className="topbar-symbol-name">{inst.symbol}</span>
            <span className={`topbar-symbol-price ${pnlClass(p.change)}`}>{fmtPrice(p.bid, inst.digits)}</span>
            <span className={`topbar-symbol-change ${pnlClass(p.changePct)}`}>
              {pnlSign(p.changePct)}
              {p.changePct?.toFixed(2)}%
            </span>
          </button>
        );
      })}

      <div className="topbar-search">
        <Search size={13} />
        <input readOnly placeholder="Search symbol, market…" aria-label="Search markets" />
      </div>

      <div className="session-badges">
        <span className="session-badge open"><span className="session-badge-dot" />NY</span>
        <span className="session-badge open"><span className="session-badge-dot" />LON</span>
        <span className="session-badge closed"><span className="session-badge-dot" />TKY</span>
        <span className="session-badge closed"><span className="session-badge-dot" />SYD</span>
      </div>

      <div className="topbar-actions">
        <button type="button" className="topbar-btn" data-tip="Alerts" aria-label="Alerts">
          <Bell size={15} />
          <span className="notif-dot" />
        </button>
        <a
          href={accountConsoleHref}
          className="topbar-btn"
          data-tip="Account console"
          aria-label="Open account console"
        >
          <Settings size={15} />
        </a>
      </div>

      <a
        href={accountConsoleHref}
        className="account-chip"
        aria-label="Open account console"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <div className="account-avatar">{(account?.name ?? '—').slice(0, 2).toUpperCase()}</div>
        <div>
          <div className="account-chip-label">Balance</div>
          <div className="account-chip-balance">${fmt(account?.balance ?? 0)}</div>
        </div>
        <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
      </a>
    </header>
  );
}
