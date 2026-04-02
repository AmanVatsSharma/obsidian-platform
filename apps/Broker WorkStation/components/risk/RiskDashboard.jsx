'use client';
import { useState } from 'react';
import { instruments, clients } from '../../lib/mockData';

// ─── GAUGE ────────────────────────────────────────────────────────────────────
function GaugeBar({ label, value, limit, color }) {
  const pct = Math.min(100, (value / limit) * 100);
  const barColor = pct > 80 ? 'var(--bear)' : pct > 60 ? 'var(--warn)' : 'var(--bull)';
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color: barColor }}>
          ${(value / 1000).toFixed(0)}K / ${(limit / 1000).toFixed(0)}K
        </span>
      </div>
      <div style={{ height: 8, background: 'var(--bg-4)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 3, textAlign: 'right' }}>{pct.toFixed(0)}% of limit</div>
    </div>
  );
}

// ─── EXPOSURE SUMMARY ─────────────────────────────────────────────────────────
function ExposureSummary() {
  const bBook = 2840000;
  const aBook = 1360000;
  const net = bBook - aBook;
  const limit = 5000000;
  const pnlToday = 12450;

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-header">
        <span className="card-title">Book Exposure Summary</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color: pnlToday >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
          P&L Today: {pnlToday >= 0 ? '+' : ''}${pnlToday.toLocaleString()}
        </span>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            ['Total Exposure',  '$4.20M', 'var(--text-primary)'],
            ['B-Book',          '$2.84M', 'var(--warn)'],
            ['A-Book (Hedged)', '$1.36M', 'var(--accent)'],
            ['Net Position',    `$${((bBook - aBook) / 1000).toFixed(0)}K`, 'var(--bull)'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 20, fontFamily: 'var(--font-data)', fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>
        <GaugeBar label="Total book exposure vs limit ($5M)" value={bBook + aBook} limit={limit} />
        <GaugeBar label="B-Book only vs limit ($3M)" value={bBook} limit={3000000} />
      </div>
    </div>
  );
}

// ─── PER-SYMBOL EXPOSURE ──────────────────────────────────────────────────────
function SymbolExposure() {
  const [editLimit, setEditLimit] = useState(null);
  const [limits, setLimits] = useState({ 'EUR/USD': 500, 'GBP/USD': 300, 'XAUUSD': 200, 'USD/JPY': 400, 'US30': 150 });

  const rows = instruments.slice(0, 10).map(inst => {
    const longLots = +(Math.random() * 80 + 10).toFixed(1);
    const shortLots = +(Math.random() * 80 + 10).toFixed(1);
    const net = longLots - shortLots;
    const limit = limits[inst.symbol] || 200;
    const pct = Math.min(100, (Math.abs(net) / limit) * 100);
    const pnl = +((net * (Math.random() * 2 - 1) * 50)).toFixed(0);
    return { ...inst, longLots, shortLots, net, limit, pct, pnl };
  });

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-header">
        <span className="card-title">Per-Symbol Exposure</span>
        <button className="btn btn-ghost btn-xs">Edit All Limits</button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {['Symbol','Long (lots)','Short (lots)','Net','% of Limit','Book P&L','',''].map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.symbol}>
                <td style={{ fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 12 }}>{row.symbol}</td>
                <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--bull)' }}>+{row.longLots}</td>
                <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--bear)' }}>-{row.shortLots}</td>
                <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 600, color: row.net >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                  {row.net >= 0 ? '+' : ''}{row.net.toFixed(1)}
                </td>
                <td style={{ width: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg-4)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${row.pct}%`, height: '100%', borderRadius: 3,
                        background: row.pct > 80 ? 'var(--bear)' : row.pct > 60 ? 'var(--warn)' : 'var(--bull)',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-data)', color: 'var(--text-secondary)', width: 32, textAlign: 'right' }}>
                      {row.pct.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: row.pnl >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                  {row.pnl >= 0 ? '+' : ''}${Math.abs(row.pnl).toLocaleString()}
                </td>
                <td>
                  <button className="btn btn-ghost btn-xs" onClick={() => alert(`Hedge ${row.symbol} on dealer workstation`)}>
                    Hedge →
                  </button>
                </td>
                <td>
                  {editLimit === row.symbol ? (
                    <input
                      className="input"
                      type="number"
                      defaultValue={row.limit}
                      style={{ width: 70, height: 24, fontSize: 11, padding: '0 6px' }}
                      autoFocus
                      onBlur={e => { setLimits(l => ({ ...l, [row.symbol]: +e.target.value })); setEditLimit(null); }}
                      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditLimit(null); }}
                    />
                  ) : (
                    <button className="btn btn-ghost btn-xs" onClick={() => setEditLimit(row.symbol)}>
                      Lim: {row.limit}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MARGIN CALL CLIENTS ──────────────────────────────────────────────────────
function MarginCallClients() {
  const [filter, setFilter] = useState(50);

  const atRisk = clients
    .filter(c => c.marginPct != null && c.marginPct < filter && c.openPositions > 0)
    .sort((a, b) => a.marginPct - b.marginPct);

  const riskColor = (pct) => pct < 30 ? 'var(--bear)' : pct < 50 ? 'var(--warn)' : 'var(--text-secondary)';

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Clients Near Margin Call</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Show margin below:</span>
          {[50, 30, 20].map(v => (
            <button key={v} className={`chart-tab ${filter === v ? 'active' : ''}`}
              style={{ fontSize: 11, padding: '3px 10px' }}
              onClick={() => setFilter(v)}>
              {v}%
            </button>
          ))}
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 8 }}>
            Auto stop-out: <strong style={{ color: 'var(--bear)' }}>20%</strong>
          </span>
        </div>
      </div>

      {atRisk.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon" style={{ fontSize: 24 }}>✓</div>
          <div className="empty-state__title">No clients near margin call</div>
          <div className="empty-state__sub">All clients are above {filter}% margin level</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {['Client','Equity','Balance','Margin %','Float P&L','Positions','Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {atRisk.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{c.id}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-data)', fontSize: 11 }}>${c.equity.toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-data)', fontSize: 11 }}>${c.balance.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 40, height: 6, background: 'var(--bg-4)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, c.marginPct / 5)}%`, height: '100%', background: riskColor(c.marginPct), borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-data)', fontSize: 12, fontWeight: 700, color: riskColor(c.marginPct) }}>
                        {c.marginPct}%
                      </span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: c.floatPnl >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                    {c.floatPnl >= 0 ? '+' : ''}${c.floatPnl.toLocaleString()}
                  </td>
                  <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--accent)' }}>
                    {c.openPositions}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => alert(`Sending margin warning to ${c.name}`)}>
                        📧 Warn
                      </button>
                      <button className="btn btn-danger btn-xs" onClick={() => confirm(`Close all positions for ${c.name}?`) && alert('Positions closed')}>
                        Close All
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function RiskDashboard() {
  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Risk Dashboard</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            Live book exposure · Real-time margin monitoring
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm">Export Risk Report</button>
          <a className="btn btn-ghost btn-sm" onClick={() => alert('Opening Dealer Workstation')} style={{ cursor: 'pointer', color: 'var(--accent)' }}>
            Dealer Workstation ↗
          </a>
        </div>
      </div>
      <ExposureSummary />
      <SymbolExposure />
      <MarginCallClients />
    </div>
  );
}
