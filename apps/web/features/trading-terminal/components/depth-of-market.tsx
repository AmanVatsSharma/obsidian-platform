/**
 * @file depth-of-market.tsx
 * @module web-trading
 * @description Depth ladder (mock refresh) for bid/ask volume walls.
 * @author BharatERP
 * @created 2026-04-03
 */

'use client';

import { useEffect, useState } from 'react';
import type { Instrument } from '../lib/types';
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

export function DepthOfMarket({ instrument }: { instrument: Instrument | null }) {
  const [dom, setDom] = useState(() => domForInstrument(instrument));
  useEffect(() => {
    const iv = setInterval(() => setDom(domForInstrument(instrument)), 800);
    return () => clearInterval(iv);
  }, [instrument?.symbol, instrument?.bid]);

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
