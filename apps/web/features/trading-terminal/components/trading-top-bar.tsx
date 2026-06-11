/**
 * @file trading-top-bar.tsx
 * @module web-trading
 * @description Workstation header: pinned symbols, search, session pills, account chip.
 *              Settings gear and account chip both deep-link to /console (the
 *              full Account Console — profile, security, accounts, KYC, funding,
 *              API & preferences) so users can reach it from inside the terminal.
 * @author BharatERP
 * @created 2026-04-03
 * @last-updated 2026-05-09
 */

'use client';

import { Bell, ChevronDown, Search, Settings } from 'lucide-react';
import Link from 'next/link';
import type { AccountSnapshot, Instrument } from '../lib/types';
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
  account: AccountSnapshot | null;
  pinned: Instrument[];
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
        <span className="session-badge open">
          <span className="session-badge-dot" />
          NY
        </span>
        <span className="session-badge open">
          <span className="session-badge-dot" />
          LON
        </span>
        <span className="session-badge closed">
          <span className="session-badge-dot" />
          TKY
        </span>
        <span className="session-badge closed">
          <span className="session-badge-dot" />
          SYD
        </span>
      </div>

      <div className="topbar-actions">
        <button type="button" className="topbar-btn" data-tip="Alerts" aria-label="Alerts">
          <Bell size={15} />
          <span className="notif-dot" />
        </button>
        <Link
          href="/console"
          className="topbar-btn"
          data-tip="Account console"
          aria-label="Open account console"
        >
          <Settings size={15} />
        </Link>
      </div>

      <Link
        href="/console"
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
      </Link>
    </header>
  );
}
