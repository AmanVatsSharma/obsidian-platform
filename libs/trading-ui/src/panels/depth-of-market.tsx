/**
 * File:        libs/trading-ui/src/panels/depth-of-market.tsx
 * Module:      trading-ui · Panels
 * Purpose:     Depth-of-market ladder with simulated bid/ask volume walls refreshing every 800ms.
 *
 * Exports:
 *   - DepthOfMarket({ instrument }) → ReactNode
 *
 * Depends on:
 *   - ../types/instrument — Instrument
 *   - ../lib/format-utils — fmtPrice
 *
 * Side-effects:
 *   - setInterval regenerates DOM levels every 800ms (mock simulation; replace with IPC feed in desktop)
 *
 * Key invariants:
 *   - DOM levels are keyed by index, not price, since prices change on every tick
 *
 * Read order:
 *   1. DepthOfMarket — component and render
 *   2. domForInstrument — level generator
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useEffect, useState } from 'react';
import type { Instrument } from '../types/instrument';
import { fmtPrice } from '../lib/format-utils';

type DomLevel = { price: number; volume: number; type: 'bid' | 'ask'; depth: number };

function domForInstrument(inst: Instrument | null): DomLevel[] {
  const base = inst?.bid ?? 1.08452;
  const pip = inst?.pip ?? 0.0001;
  const levels: DomLevel[] = [];
  for (let i = 10; i >= 1; i--) {
    levels.push({
      price: parseFloat((base - i * pip).toFixed(inst?.digits ?? 5)),
      volume: Math.floor(Math.random() * 5000 + 500),
      type: 'bid',
      depth: Math.floor(Math.random() * 30000 + 3000),
    });
  }
  for (let i = 1; i <= 10; i++) {
    levels.push({
      price: parseFloat((base + i * pip).toFixed(inst?.digits ?? 5)),
      volume: Math.floor(Math.random() * 5000 + 500),
      type: 'ask',
      depth: Math.floor(Math.random() * 30000 + 3000),
    });
  }
  return levels;
}

export function DepthOfMarket({
  instrument,
  /** Optional live DOM snapshot from PranaStream. When provided, the panel uses it instead of the random simulator. */
  domFrame,
}: {
  instrument: Instrument | null;
  domFrame?: {
    exchange: string;
    symbol: string;
    bids: { price: number; quantity: number; orders?: number }[];
    asks: { price: number; quantity: number; orders?: number }[];
    ts: number;
  } | null;
}) {
  // If live DOM is provided, map it into DomLevel[] (merge bids/asks into a single
  // ranked list with type/depth). Otherwise use the simulator to keep the panel working.
  const defaultDom = domForInstrument(instrument);
  const [dom, setDom] = useState<DomLevel[]>(() => {
    if (domFrame) {
      const rows: DomLevel[] = [];
      domFrame.bids.forEach((b, i) => {
        rows.push({ price: b.price, volume: b.quantity, type: 'bid', depth: i * 100 + 500 });
      });
      domFrame.asks.forEach((a, i) => {
        rows.push({ price: a.price, volume: a.quantity, type: 'ask', depth: i * 100 + 500 });
      });
      return rows;
    }
    return defaultDom;
  });

  useEffect(() => {
    if (domFrame) return;
    const iv = setInterval(() => setDom(domForInstrument(instrument)), 800);
    return () => clearInterval(iv);
  }, [instrument?.symbol, instrument?.bid, domFrame]);

  // When live DOM updates, re-map into DomLevel[]
  useEffect(() => {
    if (domFrame) {
      const rows: DomLevel[] = [];
      domFrame.bids.forEach((b, i) => {
        rows.push({ price: b.price, volume: b.quantity, type: 'bid', depth: i * 100 + 500 });
      });
      domFrame.asks.forEach((a, i) => {
        rows.push({ price: a.price, volume: a.quantity, type: 'ask', depth: i * 100 + 500 });
      });
      setDom(rows);
    }
  }, [domFrame]);

  const asks = dom.filter((d) => d.type === 'ask').reverse();
  const bids = dom.filter((d) => d.type === 'bid').reverse();
  const maxVol = Math.max(...dom.map((d) => d.volume), 1);

  return (
    <div className="dom-panel panel">
      <div className="dom-header">
        <span className="panel-title">DOM</span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'var(--text-muted)' }}>{instrument?.symbol}</span>
      </div>
      <div className="dom-cols">
        <span>Price</span>
        <span style={{ textAlign: 'right' }}>Volume</span>
        <span style={{ textAlign: 'right' }}>Depth</span>
      </div>
      <div className="dom-list">
        {asks.map((row, i) => (
          <div key={`ask-${i}`} className="dom-row ask">
            <div className="dom-bar" style={{ width: `${(row.volume / maxVol) * 100}%` }} />
            <span className="dom-price">{fmtPrice(row.price, instrument?.digits ?? 5)}</span>
            <span className="dom-vol">{(row.volume / 1000).toFixed(1)}K</span>
            <span className="dom-depth">{(row.depth / 1000).toFixed(0)}K</span>
          </div>
        ))}
        <div className="dom-spread-row">
          <span className="dom-spread-label">SPREAD</span>
          <span className="dom-spread-val">{instrument?.spread ?? '0.6'} pts</span>
        </div>
        {bids.map((row, i) => (
          <div key={`bid-${i}`} className="dom-row bid">
            <div className="dom-bar" style={{ width: `${(row.volume / maxVol) * 100}%` }} />
            <span className="dom-price">{fmtPrice(row.price, instrument?.digits ?? 5)}</span>
            <span className="dom-vol">{(row.volume / 1000).toFixed(1)}K</span>
            <span className="dom-depth">{(row.depth / 1000).toFixed(0)}K</span>
          </div>
        ))}
      </div>
    </div>
  );
}
