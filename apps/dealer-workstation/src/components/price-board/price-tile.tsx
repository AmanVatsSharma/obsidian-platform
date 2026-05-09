/**
 * File:        apps/dealer-workstation/src/components/price-board/price-tile.tsx
 * Module:      dealer-workstation · Price Board
 * Purpose:     Single instrument price tile — Bloomberg-style big-digit bid/ask with flash
 *              animation, 30-tick sparkline, H/L/volume footer, spread, and L/S ratio bar.
 *
 * Exports:
 *   - PriceTile({ instrument, bookPosition }) — one price tile (min-width 220px)
 *
 * Key invariants:
 *   - Flash direction detected via useRef prev-bid comparison — no re-render cost
 *   - Last 2 price digits rendered at 22px (Bloomberg big-digit convention); rest at 18px
 *   - Sparkline seeded with 30 copies of initial bid; each price tick appends and shifts
 *   - Spread multiplier from DeskContext scales displayed spread only (not real fills)
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { BookPosition, Instrument } from '../../lib/types';
import { useDeskData } from '../../lib/mock-data-context';
import { Sparkline } from '../shared/sparkline';

interface PriceTileProps {
  instrument: Instrument;
  bookPosition: BookPosition | undefined;
}

function formatPrice(symbol: string, price: number): string {
  if (symbol === 'XAU/USD') return price.toFixed(2);
  if (symbol === 'BTC/USD') return price.toFixed(1);
  if (symbol === 'US500')   return price.toFixed(1);
  if (symbol.includes('JPY')) return price.toFixed(3);
  return price.toFixed(5);
}

/** Bloomberg big-digit: last 2 chars at 22px, rest at 18px */
function BigDigitPrice({ symbol, price }: { symbol: string; price: number }) {
  const str = formatPrice(symbol, price);
  const body = str.slice(0, -2);
  const big  = str.slice(-2);
  return (
    <span style={{ fontFamily: 'var(--font-data)', fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
      <span style={{ fontSize: 18, color: 'var(--fg1)' }}>{body}</span>
      <span style={{ fontSize: 22, color: 'var(--fg1)' }}>{big}</span>
    </span>
  );
}

function calcSpreadPips(inst: Instrument, multiplier: number): string {
  const raw = (inst.ask - inst.bid) / inst.pip;
  return (raw * multiplier).toFixed(1);
}

export function PriceTile({ instrument: inst, bookPosition: bp }: PriceTileProps) {
  const { spreadMultiplier } = useDeskData();
  const prevBid = useRef(inst.bid);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [ticks, setTicks] = useState<number[]>(() => Array(30).fill(inst.bid));

  useEffect(() => {
    if (inst.bid !== prevBid.current) {
      const dir = inst.bid > prevBid.current ? 'up' : 'down';
      prevBid.current = inst.bid;
      setFlash(dir);
      setTicks(t => [...t.slice(1), inst.bid]);
      const timer = setTimeout(() => setFlash(null), 400);
      return () => clearTimeout(timer);
    }
  }, [inst.bid]);

  const net     = (bp?.longLots ?? 0) - (bp?.shortLots ?? 0);
  const longPct = bp ? (bp.longLots / (bp.longLots + bp.shortLots)) * 100 : 50;
  const spreadPips = calcSpreadPips(inst, spreadMultiplier);
  const changePos  = inst.change >= 0;
  const volK = (inst.volume / 1000).toFixed(1);

  return (
    <div style={{ minWidth: 220, flexShrink: 0, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', transition: 'background 0.1s' }}>

      {/* Tile header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px 5px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--fg1)', cursor: 'pointer' }}>{inst.symbol}</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(16,217,150,0.1)', color: 'var(--bull)', border: '1px solid rgba(16,217,150,0.3)' }}>
            {inst.routing}
          </span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(59,130,246,0.3)' }}>
            {inst.bookRouting}-BK
          </span>
        </div>
      </div>

      {/* Bid/Ask — big-digit Bloomberg style */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '4px 6px', gap: 4, flex: 1 }}>
        {/* BID · SELL */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 8px', borderRadius: 'var(--r-sm)', cursor: 'pointer', background: flash === 'down' ? 'rgba(255,59,92,0.12)' : 'var(--bg-elevated)', border: `1px solid ${flash === 'down' ? 'rgba(255,59,92,0.3)' : 'var(--border)'}`, transition: 'all 0.15s' }}>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, color: 'var(--bear)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>BID · SELL</div>
          <BigDigitPrice symbol={inst.symbol} price={inst.bid} />
        </div>

        {/* ASK · BUY */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 8px', borderRadius: 'var(--r-sm)', cursor: 'pointer', background: flash === 'up' ? 'rgba(16,217,150,0.12)' : 'var(--bg-elevated)', border: `1px solid ${flash === 'up' ? 'rgba(16,217,150,0.3)' : 'var(--border)'}`, transition: 'all 0.15s' }}>
          <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, color: 'var(--bull)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>ASK · BUY</div>
          <BigDigitPrice symbol={inst.symbol} price={inst.ask} />
        </div>
      </div>

      {/* Footer: H/L + change% row, then spread + volume */}
      <div style={{ padding: '5px 10px', borderTop: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)' }}>
            H: <span style={{ color: 'var(--fg2)' }}>{formatPrice(inst.symbol, inst.high)}</span>
            {'  '}L: <span style={{ color: 'var(--fg2)' }}>{formatPrice(inst.symbol, inst.low)}</span>
          </span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 600, color: changePos ? 'var(--bull)' : 'var(--bear)' }}>
            {changePos ? '+' : ''}{inst.change}%
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)' }}>
            Spd: <span style={{ color: 'var(--warn)', fontWeight: 600 }}>{spreadPips}pts</span>
          </span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)' }}>
            Vol: <span style={{ color: 'var(--fg2)' }}>{volK}K</span>
          </span>
        </div>
      </div>

      {/* Long/short ratio bar */}
      {bp && (
        <div style={{ padding: '0 10px 4px' }}>
          <div style={{ height: 4, background: 'rgba(255,59,92,0.3)', borderRadius: 2, overflow: 'hidden', marginBottom: 2 }}>
            <div style={{ height: '100%', background: 'var(--bull)', borderRadius: 2, width: `${longPct}%`, transition: 'width 0.5s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-data)', fontSize: 9 }}>
            <span style={{ color: 'var(--bull)' }}>▲ {longPct.toFixed(0)}% LONG</span>
            <span style={{ color: 'var(--bear)' }}>▼ {(100 - longPct).toFixed(0)}% SHORT</span>
          </div>
        </div>
      )}

      {/* Sparkline — 30-tick price history */}
      <div style={{ padding: '0 10px 8px' }}>
        <Sparkline ticks={ticks} bullish={changePos} />
      </div>
    </div>
  );
}
