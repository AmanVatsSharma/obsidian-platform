/**
 * File:        apps/dealer-workstation/src/components/right-rail/quote-desk.tsx
 * Module:      dealer-workstation · Right Rail
 * Purpose:     Manual quote desk — symbol selector, live bid/ask display, spread preset
 *              quick-buttons (-0.5/NORMAL/+0.5/+2/+5 pips), AFFECT scope dropdown,
 *              fine-tune pip inputs, PUSH QUOTE, and REVERT TO MARKET button.
 *
 * Exports:
 *   - QuoteDesk() — manual quoting panel
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { useDeskData } from '../../lib/mock-data-context';

const SYMBOLS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'BTC/USD', 'US500'];
const SPREAD_PRESETS: { label: string; pips: number }[] = [
  { label: '-0.5',   pips: -0.5 },
  { label: 'NORMAL', pips:  0   },
  { label: '+0.5',   pips:  0.5 },
  { label: '+2',     pips:  2   },
  { label: '+5',     pips:  5   },
];
const AFFECT_OPTIONS = ['SELECTED', 'ALL SYMBOLS', 'FX ONLY', 'METALS ONLY'];

function fmtPrice(symbol: string, price: number): string {
  if (symbol.includes('JPY') || symbol === 'XAU/USD') return price.toFixed(3);
  if (symbol === 'BTC/USD' || symbol === 'US500')      return price.toFixed(1);
  return price.toFixed(5);
}

export function QuoteDesk() {
  const { instruments, addToast } = useDeskData();
  const [symbol,       setSymbol]       = useState('EUR/USD');
  const [spreadAdj,    setSpreadAdj]    = useState(0);   // in pips, symmetric
  const [bidAdj,       setBidAdj]       = useState('0'); // fine-tune on top of spreadAdj
  const [askAdj,       setAskAdj]       = useState('0');
  const [affect,       setAffect]       = useState('SELECTED');
  const [pushed,       setPushed]       = useState(false);

  const inst     = instruments.find(i => i.symbol === symbol)!;
  const pipVal   = inst?.pip ?? 0.0001;
  // spread preset: half-pip off bid, half-pip on ask
  const adjBid   = inst ? inst.bid + parseFloat(bidAdj || '0') * pipVal - (spreadAdj / 2) * pipVal : 0;
  const adjAsk   = inst ? inst.ask + parseFloat(askAdj || '0') * pipVal + (spreadAdj / 2) * pipVal : 0;

  function selectPreset(pips: number) {
    setSpreadAdj(pips);
    setBidAdj('0');
    setAskAdj('0');
  }

  function revert() {
    setSpreadAdj(0);
    setBidAdj('0');
    setAskAdj('0');
  }

  function pushQuote() {
    setPushed(true);
    const scope = affect === 'SELECTED' ? symbol : affect;
    addToast({ type: 'info', icon: '📡', title: 'Quote Pushed', msg: `${scope}: ${fmtPrice(symbol, adjBid)} / ${fmtPrice(symbol, adjAsk)}` });
    setTimeout(() => setPushed(false), 1500);
  }

  return (
    <div>
      <div className="right-title">QUOTE DESK</div>

      {/* Symbol selector */}
      <select
        value={symbol}
        onChange={e => { setSymbol(e.target.value); revert(); }}
        style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '4px 8px', fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg1)', marginBottom: 8 }}
      >
        {SYMBOLS.map(s => <option key={s}>{s}</option>)}
      </select>

      {/* Live bid/ask */}
      {inst && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--bear)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>BID</div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 16, fontWeight: 700, color: 'var(--fg1)' }}>{fmtPrice(symbol, adjBid)}</div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--bull)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>ASK</div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 16, fontWeight: 700, color: 'var(--fg1)' }}>{fmtPrice(symbol, adjAsk)}</div>
          </div>
        </div>
      )}

      {/* Spread preset buttons */}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>SPREAD PRESET</div>
      <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
        {SPREAD_PRESETS.map(p => {
          const active = spreadAdj === p.pips && bidAdj === '0' && askAdj === '0';
          const isNormal = p.pips === 0;
          const isNarrow = p.pips < 0;
          const color = isNormal ? 'var(--fg2)' : isNarrow ? 'var(--bull)' : 'var(--warn)';
          return (
            <button
              key={p.label}
              onClick={() => selectPreset(p.pips)}
              style={{
                flex: 1, padding: '3px 2px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-data)', fontSize: 9,
                fontWeight: 700, cursor: 'pointer', textAlign: 'center', textTransform: 'uppercase',
                border: `1px solid ${active ? color : 'var(--border)'}`,
                background: active ? (isNormal ? 'var(--bg-elevated)' : isNarrow ? 'rgba(16,217,150,0.1)' : 'rgba(245,158,11,0.1)') : 'var(--bg-panel)',
                color: active ? color : 'var(--fg3)',
                transition: 'all 0.12s',
              }}
            >{p.label}</button>
          );
        })}
      </div>

      {/* AFFECT scope */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>AFFECT</div>
        <select
          value={affect}
          onChange={e => setAffect(e.target.value)}
          style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '3px 6px', fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg1)' }}
        >
          {AFFECT_OPTIONS.map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      {/* Fine-tune pip inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
        {([['BID ADJ', bidAdj, setBidAdj], ['ASK ADJ', askAdj, setAskAdj]] as const).map(([label, val, setter]) => (
          <div key={label}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{label} (pips)</div>
            <input
              type="number"
              value={val}
              onChange={e => setter(e.target.value)}
              step="0.1"
              style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '4px 8px', fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg1)', boxSizing: 'border-box' }}
            />
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={pushQuote}
          style={{ flex: 2, padding: '7px 0', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid', transition: 'all var(--dur-fast)', letterSpacing: '0.05em', borderColor: pushed ? 'var(--bull)' : 'var(--accent)', background: pushed ? 'rgba(16,217,150,0.12)' : 'var(--accent-dim)', color: pushed ? 'var(--bull)' : 'var(--accent)' }}
        >{pushed ? '✓ PUSHED' : 'PUSH QUOTE'}</button>
        <button
          onClick={revert}
          style={{ flex: 1, padding: '7px 0', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--fg3)', letterSpacing: '0.04em', transition: 'all var(--dur-fast)' }}
        >REVERT</button>
      </div>
    </div>
  );
}
