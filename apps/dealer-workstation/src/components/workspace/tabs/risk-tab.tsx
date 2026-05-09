/**
 * File:        apps/dealer-workstation/src/components/workspace/tabs/risk-tab.tsx
 * Module:      dealer-workstation · Workspace
 * Purpose:     Risk tab — 6 donut gauge rings for per-symbol limit utilisation,
 *              P&L attribution stacked bar (Trading/Spread Capture/Hedging/Other),
 *              stress test table, top clients, and editable Risk Config panel.
 *
 * Exports:
 *   - RiskTab() — risk management panel
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { useDeskData } from '../../../lib/mock-data-context';
import { GaugeRing } from '../../shared/gauge-ring';

function fmtMoney(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

const STRESS_SCENARIOS = [
  { name: '1% Move',    eur: -12400, gbp: -8200,  jpy: +4800,  xau: -18600,  btc: +2100,  us5: +9400  },
  { name: '2% Move',    eur: -24800, gbp: -16400, jpy: +9600,  xau: -37200,  btc: +4200,  us5: +18800 },
  { name: 'Flash Crash',eur: -84000, gbp: -41000, jpy: +28000, xau: -110000, btc: -48000, us5: +62000 },
];

const PNL_SEGMENTS = [
  { label: 'TRADING',        pct: 44, color: 'var(--accent)',  value: '+$8,420' },
  { label: 'SPREAD CAPTURE', pct: 31, color: 'var(--bull)',    value: '+$5,914' },
  { label: 'HEDGING',        pct: 18, color: 'var(--purple)',  value: '+$3,441' },
  { label: 'OTHER',          pct:  7, color: 'var(--fg3)',     value: '+$1,072' },
];

export function RiskTab() {
  const { bookPositions, instruments, clients } = useDeskData();
  const [riskConfig, setRiskConfig] = useState({
    maxDrawdown:        '15',
    marginCallLevel:    '30',
    positionLimit:      '5000000',
    autoHedgeThreshold: '80',
  });
  const [saved, setSaved] = useState(false);

  function saveConfig() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const gauges = bookPositions.map(b => {
    const inst    = instruments.find(i => i.symbol === b.symbol);
    const current = inst?.bid ?? b.current;
    const net     = Math.abs(b.longLots - b.shortLots);
    const netUsd  = net * (b.symbol === 'XAU/USD' ? current * 100 : b.symbol === 'US500' ? current * 10 : b.symbol === 'BTC/USD' ? current : 100000);
    const limitUsd = b.limit * (b.symbol === 'XAU/USD' ? current * 100 : b.symbol === 'US500' ? current * 10 : b.symbol === 'BTC/USD' ? current : 100000);
    const pct = Math.round((netUsd / limitUsd) * 100);
    return { symbol: b.symbol, pct: Math.min(pct, 100), used: fmtMoney(netUsd), limit: fmtMoney(limitUsd) };
  });

  const topClients = [...clients].sort((a, b) => b.equity - a.equity).slice(0, 5);

  return (
    <div style={{ padding: 12, height: '100%', overflowY: 'auto' }}>
      {/* Exposure gauge rings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 12 }}>
        {gauges.map(g => (
          <GaugeRing key={g.symbol} pct={g.pct} symbol={g.symbol} used={g.used} limit={g.limit} />
        ))}
      </div>

      {/* P&L Attribution stacked bar */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 10, marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg2)', marginBottom: 8 }}>
          P&L ATTRIBUTION — TODAY
        </div>
        <div style={{ height: 12, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 8 }}>
          {PNL_SEGMENTS.map(s => (
            <div key={s.label} style={{ width: `${s.pct}%`, background: s.color, transition: 'width 0.5s' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {PNL_SEGMENTS.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)' }}>{s.label}</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: s.color, fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {/* Stress test table */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg2)', marginBottom: 8 }}>STRESS SCENARIOS</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-data)', fontSize: 11 }}>
            <thead>
              <tr>
                {['SCENARIO', 'EUR', 'GBP', 'JPY', 'XAU', 'BTC', 'SPX'].map(h => (
                  <th key={h} style={{ padding: '4px 6px', borderBottom: '1px solid var(--border)', textAlign: h === 'SCENARIO' ? 'left' : 'right', fontSize: 9, color: 'var(--fg3)', textTransform: 'uppercase', background: 'var(--bg-elevated)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STRESS_SCENARIOS.map(s => (
                <tr key={s.name}>
                  <td style={{ padding: '4px 6px', borderBottom: '1px solid var(--border)', color: 'var(--fg2)', fontWeight: 600, fontSize: 10 }}>{s.name}</td>
                  {[s.eur, s.gbp, s.jpy, s.xau, s.btc, s.us5].map((v, i) => (
                    <td key={i} style={{ padding: '4px 6px', borderBottom: '1px solid var(--border)', textAlign: 'right', color: v >= 0 ? 'var(--bull)' : 'var(--bear)', fontWeight: 600 }}>
                      {v >= 0 ? '+' : ''}{fmtMoney(Math.abs(v))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top clients */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg2)', marginBottom: 8 }}>TOP CLIENTS BY EQUITY</div>
          <table className="desk-table">
            <thead><tr><th>CLIENT</th><th>EQUITY</th><th>MARGIN</th><th>STATUS</th></tr></thead>
            <tbody>
              {topClients.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--fg1)', fontWeight: 600 }}>{c.name}</td>
                  <td>{fmtMoney(c.equity)}</td>
                  <td style={{ color: c.margin < 30 ? 'var(--bear)' : c.margin < 50 ? 'var(--warn)' : 'var(--bull)', fontWeight: 600 }}>{c.margin}%</td>
                  <td>
                    {c.status !== 'NORMAL'
                      ? <span className={c.status === 'MARGIN_CALL' ? 'status-call' : 'status-warning'}>{c.status === 'MARGIN_CALL' ? 'CALL' : 'WARN'}</span>
                      : <span style={{ color: 'var(--fg3)', fontSize: 9 }}>OK</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Risk Config — editable thresholds */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg2)', marginBottom: 8 }}>RISK CONFIG</div>
          {[
            { key: 'maxDrawdown'        as const, label: 'Max Drawdown (%)',         suffix: '%' },
            { key: 'marginCallLevel'    as const, label: 'Margin Call Level (%)',     suffix: '%' },
            { key: 'positionLimit'      as const, label: 'Position Limit ($)',        suffix: ''  },
            { key: 'autoHedgeThreshold' as const, label: 'Auto-Hedge Threshold (%)', suffix: '%' },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{field.label}</div>
              <input
                type="number"
                value={riskConfig[field.key]}
                onChange={e => setRiskConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '4px 8px', fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg1)', boxSizing: 'border-box' }}
              />
            </div>
          ))}
          <button
            onClick={saveConfig}
            style={{ width: '100%', padding: '5px 0', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', borderColor: saved ? 'var(--bull)' : 'var(--accent)', background: saved ? 'rgba(16,217,150,0.1)' : 'var(--accent-dim)', color: saved ? 'var(--bull)' : 'var(--accent)', letterSpacing: '0.05em' }}
          >
            {saved ? '✓ SAVED' : 'SAVE CONFIG'}
          </button>
        </div>
      </div>
    </div>
  );
}
