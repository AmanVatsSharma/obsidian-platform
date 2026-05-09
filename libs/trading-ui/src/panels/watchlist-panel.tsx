/**
 * File:        libs/trading-ui/src/panels/watchlist-panel.tsx
 * Module:      trading-ui · Panels
 * Purpose:     Category-filtered watchlist with live bid/change display and instrument selection.
 *
 * Exports:
 *   - WatchlistPanel({ instruments, activeInstrument, prices, onSelect }) → ReactNode
 *
 * Depends on:
 *   - ../types/instrument — Instrument
 *   - ../lib/format-utils — fmtPrice, pnlSign
 *   - lucide-react — Search icon
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - prices map is keyed by symbol; falls back to instrument.bid when tick not yet received
 *
 * Read order:
 *   1. WatchlistPanel — component entry and filter logic
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Instrument } from '../types/instrument';
import { fmtPrice, pnlSign } from '../lib/format-utils';

type PriceMap = Record<string, Instrument>;

export function WatchlistPanel({
  instruments,
  activeInstrument,
  prices,
  onSelect,
}: {
  instruments: Instrument[];
  activeInstrument: Instrument | null;
  prices: PriceMap;
  onSelect: (i: Instrument) => void;
}) {
  const [cat, setCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const cats = ['all', 'forex', 'crypto', 'indices', 'commodities'];

  const filtered = instruments.filter(
    (i) =>
      (cat === 'all' || i.category === cat) &&
      (i.symbol.toLowerCase().includes(search.toLowerCase()) || i.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <aside className="watchlist">
      <div className="watchlist-header">
        <div className="watchlist-title">Watchlist</div>
        <div className="watchlist-search">
          <Search size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input placeholder="Filter…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Filter watchlist" />
        </div>
      </div>

      <div className="watchlist-cats">
        {cats.map((c) => (
          <button key={c} type="button" className={`cat-btn ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
            {c === 'all' ? 'All' : c === 'commodities' ? 'Comm.' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <div className="watchlist-list">
        {filtered.map((inst) => {
          const p = prices[inst.symbol] ?? inst;
          const isPos = (p.changePct ?? 0) >= 0;
          return (
            <div
              key={inst.symbol}
              role="button"
              tabIndex={0}
              className={`watchlist-item ${activeInstrument?.symbol === inst.symbol ? 'active' : ''}`}
              onClick={() => onSelect(inst)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(inst);
                }
              }}
            >
              <span className="wi-symbol">{inst.symbol}</span>
              <span className={`wi-bid ${isPos ? 'bull' : 'bear'}`}>{fmtPrice(p.bid, inst.digits)}</span>
              <span className="wi-name">{inst.name}</span>
              <span className={`wi-chg ${isPos ? 'bull' : 'bear'}`}>
                {pnlSign(p.changePct ?? 0)}
                {(p.changePct ?? 0).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
