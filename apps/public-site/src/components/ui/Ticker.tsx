/**
 * File:        apps/public-site/src/components/ui/Ticker.tsx
 * Module:      public-site · UI Primitives
 * Purpose:     Horizontally scrolling live-price ticker strip. Duplicates the
 *              instrument list to create a seamless infinite scroll effect via
 *              CSS animation. Each price updates every 1.2s via setInterval.
 *
 * Exports:
 *   - Ticker()   — standalone ticker bar with live price simulation
 *
 * Depends on:
 *   - @/lib/data  — INST (instrument list)
 *
 * Side-effects:
 *   - setInterval (1200ms) — price random walk; clears on unmount
 *
 * Key invariants:
 *   - The track renders instruments twice ([0,1].flatMap) so the CSS
 *     translateX(-50%) loop never shows a gap at the seam
 *   - Flash classes (fb-bull / fb-bear) are applied for 480ms then cleared
 *
 * Read order:
 *   1. PriceState type — the per-instrument state shape
 *   2. Ticker — main component
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { INST, type Instrument } from '@/lib/data';

interface PriceState {
  bid: number;
  ch: number;
  up: boolean;
  flash: 'bull' | 'bear' | null;
}

function TickerItem({ inst, price }: { inst: Instrument; price: PriceState }) {
  const fc = price.flash === 'bull' ? 'fb-bull' : price.flash === 'bear' ? 'fb-bear' : '';
  return (
    <div className="ticker-item" data-price>
      <span className="t-sym">{inst.lbl}</span>
      <span className={`t-price ${fc}`} style={{ fontFamily: 'var(--font-data)', fontVariantNumeric: 'tabular-nums' }}>
        {price.bid.toFixed(inst.dg)}
      </span>
      <span className={`t-ch ${price.up ? 'up' : 'dn'}`} style={{ fontFamily: 'var(--font-data)', fontSize: 10 }}>
        {price.up ? '▲ +' : '▼ '}{Math.abs(price.ch).toFixed(2)}%
      </span>
    </div>
  );
}

export function Ticker() {
  const [prices, setPrices] = useState<Record<string, PriceState>>(() =>
    INST.reduce((acc, i) => ({ ...acc, [i.id]: { bid: i.bid, ch: i.ch, up: i.up, flash: null } }), {}),
  );
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;

    const iv = setInterval(() => {
      if (!alive.current) return;

      setPrices((prev) => {
        const next = { ...prev };
        INST.forEach((inst) => {
          const dir = Math.random() > 0.5 ? 1 : -1;
          const nb = +(prev[inst.id].bid + dir * inst.pip * (1 + Math.random() * 4)).toFixed(inst.dg);
          const nc = +(prev[inst.id].ch + (Math.random() - 0.5) * 0.03).toFixed(2);
          next[inst.id] = { bid: nb, ch: nc, up: nc >= 0, flash: dir > 0 ? 'bull' : 'bear' };
        });
        return next;
      });

      setTimeout(() => {
        if (!alive.current) return;
        setPrices((p) => {
          const n = { ...p };
          INST.forEach((i) => { n[i.id] = { ...p[i.id], flash: null }; });
          return n;
        });
      }, 480);
    }, 1200);

    return () => {
      alive.current = false;
      clearInterval(iv);
    };
  }, []);

  return (
    <div className="ticker-wrap">
      <div className="ticker-fade-l" />
      <div className="ticker-fade-r" />
      <div className="ticker-track">
        {[0, 1].flatMap((copy) =>
          INST.map((inst) => (
            <TickerItem key={`${copy}-${inst.id}`} inst={inst} price={prices[inst.id]} />
          )),
        )}
      </div>
    </div>
  );
}
