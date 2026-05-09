/**
 * File:        libs/trading-ui/src/panels/order-entry.tsx
 * Module:      trading-ui · Panels
 * Purpose:     Buy/sell ticket with market/limit/stop order types and SL/TP inputs.
 *
 * Exports:
 *   - OrderEntry({ instrument, prices, onTrade }) → ReactNode
 *
 * Depends on:
 *   - ../types/instrument — Instrument
 *   - ../lib/format-utils — fmt, fmtPrice
 *
 * Side-effects:
 *   - Calls onTrade with order payload on submit; no direct fetch
 *
 * Key invariants:
 *   - onTrade is the only output; the parent (TradingWorkstation) owns submission and toast feedback
 *   - Margin estimate is a client-side approximation only
 *
 * Read order:
 *   1. OrderEntry — component entry
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import type { Instrument } from '../types/instrument';
import { fmt, fmtPrice } from '../lib/format-utils';

type PriceMap = Record<string, Instrument>;

export function OrderEntry({
  instrument,
  prices,
  onTrade,
}: {
  instrument: Instrument | null;
  prices: PriceMap;
  onTrade: (payload: {
    side: 'buy' | 'sell';
    type: string;
    lots: string;
    sl: string;
    tp: string;
    price: string;
    instrument: Instrument | null;
  }) => void;
}) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [type, setType] = useState('Market');
  const [lots, setLots] = useState('1.00');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [price, setPrice] = useState('');

  const inst = (instrument && prices[instrument.symbol]) ?? instrument;
  const bid = inst?.bid ?? 0;
  const ask = inst?.ask ?? 0;
  const spread = inst?.spread ?? 0;
  const margin = (parseFloat(lots || '0') || 0) * ask * 10;

  return (
    <div className="order-entry">
      <div className="oe-tabs">
        <button type="button" className={`oe-tab buy ${side === 'buy' ? 'active' : ''}`} onClick={() => setSide('buy')}>
          ▲ BUY
        </button>
        <button type="button" className={`oe-tab sell ${side === 'sell' ? 'active' : ''}`} onClick={() => setSide('sell')}>
          ▼ SELL
        </button>
      </div>

      <div className="oe-body">
        <div className="oe-price-info">
          <div className="oe-price-info-item">
            <span className="oe-price-info-label">Bid</span>
            <span className="oe-price-info-val bear">{fmtPrice(bid, instrument?.digits ?? 5)}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="oe-price-info-label">Spread</div>
            <div className="oe-spread">{spread} pts</div>
          </div>
          <div className="oe-price-info-item">
            <span className="oe-price-info-label">Ask</span>
            <span className="oe-price-info-val bull">{fmtPrice(ask, instrument?.digits ?? 5)}</span>
          </div>
        </div>

        <div className="oe-row">
          <span className="oe-label">Order Type</span>
          <div className="oe-type-grid">
            {['Market', 'Limit', 'Stop'].map((t) => (
              <button key={t} type="button" className={`oe-type-btn ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="oe-row">
          <span className="oe-label">Volume (Lots)</span>
          <div className="oe-input-wrap">
            <input
              className="oe-input"
              type="number"
              value={lots}
              step="0.01"
              min="0.01"
              onChange={(e) => setLots(e.target.value)}
              aria-label="Volume in lots"
            />
            <div className="oe-step-btns">
              <button type="button" className="oe-step-btn" onClick={() => setLots((v) => (parseFloat(v) + 0.01).toFixed(2))}>
                ▲
              </button>
              <button
                type="button"
                className="oe-step-btn"
                onClick={() => setLots((v) => Math.max(0.01, parseFloat(v) - 0.01).toFixed(2))}
              >
                ▼
              </button>
            </div>
            <span className="oe-unit">LOT</span>
          </div>
        </div>

        {type !== 'Market' ? (
          <div className="oe-row">
            <span className="oe-label">Price</span>
            <div className="oe-input-wrap">
              <input
                className="oe-input"
                type="number"
                placeholder={fmtPrice(bid, instrument?.digits ?? 5)}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                aria-label="Order price"
              />
              <span className="oe-unit">{instrument?.symbol?.split('/')[1] ?? 'USD'}</span>
            </div>
          </div>
        ) : null}

        <div className="oe-sltp">
          <div className="oe-row">
            <span className="oe-label">Stop Loss</span>
            <div className="oe-input-wrap">
              <input className="oe-input" type="number" placeholder="0.00" value={sl} onChange={(e) => setSl(e.target.value)} />
            </div>
          </div>
          <div className="oe-row">
            <span className="oe-label">Take Profit</span>
            <div className="oe-input-wrap">
              <input className="oe-input" type="number" placeholder="0.00" value={tp} onChange={(e) => setTp(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="oe-margin-info">
          <span>Req. Margin</span>
          <span>${fmt(margin)}</span>
        </div>
        <div className="oe-margin-info">
          <span>Pip Value</span>
          <span>${((parseFloat(lots) || 0) * 10).toFixed(2)}</span>
        </div>

        <div className="oe-submit-row">
          <button
            type="button"
            className={`oe-submit ${side}`}
            onClick={() => onTrade({ side, type, lots, sl, tp, price, instrument })}
          >
            {side === 'buy' ? '▲ BUY' : '▼ SELL'} {type.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
