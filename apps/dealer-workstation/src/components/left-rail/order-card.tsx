/**
 * File:        apps/dealer-workstation/src/components/left-rail/order-card.tsx
 * Module:      dealer-workstation · Left Rail
 * Purpose:     Individual pending order card with Accept / Reject / Requote actions and
 *              an inline requote price input panel. Color-coded by age (new/warn/old) and tier.
 *              Accept flashes green then slides out; Reject flashes red then slides out.
 *
 * Exports:
 *   - OrderCard({ order, focused, onAccept, onReject, onRequote }) — single order card
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import type { PendingOrder } from '../../lib/types';
import { useDeskData } from '../../lib/mock-data-context';

interface OrderCardProps {
  order: PendingOrder;
  focused: boolean;
  onAccept: () => void;
  onReject: () => void;
  onRequote: (price: number) => void;
}

function fmtMoney(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPrice(symbol: string, price: number): string {
  if (symbol.includes('JPY') || symbol === 'XAU/USD') return price.toFixed(3);
  if (symbol === 'BTC/USD' || symbol === 'US500') return price.toFixed(1);
  return price.toFixed(5);
}

export function OrderCard({ order, focused, onAccept, onReject, onRequote }: OrderCardProps) {
  const [showRequote, setShowRequote] = useState(false);
  const [requotePrice, setRequotePrice] = useState(String(order.clientPrice));
  const [flashing, setFlashing] = useState<'accept' | 'reject' | null>(null);
  const { orderAges } = useDeskData();

  function handleAccept() {
    setFlashing('accept');
    setTimeout(onAccept, 360);
  }
  function handleReject() {
    setFlashing('reject');
    setTimeout(onReject, 360);
  }

  const age = orderAges[order.id] ?? order.age;
  const ageClass = age < 2 ? 'new' : age < 4 ? 'mid' : 'old';
  const ageColor = ageClass === 'new' ? 'var(--bull)' : ageClass === 'mid' ? 'var(--warn)' : 'var(--bear)';
  const tierEl = order.tier === 'VIP' ? <span className="tier-vip">{order.tier}</span>
               : order.tier === 'PRO' ? <span className="tier-pro">{order.tier}</span>
               : <span className="tier-retail">{order.tier}</span>;
  const isLargeNotional = order.notional >= 1_000_000;

  return (
    <div
      style={{
        position: 'relative', borderBottom: '1px solid var(--border)',
        background: flashing === 'accept' ? 'rgba(16,217,150,0.15)' : flashing === 'reject' ? 'rgba(255,59,92,0.15)' : focused ? 'var(--bg-active)' : 'var(--bg-surface)',
        padding: '8px 10px', cursor: 'pointer',
        outline: flashing === 'accept' ? '1px solid rgba(16,217,150,0.5)' : flashing === 'reject' ? '1px solid rgba(255,59,92,0.5)' : focused ? '1px solid var(--accent-dim)' : 'none',
        transition: 'background 0.18s, outline 0.18s',
        animation: 'slideInTop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Left age bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: ageColor, transition: 'background 0.3s' }} />

      {/* Row 1: client + tier + age */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, paddingLeft: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--fg1)' }}>
          {order.clientName}
          {tierEl}
        </div>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: age >= 4 ? 'var(--bear)' : age >= 2 ? 'var(--warn)' : 'var(--fg3)', fontWeight: age >= 2 ? 700 : 400, animation: age >= 4 ? 'blink 1s infinite' : undefined }}>
          {age < 10 ? age.toFixed(1) : Math.round(age).toFixed(0)}s ▲
        </span>
      </div>

      {/* Row 2: side + symbol + lots + type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '4px 0', paddingLeft: 6 }}>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 13, fontWeight: 700, minWidth: 32, color: order.side === 'BUY' ? 'var(--bull)' : 'var(--bear)' }}>
          {order.side === 'BUY' ? '▲ BUY' : '▼ SELL'}
        </span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 13, fontWeight: 600, color: 'var(--fg1)', flex: 1 }}>{order.symbol}</span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 14, fontWeight: 700, color: 'var(--fg1)' }}>
          {order.lots.toFixed(2)} <span style={{ fontSize: 10, color: 'var(--fg3)' }}>lots</span>
        </span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 2, padding: '1px 4px' }}>
          {order.type}
        </span>
      </div>

      {/* Row 3: notional + meta */}
      <div style={{ paddingLeft: 6 }}>
        <div style={{ fontFamily: 'var(--font-data)', fontSize: 12, fontWeight: 600, color: isLargeNotional ? 'var(--gold)' : 'var(--fg2)', marginBottom: 3 }}>
          {fmtMoney(order.notional)}
        </div>
        <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)', lineHeight: 1.6, marginBottom: 5 }}>
          MKT: <span style={{ color: 'var(--fg2)' }}>{fmtPrice(order.symbol, order.marketPrice)}</span>
          {'  '}CLT: <span style={{ color: 'var(--fg2)' }}>{fmtPrice(order.symbol, order.clientPrice)}</span>
          {'  '}SLP: <span style={{ color: order.slippage >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
            {order.slippage >= 0 ? '+' : ''}{order.slippage}
          </span>
        </div>
      </div>

      {/* Requote inline panel */}
      {showRequote && (
        <div style={{ marginBottom: 6, padding: 8, background: 'var(--bg-elevated)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 'var(--r-sm)', animation: 'slideInTop 0.2s' }}>
          <input
            value={requotePrice}
            onChange={e => setRequotePrice(e.target.value)}
            style={{ width: '100%', padding: '4px 8px', fontSize: 13, marginBottom: 6 }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => { onRequote(parseFloat(requotePrice)); setShowRequote(false); }}
              style={{ flex: 1, padding: '4px', borderRadius: 'var(--r-sm)', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)', color: 'var(--warn)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
            >
              SEND
            </button>
            <button
              onClick={() => setShowRequote(false)}
              style={{ flex: 1, padding: '4px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--fg3)', fontFamily: 'var(--font-data)', fontSize: 10, cursor: 'pointer', textTransform: 'uppercase' }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { label: 'ACCEPT',  key: 'A', color: 'var(--bull)', action: handleAccept },
          { label: 'REJECT',  key: 'R', color: 'var(--bear)', action: handleReject },
          { label: 'REQUOTE', key: 'Q', color: 'var(--warn)', action: () => setShowRequote(v => !v) },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.action}
            style={{ flex: 1, padding: '5px 4px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, border: `1px solid rgba(${btn.color === 'var(--bull)' ? '16,217,150' : btn.color === 'var(--bear)' ? '255,59,92' : '245,158,11'},0.35)`, background: 'var(--bg-elevated)', color: btn.color, cursor: 'pointer', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.12s' }}
          >
            {btn.label}
            <span style={{ fontSize: 8, color: 'var(--fg4)', display: 'block', marginTop: 1 }}>{btn.key}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
