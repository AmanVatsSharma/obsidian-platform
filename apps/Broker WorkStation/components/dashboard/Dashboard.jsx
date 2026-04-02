'use client';
import { useState, useMemo } from 'react';
import {
  clients, transactions, revenueData, heatmapData,
  activityFeed, instruments, surveillanceAlerts, introducingBrokers
} from '../../lib/mockData';

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = 'var(--accent)', width = 80, height = 28 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, delta, deltaPositive, sparkData, sparkColor, onClick }) {
  return (
    <div className="kpi-card" onClick={onClick}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-bottom">
        <div>
          <div className={`kpi-delta ${deltaPositive ? 'text-bull' : 'text-bear'}`}>
            <span>{deltaPositive ? '▲' : '▼'}</span>
            <span>{delta}</span>
          </div>
          <div className="kpi-sub">{sub}</div>
        </div>
        <Sparkline data={sparkData} color={sparkColor || (deltaPositive ? 'var(--bull)' : 'var(--bear)')} />
      </div>
    </div>
  );
}

// ─── REVENUE CHART ────────────────────────────────────────────────────────────
function RevenueChart({ data }) {
  const [tab, setTab] = useState('daily');
  const [hovIdx, setHovIdx] = useState(null);
  const W = 540, H = 180, PAD = { top: 12, right: 16, bottom: 32, left: 52 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  const displayed = useMemo(() => {
    if (tab === 'daily') return data;
    if (tab === 'weekly') {
      const weeks = [];
      for (let i = 0; i < data.length; i += 7) {
        const chunk = data.slice(i, i + 7);
        if (chunk.length === 0) continue;
        weeks.push({
          label: chunk[0].label,
          spread: chunk.reduce((a, b) => a + b.spread, 0),
          commission: chunk.reduce((a, b) => a + b.commission, 0),
          swap: chunk.reduce((a, b) => a + b.swap, 0),
          total: chunk.reduce((a, b) => a + b.total, 0),
        });
      }
      return weeks;
    }
    return data;
  }, [data, tab]);

  const maxTotal = Math.max(...displayed.map(d => d.total));
  const yMax = Math.ceil(maxTotal / 5000) * 5000;

  const x = (i) => PAD.left + (i / (displayed.length - 1)) * CW;
  const y = (v) => PAD.top + CH - (v / yMax) * CH;
  const yCum = (d, layer) => {
    if (layer === 0) return y(d.swap);
    if (layer === 1) return y(d.swap + d.commission);
    return y(d.total);
  };

  // Build area paths for stacked chart
  const areaPath = (getTop, getBottom) => {
    let d = '';
    displayed.forEach((pt, i) => {
      const px = x(i), py = getTop(pt);
      d += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
    });
    for (let i = displayed.length - 1; i >= 0; i--) {
      const px = x(i), py = getBottom(displayed[i]);
      d += ` L ${px} ${py}`;
    }
    d += ' Z';
    return d;
  };

  const bottomBaseline = (pt) => y(0);
  const swapTop  = (pt) => y(pt.swap);
  const commTop  = (pt) => y(pt.swap + pt.commission);
  const totTop   = (pt) => y(pt.total);

  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  const fmt = (v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Revenue Breakdown</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="chart-tabs">
            {['daily','weekly','monthly'].map(t => (
              <button key={t} className={`chart-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-xs">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 7v2h2M9 7v2H7M5 1v5M2.5 3.5L5 1l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            CSV
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 16px 8px', position: 'relative' }}>
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          onMouseLeave={() => setHovIdx(null)}
        >
          {/* Y axis grid + labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={PAD.left} y1={y(tick)} x2={W - PAD.right} y2={y(tick)}
                stroke="var(--border)" strokeWidth="0.5" strokeDasharray={tick > 0 ? '3 3' : ''}
              />
              <text x={PAD.left - 6} y={y(tick) + 4} textAnchor="end" fontSize="9" fill="var(--text-tertiary)">
                {fmt(tick)}
              </text>
            </g>
          ))}

          {/* Stacked area: swap (bottom) */}
          <path d={areaPath(swapTop, bottomBaseline)} fill="var(--bull)" fillOpacity="0.15" />
          {/* Commission layer */}
          <path d={areaPath(commTop, swapTop)} fill="var(--accent)" fillOpacity="0.2" />
          {/* Spread layer (top) */}
          <path d={areaPath(totTop, commTop)} fill="var(--warn)" fillOpacity="0.2" />

          {/* Total line */}
          <polyline
            points={displayed.map((d, i) => `${x(i)},${y(d.total)}`).join(' ')}
            fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.4"
            strokeDasharray="3 2"
          />

          {/* Hover columns */}
          {displayed.map((d, i) => (
            <rect
              key={i}
              x={x(i) - CW / displayed.length / 2}
              y={PAD.top}
              width={CW / displayed.length}
              height={CH}
              fill={hovIdx === i ? 'rgba(255,255,255,0.03)' : 'transparent'}
              onMouseEnter={() => setHovIdx(i)}
              style={{ cursor: 'crosshair' }}
            />
          ))}

          {/* Hover dot + tooltip */}
          {hovIdx !== null && (() => {
            const d = displayed[hovIdx];
            const px = x(hovIdx);
            const py = y(d.total);
            const tipX = Math.min(px, W - 140);
            return (
              <g>
                <line x1={px} y1={PAD.top} x2={px} y2={H - PAD.bottom} stroke="var(--border-strong)" strokeWidth="0.8" />
                <circle cx={px} cy={py} r="3" fill="white" />
                <rect x={tipX} y={PAD.top + 2} width="134" height="66" rx="4" fill="var(--bg-3)" stroke="var(--border-strong)" strokeWidth="0.8" />
                <text x={tipX + 8} y={PAD.top + 15} fontSize="9" fill="var(--text-secondary)">{d.label || d.date}</text>
                <rect x={tipX + 8} y={PAD.top + 22} width="6" height="6" fill="var(--warn)" fillOpacity="0.7" rx="1" />
                <text x={tipX + 18} y={PAD.top + 29} fontSize="9" fill="var(--text-primary)">Spread: {fmt(d.spread)}</text>
                <rect x={tipX + 8} y={PAD.top + 36} width="6" height="6" fill="var(--accent)" fillOpacity="0.7" rx="1" />
                <text x={tipX + 18} y={PAD.top + 43} fontSize="9" fill="var(--text-primary)">Comm: {fmt(d.commission)}</text>
                <rect x={tipX + 8} y={PAD.top + 50} width="6" height="6" fill="var(--bull)" fillOpacity="0.7" rx="1" />
                <text x={tipX + 18} y={PAD.top + 57} fontSize="9" fill="var(--text-primary)">Swap: {fmt(d.swap)}</text>
              </g>
            );
          })()}

          {/* X axis labels — show every 5 days */}
          {displayed.map((d, i) => {
            if (i % Math.max(1, Math.floor(displayed.length / 7)) !== 0) return null;
            return (
              <text key={i} x={x(i)} y={H - 4} textAnchor="middle" fontSize="8.5" fill="var(--text-tertiary)">
                {d.label || d.date?.slice(5)}
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, paddingTop: 4 }}>
          {[['Spread Income','var(--warn)'], ['Commission','var(--accent)'], ['Swap Income','var(--bull)'], ['Net P&L', 'white']].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color, opacity: 0.7 }} />
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{label}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-data)', color: 'var(--bull)' }}>
            MTD Total: ${revenueData.reduce((a, b) => a + b.total, 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HEATMAP ──────────────────────────────────────────────────────────────────
function ActivityHeatmap({ data }) {
  const [hov, setHov] = useState(null);
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const CW = 8, CH = 14, GAP = 2;
  const W = 24 * (CW + GAP) + 30;
  const H = 7 * (CH + GAP) + 28;

  const cell = (day, hour) => data.find(d => d.day === day && d.hour === hour);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Client Activity</span>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>7-day trades/hr</span>
      </div>
      <div style={{ padding: '12px 14px 10px', position: 'relative' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} onMouseLeave={() => setHov(null)}>
          {DAYS.map((day, di) => (
            <text key={day} x="0" y={di * (CH + GAP) + 22 + CH / 2} fontSize="8" fill="var(--text-tertiary)" dominantBaseline="middle">
              {day}
            </text>
          ))}
          {HOURS.map((h, hi) => {
            if (h % 4 !== 0) return null;
            return (
              <text key={h} x={28 + hi * (CW + GAP) + CW / 2} y="10" fontSize="7" fill="var(--text-tertiary)" textAnchor="middle">
                {h}
              </text>
            );
          })}
          {DAYS.map((day, di) =>
            HOURS.map((h, hi) => {
              const c = cell(day, h);
              const intensity = c?.intensity || 0;
              const opacity = intensity / 100;
              const isHov = hov?.day === day && hov?.hour === h;
              return (
                <rect
                  key={`${day}-${h}`}
                  x={28 + hi * (CW + GAP)}
                  y={16 + di * (CH + GAP)}
                  width={CW}
                  height={CH}
                  rx="1.5"
                  fill={`rgba(59,130,246,${opacity > 0.05 ? opacity : 0.04})`}
                  stroke={isHov ? 'var(--accent)' : 'none'}
                  strokeWidth={isHov ? 0.8 : 0}
                  onMouseEnter={() => setHov({ day, hour: h, intensity, symbol: c?.symbol })}
                  style={{ cursor: 'default' }}
                />
              );
            })
          )}
        </svg>

        {/* Hover tooltip */}
        {hov && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'var(--bg-4)', border: '1px solid var(--border-strong)',
            borderRadius: 6, padding: '6px 10px', fontSize: 10,
            pointerEvents: 'none', zIndex: 10,
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              {hov.day} {String(hov.hour).padStart(2,'0')}:00
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>{hov.intensity} trades</div>
            <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-data)' }}>{hov.symbol}</div>
          </div>
        )}

        {/* Scale bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <span style={{ fontSize: 8, color: 'var(--text-tertiary)' }}>Low</span>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'linear-gradient(to right, rgba(59,130,246,0.04), rgba(59,130,246,1))' }} />
          <span style={{ fontSize: 8, color: 'var(--text-tertiary)' }}>High</span>
        </div>
      </div>
    </div>
  );
}

// ─── TOP SYMBOLS ──────────────────────────────────────────────────────────────
function TopSymbols({ instruments: insts }) {
  const sorted = [...insts].sort((a, b) => b.volume24h - a.volume24h).slice(0, 8);
  const maxVol = sorted[0]?.volume24h || 1;
  const total = sorted.reduce((a, b) => a + b.volume24h, 0);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Top Symbols</span>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>by volume today</span>
      </div>
      <div style={{ padding: '10px 14px' }}>
        {sorted.map((inst, i) => {
          const pct = (inst.volume24h / maxVol) * 100;
          const totalPct = ((inst.volume24h / total) * 100).toFixed(1);
          const buyPct = 45 + Math.random() * 20;
          const sellPct = 100 - buyPct;
          return (
            <div key={inst.symbol} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {inst.symbol}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>
                  {inst.volume24h.toLocaleString()} lots · {totalPct}%
                </span>
              </div>
              {/* Split bar: buy/sell */}
              <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex', width: `${pct}%` }}>
                <div style={{ width: `${buyPct}%`, background: 'var(--bull)', opacity: 0.8 }} />
                <div style={{ width: `${sellPct}%`, background: 'var(--bear)', opacity: 0.8 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 9, color: 'var(--bull)' }}>B {buyPct.toFixed(0)}%</span>
                <span style={{ fontSize: 9, color: 'var(--bear)' }}>S {sellPct.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CLIENT DONUT ─────────────────────────────────────────────────────────────
function ClientDonut({ clients: cls, onNavigate }) {
  const [hov, setHov] = useState(null);

  const segments = useMemo(() => [
    { label: 'Active Trading', count: cls.filter(c => c.status === 'Active' && c.openPositions > 0).length, color: 'var(--bull)' },
    { label: 'Logged In',      count: cls.filter(c => c.status === 'Active' && c.openPositions === 0).length, color: 'var(--accent)' },
    { label: 'Dormant',        count: cls.filter(c => c.status === 'Dormant').length, color: 'var(--text-tertiary)' },
    { label: 'Pending KYC',    count: cls.filter(c => c.status === 'Pending').length, color: 'var(--warn)' },
    { label: 'Suspended',      count: cls.filter(c => c.status === 'Suspended').length, color: 'var(--bear)' },
  ], [cls]);

  const total = segments.reduce((a, b) => a + b.count, 0);
  const CX = 56, CY = 56, R = 42, r = 26;

  // Build SVG arcs
  let angle = -Math.PI / 2;
  const paths = segments.map((seg, i) => {
    const theta = (seg.count / total) * 2 * Math.PI;
    const x1 = CX + R * Math.cos(angle);
    const y1 = CY + R * Math.sin(angle);
    const x2 = CX + R * Math.cos(angle + theta);
    const y2 = CY + R * Math.sin(angle + theta);
    const ix1 = CX + r * Math.cos(angle);
    const iy1 = CY + r * Math.sin(angle);
    const ix2 = CX + r * Math.cos(angle + theta);
    const iy2 = CY + r * Math.sin(angle + theta);
    const large = theta > Math.PI ? 1 : 0;
    const path = theta < 0.01 ? '' :
      `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r} ${r} 0 ${large} 0 ${ix1} ${iy1} Z`;
    const startAngle = angle;
    angle += theta;
    return { ...seg, path, startAngle, theta };
  });

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Client Status</span>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{total} total clients</span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <svg width="112" height="112" style={{ flexShrink: 0 }}>
          {paths.map((p, i) => p.path && (
            <path
              key={i}
              d={p.path}
              fill={p.color}
              opacity={hov === null || hov === i ? (hov === i ? 1 : 0.85) : 0.4}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
              onClick={() => onNavigate('clients')}
            />
          ))}
          <text x={CX} y={CY - 4} textAnchor="middle" fontSize="18" fontWeight="600" fill="var(--text-primary)" fontFamily="var(--font-data)">
            {total}
          </text>
          <text x={CX} y={CY + 10} textAnchor="middle" fontSize="8" fill="var(--text-tertiary)">
            clients
          </text>
        </svg>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 4 }}>
          {segments.map((seg, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', opacity: hov === null || hov === i ? 1 : 0.5, transition: 'opacity 0.15s' }}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
              onClick={() => onNavigate('clients')}
            >
              <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1 }}>{seg.label}</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color: 'var(--text-primary)', fontWeight: 600 }}>{seg.count}</span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)', width: 32, textAlign: 'right' }}>
                {((seg.count / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TRANSACTION FLOW ─────────────────────────────────────────────────────────
function TransactionFlow({ transactions: txs, onNavigate }) {
  const pending = txs.filter(t => t.status === 'Pending');
  const approved = txs.filter(t => t.status === 'Approved');
  const rejected = txs.filter(t => t.status === 'Rejected');
  const deps = txs.filter(t => t.type === 'Deposit');
  const withs = txs.filter(t => t.type === 'Withdrawal');
  const netDep = deps.filter(t => t.status === 'Approved').reduce((a, b) => a + b.amount, 0);
  const netWith = withs.filter(t => t.status === 'Approved').reduce((a, b) => a + b.amount, 0);
  const netToday = netDep - netWith;

  const Row = ({ label, pending: p, approved: a, rejected: r, color }) => (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color }}>${(a.reduce((s, t) => s + t.amount, 0)).toLocaleString()} approved</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ fontSize: 10, color: 'var(--warn)' }}>{p.length} pending</div>
        <div style={{ fontSize: 10, color: 'var(--bull)' }}>{a.length} approved</div>
        <div style={{ fontSize: 10, color: 'var(--bear)' }}>{r.length} rejected</div>
      </div>
    </div>
  );

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Transaction Flow</span>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>today</span>
      </div>
      <div style={{ padding: '0 14px' }}>
        <Row label="Deposits"    pending={deps.filter(t => t.status === 'Pending')}    approved={deps.filter(t => t.status === 'Approved')}    rejected={deps.filter(t => t.status === 'Rejected')}    color="var(--bull)" />
        <Row label="Withdrawals" pending={withs.filter(t => t.status === 'Pending')}   approved={withs.filter(t => t.status === 'Approved')}   rejected={withs.filter(t => t.status === 'Rejected')}   color="var(--bear)" />

        <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Net funding today</span>
          <span style={{ fontSize: 14, fontFamily: 'var(--font-data)', fontWeight: 700, color: netToday >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
            {netToday >= 0 ? '+' : ''}{netToday.toLocaleString()}
          </span>
        </div>
      </div>
      <div style={{ padding: '0 14px 12px' }}>
        <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onNavigate('transactions')}>
          <span style={{ color: 'var(--bear)', fontWeight: 700, marginRight: 4 }}>{pending.length}</span>
          Pending approvals
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 4 }}>
            <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── COMPLIANCE ALERTS PANEL ──────────────────────────────────────────────────
function CompliancePanel({ alerts, onNavigate }) {
  const last8 = alerts.slice(0, 8);
  const sevColor = (s) => s === 'HIGH' ? 'var(--bear)' : s === 'MEDIUM' ? 'var(--warn)' : 'var(--text-secondary)';

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Compliance Alerts</span>
        <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--bear-muted)', color: 'var(--bear)', borderRadius: 10, fontWeight: 700 }}>
          {alerts.filter(a => a.status === 'Open').length} open
        </span>
      </div>
      <div style={{ overflow: 'hidden' }}>
        {last8.map(alert => (
          <div key={alert.id} style={{ display: 'flex', gap: 8, padding: '8px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}
            onClick={() => onNavigate('surveillance')}
          >
            <span style={{ fontSize: 9, fontWeight: 700, color: sevColor(alert.severity), width: 36, flexShrink: 0, paddingTop: 1 }}>{alert.severity}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 1 }}>{alert.type}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.entity}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{alert.time.slice(11)}</div>
              <div style={{ marginTop: 2 }}>
                <span className={`pill ${alert.status === 'Open' ? 'pill-bear' : alert.status === 'Investigating' ? 'pill-warn' : 'pill-muted'}`} style={{ fontSize: 8, padding: '1px 5px' }}>
                  {alert.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 14px' }}>
        <button className="btn btn-ghost btn-xs" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onNavigate('surveillance')}>
          View all alerts →
        </button>
      </div>
    </div>
  );
}

// ─── IB PERFORMANCE ───────────────────────────────────────────────────────────
function IBPerformance({ ibs, onNavigate }) {
  const top5 = [...ibs].sort((a, b) => b.clientsReferred - a.clientsReferred).slice(0, 5);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">IB Performance</span>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>this month</span>
      </div>
      <div style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              {['IB Name','Clients','Volume','Commission',''].map(h => (
                <th key={h} style={{ padding: '6px 14px', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', textAlign: h === '' ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top5.map(ib => (
              <tr key={ib.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <td style={{ padding: '7px 14px' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{ib.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>Tier {ib.tier}</div>
                </td>
                <td style={{ padding: '7px 14px', fontFamily: 'var(--font-data)', color: 'var(--text-secondary)' }}>{ib.activeClients}</td>
                <td style={{ padding: '7px 14px', fontFamily: 'var(--font-data)', color: 'var(--text-secondary)' }}>{ib.volumeMTD.toLocaleString()}</td>
                <td style={{ padding: '7px 14px', fontFamily: 'var(--font-data)', color: 'var(--bull)' }}>${ib.commissionPending.toLocaleString()}</td>
                <td style={{ padding: '7px 14px', textAlign: 'right' }}>
                  <span className={`pill ${ib.status === 'Active' ? 'pill-bull' : 'pill-warn'}`} style={{ fontSize: 9 }}>{ib.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '8px 14px' }}>
        <button className="btn btn-ghost btn-xs" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onNavigate('commissions')}>
          Pay commissions →
        </button>
      </div>
    </div>
  );
}

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
function ActivityFeedPanel({ feed }) {
  const dotColor = (type) => ({
    deposit: 'var(--bull)', withdrawal: 'var(--warn)', kyc: 'var(--warn)',
    margin: 'var(--bear)', alert: 'var(--bear)', ib: 'var(--accent)',
    trade: 'var(--text-tertiary)', system: 'var(--text-tertiary)',
  }[type] || 'var(--text-tertiary)');

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Live Activity Feed</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bull)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 10, color: 'var(--bull)' }}>Live</span>
        </div>
      </div>
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {feed.map(item => (
          <div key={item.id} className="feed-item">
            <span className="feed-time">{item.time}</span>
            <div className="feed-dot" style={{ background: dotColor(item.type) }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DASHBOARD ROOT ───────────────────────────────────────────────────────────
export default function Dashboard({ onNavigate }) {
  // KPI sparkline data derived from revenue
  const spreadSpark = revenueData.slice(-7).map(d => d.spread);
  const totalSpark  = revenueData.slice(-7).map(d => d.total);
  const clientSpark = [810, 818, 822, 826, 828, 831, 834];
  const depSpark    = [210000, 220000, 235000, 248000, 262000, 271000, 284500];
  const volSpark    = [9800, 10200, 11400, 12100, 11800, 12000, 12450];

  const activeClients = clients.filter(c => c.status === 'Active').length;
  const openPositions = clients.reduce((a, c) => a + c.openPositions, 0);
  const totalExposure = clients.reduce((a, c) => a + c.margin, 0);

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* Header */}
      <div style={{ padding: '20px 0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
            Good morning, Sarah
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            ArcaFX Markets · Monday, January 15, 2024 · Seychelles FSA
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1h9v3L5.5 7 1 4V1z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/><path d="M5.5 7v3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
            Export daily report
          </button>
          <button className="btn btn-primary btn-sm">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            Add Client
          </button>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <KPICard
          label="Active Clients"
          value={activeClients.toLocaleString()}
          sub="of 1,247 total"
          delta="+23 vs yesterday"
          deltaPositive={true}
          sparkData={clientSpark}
          onClick={() => onNavigate('clients')}
        />
        <KPICard
          label="Deposits MTD"
          value="$284,500"
          sub="+18% vs last month"
          delta="+18% MoM"
          deltaPositive={true}
          sparkData={depSpark}
          onClick={() => onNavigate('transactions')}
        />
        <KPICard
          label="Volume Today"
          value="12,450 lots"
          sub="$1.4B notional"
          delta="+8.2% vs avg"
          deltaPositive={true}
          sparkData={volSpark}
          onClick={() => onNavigate('instruments')}
        />
        <KPICard
          label="Revenue Today"
          value="$18,240"
          sub="vs avg $14K"
          delta="+30% vs avg"
          deltaPositive={true}
          sparkData={totalSpark}
          sparkColor="var(--bull)"
          onClick={() => onNavigate('pnl')}
        />
        <KPICard
          label="New Clients Today"
          value="7"
          sub="MTD: 142 clients"
          delta="+2 vs yesterday"
          deltaPositive={true}
          sparkData={[4,6,5,7,8,5,7]}
          onClick={() => onNavigate('clients')}
        />
        <KPICard
          label="Open Positions"
          value={openPositions.toString()}
          sub={`$${(totalExposure / 1000).toFixed(0)}K exposure`}
          delta={`${openPositions > 80 ? '+' : ''}${openPositions - 80} vs avg 80`}
          deltaPositive={openPositions >= 80}
          sparkData={[72,78,85,81,88,84,openPositions]}
          onClick={() => onNavigate('risk')}
        />
      </div>

      {/* Row 2: Charts */}
      <div className="dash-row dash-row-charts" style={{ marginBottom: 14 }}>
        <RevenueChart data={revenueData} />
        <ActivityHeatmap data={heatmapData} />
        <TopSymbols instruments={instruments} />
      </div>

      {/* Row 3: Panels */}
      <div className="dash-row dash-row-panels" style={{ marginBottom: 14 }}>
        <ClientDonut clients={clients} onNavigate={onNavigate} />
        <TransactionFlow transactions={transactions} onNavigate={onNavigate} />
        <CompliancePanel alerts={surveillanceAlerts} onNavigate={onNavigate} />
        <IBPerformance ibs={introducingBrokers} onNavigate={onNavigate} />
      </div>

      {/* Row 4: Activity Feed */}
      <ActivityFeedPanel feed={activityFeed} />
    </div>
  );
}
