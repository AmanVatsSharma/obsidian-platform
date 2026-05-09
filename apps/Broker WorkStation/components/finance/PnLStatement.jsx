'use client';
import { useState, useMemo } from 'react';
import { revenueData, instruments, introducingBrokers } from '../../lib/mockData';
import { toast } from '../shared/Toast';

const DATE_PRESETS = [
  { label: 'Jan 2024',  key: 'jan' },
  { label: 'Dec 2023',  key: 'dec' },
  { label: 'Q1 2024',   key: 'q1' },
  { label: 'Custom',    key: 'custom' },
];

function HorizBarChart({ rows, valueKey, colorKey, maxLabel }) {
  const maxVal = Math.max(...rows.map(r => r[valueKey]));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map((row, i) => {
        const pct = (row[valueKey] / maxVal) * 100;
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color: 'var(--text-secondary)', fontWeight: 600 }}>{row.label}</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color: row[colorKey] || 'var(--text-primary)' }}>
                ${row[valueKey].toLocaleString()}
              </span>
            </div>
            <div style={{ height: 7, background: 'var(--bg-4)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: 4,
                background: row[colorKey] || 'var(--accent)',
                transition: 'width 0.5s cubic-bezier(0.34,1.2,0.64,1)',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, delta, deltaLabel, color }) {
  const isUp = typeof delta === 'number' ? delta >= 0 : null;
  return (
    <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 20, fontFamily: 'var(--font-data)', fontWeight: 700, color: color || 'var(--text-primary)', marginBottom: 4 }}>{value}</div>
      {delta !== undefined && (
        <div style={{ fontSize: 10, color: isUp ? 'var(--bull)' : 'var(--bear)', display: 'flex', alignItems: 'center', gap: 3 }}>
          <span>{isUp ? '▲' : '▼'}</span>
          <span>{typeof delta === 'number' ? `${Math.abs(delta).toFixed(1)}%` : delta} {deltaLabel}</span>
        </div>
      )}
    </div>
  );
}

// Inline cost row with manual entry
function CostRow({ label, defaultValue, onChange }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(defaultValue);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      {editing ? (
        <input
          className="input"
          type="number"
          defaultValue={value}
          style={{ width: 110, textAlign: 'right', fontSize: 12 }}
          autoFocus
          onBlur={e => { setValue(+e.target.value); onChange(+e.target.value); setEditing(false); }}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(false); }}
        />
      ) : (
        <span
          style={{ fontSize: 12, fontFamily: 'var(--font-data)', color: 'var(--bear)', cursor: 'text', padding: '2px 6px', borderRadius: 4, transition: 'background 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          -${value.toLocaleString()}
        </span>
      )}
    </div>
  );
}

export default function PnLStatement() {
  const [preset, setPreset]     = useState('jan');
  const [costs, setCosts]       = useState({ lpSpreads: 18400, bonuses: 4150, ibComm: 7560, ops: 12000 });
  const setCost = (k, v) => setCosts(c => ({ ...c, [k]: v }));

  // Revenue breakdown by symbol (from instrument volume + revenue data)
  const spreadBySymbol = useMemo(() => {
    return instruments.slice(0, 8).map(inst => ({
      label: inst.symbol,
      spread: Math.round(inst.volume24h * 0.9 * 22 * inst.spread * 0.85),
      commission: Math.round(inst.volume24h * 22 * inst.commission * 0.8),
      color: inst.category === 'Crypto' ? '#8B5CF6' : inst.category === 'Indices' ? 'var(--warn)' : inst.category === 'Commodities' ? '#EC4899' : 'var(--accent)',
    }));
  }, []);

  const spreadTotal    = spreadBySymbol.reduce((s, r) => s + r.spread, 0);
  const commTotal      = spreadBySymbol.reduce((s, r) => s + r.commission, 0);
  const swapTotal      = Math.round(revenueData.reduce((s, r) => s + r.swap, 0));
  const otherFees      = 2840;
  const grossRevenue   = spreadTotal + commTotal + swapTotal + otherFees;
  const totalCosts     = Object.values(costs).reduce((s, v) => s + v, 0);
  const netPnl         = grossRevenue - totalCosts;
  const margin         = (netPnl / grossRevenue) * 100;

  // Prior month for comparison (mock 12% lower)
  const priorGross = Math.round(grossRevenue * 0.88);
  const priorNet   = Math.round(netPnl * 0.82);
  const momGross   = ((grossRevenue - priorGross) / priorGross) * 100;
  const momNet     = ((netPnl - priorNet) / priorNet) * 100;

  const revenueRows = [
    { label: 'Spread Income',   value: spreadTotal, color: 'var(--accent)' },
    { label: 'Commission',      value: commTotal,   color: 'var(--warn)' },
    { label: 'Swap / Rollover', value: swapTotal,   color: 'var(--bull)' },
    { label: 'Other Fees',      value: otherFees,   color: '#8B5CF6' },
  ];

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* Header */}
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>P&L Statement</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            ArcaFX Markets · January 2024
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
            {DATE_PRESETS.map(p => (
              <button key={p.key} className={`chart-tab ${preset === p.key ? 'active' : ''}`}
                style={{ fontSize: 11, padding: '4px 12px' }}
                onClick={() => setPreset(p.key)}>
                {p.label}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => toast.info('Generating PDF...', { title: 'Export' })}>
            PDF
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => toast.info('Generating XLSX...', { title: 'Export' })}>
            XLSX
          </button>
        </div>
      </div>

      {/* MoM comparison strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        <StatCard label="Gross Revenue"   value={`$${(grossRevenue/1000).toFixed(1)}K`}  delta={momGross}  color="var(--bull)" />
        <StatCard label="Spread Income"   value={`$${(spreadTotal/1000).toFixed(1)}K`}   delta={8.4}       color="var(--accent)" />
        <StatCard label="Commission"      value={`$${(commTotal/1000).toFixed(1)}K`}     delta={12.1}      color="var(--warn)" />
        <StatCard label="Swap Income"     value={`$${(swapTotal/1000).toFixed(1)}K`}     delta={3.2}       color="var(--bull)" />
        <StatCard label="Total Costs"     value={`$${(totalCosts/1000).toFixed(1)}K`}    delta={-totalCosts/1000 < -19 ? -2.1 : 1.8} color="var(--bear)" />
        <StatCard label="Net P&L"         value={`$${(netPnl/1000).toFixed(1)}K`}        delta={momNet}    color={netPnl >= 0 ? 'var(--bull)' : 'var(--bear)'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left: Revenue */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header">
              <span className="card-title">Revenue Breakdown</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color: 'var(--bull)' }}>
                ${grossRevenue.toLocaleString()}
              </span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              {/* Revenue source bars */}
              <div style={{ marginBottom: 16 }}>
                {revenueRows.map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 80, height: 5, background: 'var(--bg-4)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(row.value / grossRevenue) * 100}%`, height: '100%', background: row.color, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-data)', color: 'var(--text-primary)', fontWeight: 600, minWidth: 64, textAlign: 'right' }}>
                        ${row.value.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', minWidth: 30, textAlign: 'right' }}>
                        {((row.value / grossRevenue) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Total Gross Revenue</span>
                  <span style={{ fontSize: 14, fontFamily: 'var(--font-data)', fontWeight: 700, color: 'var(--bull)' }}>${grossRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Spread Income by Symbol</span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <HorizBarChart
                rows={spreadBySymbol.slice(0, 8).map(r => ({ label: r.label, value: r.spread, color: r.color }))}
                valueKey="value"
                colorKey="color"
              />
            </div>
          </div>
        </div>

        {/* Right: Costs + Net */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-header">
              <span className="card-title">Cost Breakdown</span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Click values to edit</span>
            </div>
            <div style={{ padding: '0 16px' }}>
              <CostRow label="LP spread costs"        defaultValue={costs.lpSpreads} onChange={v => setCost('lpSpreads', v)} />
              <CostRow label="Bonuses given"          defaultValue={costs.bonuses}   onChange={v => setCost('bonuses', v)} />
              <CostRow label="IB commissions paid"    defaultValue={costs.ibComm}    onChange={v => setCost('ibComm', v)} />
              <CostRow label="Operational costs"      defaultValue={costs.ops}       onChange={v => setCost('ops', v)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Total Costs</span>
                <span style={{ fontSize: 14, fontFamily: 'var(--font-data)', fontWeight: 700, color: 'var(--bear)' }}>
                  -${totalCosts.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Net P&L summary */}
          <div style={{ background: netPnl >= 0 ? 'var(--bull-muted)' : 'var(--bear-muted)', border: `1px solid ${netPnl >= 0 ? 'var(--bull-dim)' : 'var(--bear-dim)'}`, borderRadius: 10, padding: '20px 20px' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
              Net P&L — January 2024
            </div>
            <div style={{ fontSize: 36, fontFamily: 'var(--font-data)', fontWeight: 700, color: netPnl >= 0 ? 'var(--bull)' : 'var(--bear)', marginBottom: 10 }}>
              {netPnl >= 0 ? '+' : ''}{netPnl >= 0 ? '$' : '-$'}{Math.abs(netPnl).toLocaleString()}
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Margin</div>
                <div style={{ fontSize: 16, fontFamily: 'var(--font-data)', fontWeight: 600, color: margin >= 40 ? 'var(--bull)' : 'var(--warn)' }}>
                  {margin.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>vs Dec 2023</div>
                <div style={{ fontSize: 16, fontFamily: 'var(--font-data)', fontWeight: 600, color: momNet >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                  {momNet >= 0 ? '+' : ''}{momNet.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross</div>
                <div style={{ fontSize: 16, fontFamily: 'var(--font-data)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  ${(grossRevenue/1000).toFixed(1)}K
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, height: 6, background: 'rgba(0,0,0,0.2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${(netPnl / grossRevenue) * 100}%`, height: '100%', background: netPnl >= 0 ? 'var(--bull)' : 'var(--bear)', borderRadius: 3 }} />
            </div>
          </div>

          {/* Commission by symbol */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="card-header">
              <span className="card-title">Commission by Symbol</span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <HorizBarChart
                rows={spreadBySymbol.filter(r => r.commission > 0).map(r => ({ label: r.label, value: r.commission, color: 'var(--warn)' }))}
                valueKey="value"
                colorKey="color"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
