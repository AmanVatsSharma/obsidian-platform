/**
 * File:        components/order-entry.tsx
 * Module:      web-trading
 * Purpose:     Buy/sell ticket with full order type support (Market/Limit/Stop/GTT/Trailing/Stop/Iceberg/TWAP/VWAP) and bracket orders.
 *
 * Exports:
 *   - OrderEntry — full order ticket with progressive disclosure for conditional/algo types
 *
 * Depends on:
 *   - @/features/trading-terminal/lib/types — Instrument, OrderTypeExtended, TradePayload
 *   - @/features/trading-terminal/lib/format-utils — fmt, fmtPrice
 *
 * Side-effects: none (pure UI component, onTrade callback handles API submit)
 *
 * Key invariants:
 *   - Bracket section always visible; bracket submit fires when sl OR tp is filled
 *   - GTT requires triggerPrice + triggerCondition
 *   - TWAP/VWAP require slices (1–50) + duration (1–480 min)
 *
 * Read order:
 *   1. State declarations — all form fields
 *   2. Conditional field groups — GTT / Trailing / Iceberg / TWAP-VWAP
 *   3. Submit handler — routes to onTrade with full TradePayload
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

'use client';

import { useState } from 'react';
import type { Instrument, OrderTypeExtended, TriggerCondition } from '../lib/types';
import { fmt, fmtPrice } from '../lib/format-utils';
import { submitOrderToOms, submitBracketOrderToOms } from '../lib/workstation-api';

type PriceMap = Record<string, Instrument>;

const ORDER_TYPES: { label: string; value: OrderTypeExtended }[] = [
  { label: 'Market', value: 'MARKET' },
  { label: 'Limit', value: 'LIMIT' },
  { label: 'Stop', value: 'STOP' },
  { label: 'GTT', value: 'GTT' },
  { label: 'Trailing', value: 'TRAILING_STOP' },
  { label: 'Iceberg', value: 'ICEBERG' },
  { label: 'TWAP', value: 'TWAP' },
  { label: 'VWAP', value: 'VWAP' },
];

export function OrderEntry({
  instrument,
  prices,
  fetchJson,
  accountId,
  onTrade,
}: {
  instrument: Instrument | null;
  prices: PriceMap;
  fetchJson?: (path: string, init?: RequestInit) => Promise<unknown>;
  accountId?: string;
  onTrade: (payload: {
    side: 'buy' | 'sell';
    type: OrderTypeExtended;
    lots: string;
    sl: string;
    tp: string;
    price: string;
    instrument: Instrument | null;
    triggerPrice?: string;
    triggerCondition?: TriggerCondition;
    trailingDistance?: string;
    trailingPct?: string;
    displayQty?: string;
    slices?: number;
    durationMinutes?: number;
  }) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [type, setType] = useState<OrderTypeExtended>('MARKET');
  const [lots, setLots] = useState('1.00');
  const [price, setPrice] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');

  // GTT
  const [triggerPrice, setTriggerPrice] = useState('');
  const [triggerCondition, setTriggerCondition] = useState<TriggerCondition>('ABOVE');

  // Trailing
  const [trailingDistance, setTrailingDistance] = useState('');
  const [trailingPct, setTrailingPct] = useState('');

  // Iceberg
  const [displayQty, setDisplayQty] = useState('');

  // TWAP / VWAP
  const [slices, setSlices] = useState('10');
  const [durationMinutes, setDurationMinutes] = useState('30');

  const inst = (instrument && prices[instrument.symbol]) ?? instrument;
  const bid = inst?.bid ?? 0;
  const ask = inst?.ask ?? 0;
  const spread = inst?.spread ?? 0;
  const margin = (parseFloat(lots || '0') || 0) * ask * 10;
  const digits = instrument?.digits ?? 5;

  const handleSubmit = async () => {
    const payload = {
      side,
      type,
      lots,
      sl,
      tp,
      price,
      instrument,
      ...(type === 'GTT' && triggerPrice ? { triggerPrice, triggerCondition } : {}),
      ...(type === 'TRAILING_STOP' && (trailingDistance || trailingPct)
        ? { trailingDistance: trailingDistance || undefined, trailingPct: trailingPct || undefined }
        : {}),
      ...(type === 'ICEBERG' && displayQty ? { displayQty } : {}),
      ...((type === 'TWAP' || type === 'VWAP') && slices && durationMinutes
        ? { slices: parseInt(slices, 10), durationMinutes: parseInt(durationMinutes, 10) }
        : {}),
    };

    const hasBracket = Boolean(payload.sl || payload.tp);

    if (!fetchJson) {
      onTrade(payload as Parameters<typeof onTrade>[0]);
      return;
    }

    try {
      let result;
      if (hasBracket) {
        result = await submitBracketOrderToOms(fetchJson, {
          ...payload,
          triggerCondition,
          trailingDistance,
          trailingPct,
          displayQty,
          slices: parseInt(slices, 10),
          durationMinutes: parseInt(durationMinutes, 10),
        });
      } else {
        result = await submitOrderToOms(fetchJson, payload);
      }
      if (result.ok === false) {
        setError(result.message || 'Order submission failed');
        return;
      }
      setError(null);
      onTrade(payload as Parameters<typeof onTrade>[0]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Submission failed: ${msg}`);
    }
  };

  return (
    <div className="order-entry">
      {/* ── Side Tabs ──────────────────────────────────────────────── */}
      <div className="oe-tabs">
        <button
          type="button"
          className={`oe-tab buy ${side === 'buy' ? 'active' : ''}`}
          onClick={() => setSide('buy')}
        >
          ▲ BUY
        </button>
        <button
          type="button"
          className={`oe-tab sell ${side === 'sell' ? 'active' : ''}`}
          onClick={() => setSide('sell')}
        >
          ▼ SELL
        </button>
      </div>

      <div className="oe-body">
        {/* ── Bid/Ask info ─────────────────────────────────────────── */}
        <div className="oe-price-info">
          <div className="oe-price-info-item">
            <span className="oe-price-info-label">Bid</span>
            <span className="oe-price-info-val bear">{fmtPrice(bid, digits)}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="oe-price-info-label">Spread</div>
            <div className="oe-spread">{spread} pts</div>
          </div>
          <div className="oe-price-info-item">
            <span className="oe-price-info-label">Ask</span>
            <span className="oe-price-info-val bull">{fmtPrice(ask, digits)}</span>
          </div>
        </div>

        {/* ── Order Type ───────────────────────────────────────────── */}
        <div className="oe-row">
          <span className="oe-label">Order Type</span>
          <div className="oe-type-grid">
            {ORDER_TYPES.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                className={`oe-type-btn ${type === value ? 'active' : ''}`}
                onClick={() => setType(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Volume ───────────────────────────────────────────────── */}
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

        {/* ── Price (conditional: non-Market) ─────────────────────── */}
        {type !== 'MARKET' && (
          <div className="oe-row">
            <span className="oe-label">Price</span>
            <div className="oe-input-wrap">
              <input
                className="oe-input"
                type="number"
                placeholder={fmtPrice(bid, digits)}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                aria-label="Order price"
              />
              <span className="oe-unit">{instrument?.symbol?.split('/')[1] ?? 'USD'}</span>
            </div>
          </div>
        )}

        {/* ── GTT Fields ────────────────────────────────────────────── */}
        {type === 'GTT' && (
          <>
            <div className="oe-row">
              <span className="oe-label">Trigger Price</span>
              <div className="oe-input-wrap">
                <input
                  className="oe-input"
                  type="number"
                  placeholder="0.00"
                  value={triggerPrice}
                  onChange={(e) => setTriggerPrice(e.target.value)}
                  aria-label="GTT trigger price"
                />
              </div>
            </div>
            <div className="oe-row">
              <span className="oe-label">Trigger Condition</span>
              <div className="oe-type-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <button
                  type="button"
                  className={`oe-type-btn ${triggerCondition === 'ABOVE' ? 'active' : ''}`}
                  onClick={() => setTriggerCondition('ABOVE')}
                >
                  ABOVE
                </button>
                <button
                  type="button"
                  className={`oe-type-btn ${triggerCondition === 'BELOW' ? 'active' : ''}`}
                  onClick={() => setTriggerCondition('BELOW')}
                >
                  BELOW
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Trailing Stop Fields ─────────────────────────────────── */}
        {type === 'TRAILING_STOP' && (
          <>
            <div className="oe-row">
              <span className="oe-label">Trail Distance</span>
              <div className="oe-input-wrap">
                <input
                  className="oe-input"
                  type="number"
                  placeholder="0.00"
                  value={trailingDistance}
                  onChange={(e) => setTrailingDistance(e.target.value)}
                  aria-label="Trailing distance"
                />
              </div>
            </div>
            <div className="oe-row">
              <span className="oe-label">Trail %</span>
              <div className="oe-input-wrap">
                <input
                  className="oe-input"
                  type="number"
                  placeholder="e.g. 0.5"
                  value={trailingPct}
                  onChange={(e) => setTrailingPct(e.target.value)}
                  aria-label="Trailing percentage"
                />
              </div>
            </div>
          </>
        )}

        {/* ── Iceberg Fields ───────────────────────────────────────── */}
        {type === 'ICEBERG' && (
          <div className="oe-row">
            <span className="oe-label">Display Qty</span>
            <div className="oe-input-wrap">
              <input
                className="oe-input"
                type="number"
                placeholder="0.00"
                value={displayQty}
                onChange={(e) => setDisplayQty(e.target.value)}
                aria-label="Iceberg display quantity"
              />
            </div>
          </div>
        )}

        {/* ── TWAP / VWAP Fields ───────────────────────────────────── */}
        {(type === 'TWAP' || type === 'VWAP') && (
          <>
            <div className="oe-row">
              <span className="oe-label">Slices</span>
              <div className="oe-input-wrap">
                <input
                  className="oe-input"
                  type="number"
                  placeholder="1–50"
                  value={slices}
                  min="1"
                  max="50"
                  onChange={(e) => setSlices(e.target.value)}
                  aria-label="Number of TWAP/VWAP slices"
                />
              </div>
            </div>
            <div className="oe-row">
              <span className="oe-label">Duration (min)</span>
              <div className="oe-input-wrap">
                <input
                  className="oe-input"
                  type="number"
                  placeholder="1–480"
                  value={durationMinutes}
                  min="1"
                  max="480"
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  aria-label="TWAP/VWAP duration in minutes"
                />
              </div>
            </div>
          </>
        )}

        {/* ── Bracket SL/TP (always visible) ────────────────────────── */}
        <div className="oe-sltp">
          <div className="oe-row">
            <span className="oe-label">Stop Loss</span>
            <div className="oe-input-wrap">
              <input
                className="oe-input"
                type="number"
                placeholder="0.00"
                value={sl}
                onChange={(e) => setSl(e.target.value)}
                aria-label="Stop Loss"
              />
            </div>
          </div>
          <div className="oe-row">
            <span className="oe-label">Take Profit</span>
            <div className="oe-input-wrap">
              <input
                className="oe-input"
                type="number"
                placeholder="0.00"
                value={tp}
                onChange={(e) => setTp(e.target.value)}
                aria-label="Take Profit"
              />
            </div>
          </div>
        </div>

        {/* ── Margin info ───────────────────────────────────────────── */}
        <div className="oe-margin-info">
          <span>Req. Margin</span>
          <span className="font-mono">${fmt(margin)}</span>
        </div>
        <div className="oe-margin-info">
          <span>Pip Value</span>
          <span className="font-mono">${((parseFloat(lots) || 0) * 10).toFixed(2)}</span>
        </div>

        {/* ── Error display ───────────────────────────────────────────── */}
        {error && <div className="oe-error">{error}</div>}

        {/* ── Submit ────────────────────────────────────────────────── */}
        <div className="oe-submit-row">
          <button type="button" className={`oe-submit ${side}`} onClick={async () => { await handleSubmit(); }}>
            {side === 'buy' ? '▲ BUY' : '▼ SELL'} {type}
          </button>
        </div>
      </div>
    </div>
  );
}
