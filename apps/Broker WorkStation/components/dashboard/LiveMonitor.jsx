'use client';
import { useState, useEffect } from 'react';
import { instruments, clients, activityFeed } from '../../lib/mockData';

function Sparkline({ data, color = 'var(--accent)', w = 60, h = 22 }) {
  if (!data || data.length < 2) return null;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 3) - 1.5}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function PriceTicker({ instrument: inst }) {
  const [price, setPrice] = useState(inst.symbol === 'EUR/USD' ? 1.08512 : inst.symbol === 'GBP/USD' ? 1.27048 : inst.symbol === 'USD/JPY' ? 147.823 : inst.symbol === 'XAUUSD' ? 2024.45 : inst.symbol === 'US30' ? 37924 : inst.symbol === 'BTC/USD' ? 43210 : 100);
  const [change, setChange] = useState(+(Math.random() * 0.4 - 0.2).toFixed(3));
  const [history, setHistory] = useState(Array.from({ length: 20 }, (_, i) => price + (Math.random() - 0.5) * price * 0.001));
  const [dir, setDir] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrice(p => {
        const delta = p * (Math.random() - 0.5) * 0.0003;
        const np = +(p + delta).toFixed(inst.symbol.includes('JPY') ? 3 : inst.symbol === 'XAUUSD' || inst.symbol === 'US30' ? 2 : 5);
        setDir(delta > 0 ? 'up' : 'down');
        setHistory(h => [...h.slice(1), np]);
        setChange(c => +(c + delta * 100).toFixed(3));
        setTimeout(() => setDir(null), 300);
        return np;
      });
    }, 1800 + Math.random() * 1200);
    return () => clearInterval(interval);
  }, []);

  const pct = ((change / price) * 100).toFixed(2);
  const isUp = change >= 0;

  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-data)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 3 }}>{inst.symbol}</div>
        <div style={{
          fontSize: 18, fontFamily: 'var(--font-data)', fontWeight: 700,
          color: dir === 'up' ? 'var(--bull)' : dir === 'down' ? 'var(--bear)' : 'var(--text-primary)',
          transition: 'color 0.3s',
        }}>
          {price}
        </div>
        <div style={{ fontSize: 10, marginTop: 2, color: isUp ? 'var(--bull)' : 'var(--bear)' }}>
          {isUp ? '▲' : '▼'} {Math.abs(pct)}%
        </div>
      </div>
      <div>
        <Sparkline data={history} color={isUp ? 'var(--bull)' : 'var(--bear)'} />
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          <div style={{ height: 4, flex: 0.6, background: 'var(--bull)', borderRadius: 2, opacity: 0.7 }} />
          <div style={{ height: 4, flex: 0.4, background: 'var(--bear)', borderRadius: 2, opacity: 0.7 }} />
        </div>
      </div>
    </div>
  );
}

function ServerHealth() {
  const services = [
    { name: 'Trading Engine',   status: 'OK',   latency: 2 },
    { name: 'Price Feed',       status: 'OK',   latency: 8 },
    { name: 'Order Router',     status: 'OK',   latency: 4 },
    { name: 'Risk Engine',      status: 'OK',   latency: 3 },
    { name: 'Database Primary', status: 'OK',   latency: 1 },
    { name: 'Email Service',    status: 'SLOW', latency: 420 },
    { name: 'KYC API',          status: 'OK',   latency: 145 },
    { name: 'Payment Gateway',  status: 'OK',   latency: 89 },
  ];

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span className="card-title">Server Health</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bull)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 10, color: 'var(--bull)' }}>All Operational</span>
        </div>
      </div>
      <div style={{ padding: '8px 0' }}>
        {services.map(svc => (
          <div key={svc.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: svc.status === 'OK' ? 'var(--bull)' : 'var(--warn)', flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)' }}>{svc.name}</span>
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-data)',
              color: svc.latency > 200 ? 'var(--warn)' : svc.latency > 50 ? 'var(--text-secondary)' : 'var(--bull)',
            }}>
              {svc.latency}ms
            </span>
            <span className={`pill ${svc.status === 'OK' ? 'pill-bull' : 'pill-warn'}`} style={{ fontSize: 9 }}>{svc.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveTraders() {
  const trading = clients.filter(c => c.openPositions > 0);
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Clients Currently Trading</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bull)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 10, color: 'var(--bull)' }}>{trading.length} active</span>
        </div>
      </div>
      <div>
        {trading.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bull)', animation: 'pulse 2s infinite', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</div>
              <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{c.id}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--accent)' }}>{c.openPositions} position{c.openPositions !== 1 ? 's' : ''}</div>
              <div style={{ fontSize: 10, color: c.floatPnl >= 0 ? 'var(--bull)' : 'var(--bear)', fontFamily: 'var(--font-data)' }}>
                {c.floatPnl >= 0 ? '+' : ''}${c.floatPnl.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentTrades() {
  const [trades] = useState(() =>
    Array.from({ length: 20 }, (_, i) => {
      const cl = clients[Math.floor(Math.random() * clients.length)];
      const inst = instruments[Math.floor(Math.random() * 6)];
      const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const lots = +(0.1 + Math.random() * 2.9).toFixed(2);
      const pnl = +((Math.random() - 0.45) * lots * 120).toFixed(0);
      const t = new Date(Date.now() - i * 45000);
      return { id: i, client: cl.name, clientId: cl.id, symbol: inst.symbol, side, lots, pnl, time: t.toTimeString().slice(0,8) };
    }).sort((a, b) => b.id - a.id)
  );

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Recent Executions</span>
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>last 20</span>
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {trades.map(t => (
          <div key={t.id} className="feed-item">
            <span className="feed-time">{t.time}</span>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', width: 60, flexShrink: 0 }}>{t.symbol}</span>
            <span className={`pill ${t.side === 'BUY' ? 'pill-bull' : 'pill-bear'}`} style={{ fontSize: 9 }}>{t.side}</span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{t.lots} lots</span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', flex: 1, marginLeft: 6 }}>{t.client}</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-data)', fontWeight: 600, color: t.pnl >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
              {t.pnl >= 0 ? '+' : ''}${t.pnl}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LiveMonitor() {
  const topInstruments = instruments.slice(0, 6);

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Live Monitor</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            Read-only real-time overview · Prices update every ~2s
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bull)', boxShadow: '0 0 8px var(--bull)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, color: 'var(--bull)', fontWeight: 600 }}>LIVE</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => alert('Opening Dealer Workstation')}>
            Dealer Workstation ↗
          </button>
        </div>
      </div>

      {/* Live P&L ticker */}
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', marginBottom: 14, display: 'flex', gap: 24, alignItems: 'center', overflowX: 'auto' }}>
        {[
          ['Book P&L Today', '+$12,450', 'var(--bull)'],
          ['Open P&L',       '-$4,930',  'var(--bear)'],
          ['Active Trades',  '89',       'var(--accent)'],
          ['Volume Today',   '12,450 lots', 'var(--text-primary)'],
          ['Clients Trading','8',        'var(--bull)'],
          ['Margin Calls',   '2 active', 'var(--warn)'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 15, fontFamily: 'var(--font-data)', fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Top instruments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 14 }}>
        {topInstruments.map(inst => <PriceTicker key={inst.symbol} instrument={inst} />)}
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <ActiveTraders />
        <RecentTrades />
      </div>

      {/* Server health */}
      <ServerHealth />
    </div>
  );
}
