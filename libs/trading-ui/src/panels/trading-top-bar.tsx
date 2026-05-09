/**
 * File:        libs/trading-ui/src/panels/trading-top-bar.tsx
 * Module:      trading-ui · Panels
 * Purpose:     Workstation header: pinned symbols ticker, search, session badges, account chip.
 *
 * Exports:
 *   - TradingTopBar({ activeInstrument, prices, onSymbolClick, account, pinned }) → ReactNode
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
 *   - activeInstrument prop is accepted but not used for rendering (kept for future highlight use)
 *   - pinned list is typically the first 5 instruments from the watchlist
 *
 * Read order:
 *   1. TradingTopBar — component entry
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
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
}: {
  activeInstrument: Instrument | null;
  prices: PriceMap;
  onSymbolClick: (i: Instrument) => void;
  account: AccountSnapshot;
  pinned: Instrument[];
}) {
  return (
    <header className="topbar">
      <span className="topbar-logo">
        <span className="topbar-logo-dot" />
        NESTTRADE
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
        <button type="button" className="topbar-btn" data-tip="Settings" aria-label="Settings">
          <Settings size={15} />
        </button>
      </div>

      <div className="account-chip">
        <div className="account-avatar">{account.name.slice(0, 2).toUpperCase()}</div>
        <div>
          <div className="account-chip-label">Balance</div>
          <div className="account-chip-balance">${fmt(account.balance)}</div>
        </div>
        <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
      </div>
    </header>
  );
}
