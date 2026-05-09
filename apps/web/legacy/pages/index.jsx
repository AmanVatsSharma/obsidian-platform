'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Search, Bell, Settings, ChevronDown, ChevronUp, TrendingUp, TrendingDown,
  BarChart2, BookOpen, Clock, Newspaper, Calendar, Activity, Layers,
  Maximize2, Minimize2, X, Plus, Minus, RefreshCw, Wifi, Database,
  AlertCircle, ArrowUpRight, ArrowDownRight, MoreHorizontal, Eye,
  SlidersHorizontal, CandlestickChart, LineChart, AreaChart, Zap, Shield,
  Copy, Edit, Trash2, LogOut, User, DollarSign, TrendingUp as Trend,
} from 'lucide-react';
import {
  INSTRUMENTS, OPEN_POSITIONS, PENDING_ORDERS, TRADE_HISTORY,
  ACCOUNT, DOM_DATA, ECONOMIC_CALENDAR, NEWS, TIMEFRAMES,
  generateOHLCV, P_AND_L_HISTORY,
} from '../lib/mockData';

/* ─── Utility helpers ────────────────────────────────────────────────────── */
const fmt = (n, d = 2) => n?.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) ?? '—';
const fmtPrice = (n, digits) => n?.toFixed(digits) ?? '—';
const pnlClass = (n) => (n >= 0 ? 'bull' : 'bear');
const pnlSign  = (n) => (n >= 0 ? '+' : '');

/* ─── Sparkline SVG ──────────────────────────────────────────────────────── */
function Sparkline({ data, color = '#10D996', width = 60, height = 22 }) {
  if (!data?.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ─── P&L Sparkline ──────────────────────────────────────────────────────── */
function PnLSparkline({ data }) {
  if (!data?.length) return null;
  const w = 228; const h = 52;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const d = `M ${pts.map(p => p).join(' L ')}`;
  const fill = `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="pnl-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10D996" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10D996" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#pnl-grad)" />
      <path d={d} fill="none" stroke="#10D996" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Toast Notifications ────────────────────────────────────────────────── */
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <div className="toast-icon" />
          <div>
            <div className="toast-text">{t.text}</div>
            {t.sub && <div className="toast-sub">{t.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Top Bar ────────────────────────────────────────────────────────────── */
function TopBar({ activeInstrument, prices, onSymbolClick }) {
  const pinned = INSTRUMENTS.slice(0, 5);
  const price  = prices[activeInstrument?.symbol] ?? activeInstrument;
  return (
    <header className="topbar">
      <a className="topbar-logo" href="#">
        <div className="topbar-logo-dot" />
        OBSIDIAN
      </a>

      {/* Pinned symbols strip */}
      {pinned.map(inst => {
        const p = prices[inst.symbol] ?? inst;
        return (
          <div key={inst.symbol} className="topbar-symbol" onClick={() => onSymbolClick(inst)}>
            <span className="topbar-symbol-name">{inst.symbol}</span>
            <span className={`topbar-symbol-price ${pnlClass(p.change)}`}>{fmtPrice(p.bid, inst.digits)}</span>
            <span className={`topbar-symbol-change ${pnlClass(p.changePct)}`}>{pnlSign(p.changePct)}{p.changePct?.toFixed(2)}%</span>
          </div>
        );
      })}

      <div className="topbar-search">
        <Search size={13} />
        <input placeholder="Search symbol, market…" />
      </div>

      {/* Session badges */}
      <div className="session-badges">
        <span className="session-badge open"><span className="session-badge-dot"/>NY</span>
        <span className="session-badge open"><span className="session-badge-dot"/>LON</span>
        <span className="session-badge closed"><span className="session-badge-dot"/>TKY</span>
        <span className="session-badge closed"><span className="session-badge-dot"/>SYD</span>
      </div>

      <div className="topbar-actions">
        <button className="topbar-btn" data-tip="Alerts"><Bell size={15} /><span className="notif-dot"/></button>
        <button className="topbar-btn" data-tip="Settings"><Settings size={15} /></button>
      </div>

      <div className="account-chip">
        <div className="account-avatar">AM</div>
        <div>
          <div className="account-chip-label">Balance</div>
          <div className="account-chip-balance">${fmt(ACCOUNT.balance)}</div>
        </div>
        <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
      </div>
    </header>
  );
}

/* ─── Watchlist ──────────────────────────────────────────────────────────── */
function WatchlistPanel({ activeInstrument, prices, onSelect }) {
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const cats = ['all', 'forex', 'crypto', 'indices', 'commodities'];

  const filtered = INSTRUMENTS.filter(i =>
    (cat === 'all' || i.category === cat) &&
    (i.symbol.toLowerCase().includes(search.toLowerCase()) || i.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <aside className="watchlist">
      <div className="watchlist-header">
        <div className="watchlist-title">Watchlist</div>
        <div className="watchlist-search">
          <Search size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input placeholder="Filter…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="watchlist-cats">
        {cats.map(c => (
          <button key={c} className={`cat-btn ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
            {c === 'all' ? 'All' : c === 'commodities' ? 'Comm.' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <div className="watchlist-list">
        {filtered.map(inst => {
          const p = prices[inst.symbol] ?? inst;
          const isPos = (p.changePct ?? 0) >= 0;
          const sparkData = Array.from({ length: 12 }, (_, i) =>
            p.bid * (1 + (Math.random() - 0.5) * 0.002)
          );
          return (
            <div
              key={inst.symbol}
              className={`watchlist-item ${activeInstrument?.symbol === inst.symbol ? 'active' : ''}`}
              onClick={() => onSelect(inst)}
            >
              <span className="wi-symbol">{inst.symbol}</span>
              <span className={`wi-bid ${isPos ? 'bull' : 'bear'}`}>{fmtPrice(p.bid, inst.digits)}</span>
              <span className="wi-name">{inst.name}</span>
              <span className={`wi-chg ${isPos ? 'bull' : 'bear'}`}>{pnlSign(p.changePct)}{p.changePct?.toFixed(2)}%</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

/* ─── Chart Panel (TV Lightweight Charts) ───────────────────────────────── */
function ChartPanel({ instrument, prices }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const candleRef    = useRef(null);
  const volRef       = useRef(null);
  const [tf, setTf]  = useState('5m');
  const [chartType, setChartType] = useState('candle');
  const [ohlc, setOhlc] = useState({ o: 0, h: 0, l: 0, c: 0, v: 0 });
  const price = prices[instrument?.symbol] ?? instrument;

  useEffect(() => {
    if (!containerRef.current) return;
    let chart, series, volSeries;

    const init = async () => {
      const { createChart, CrosshairMode } = await import('lightweight-charts');
      if (!containerRef.current) return;

      chart = createChart(containerRef.current, {
        width:  containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        layout: {
          background: { color: 'transparent' },
          textColor:  '#8B95A3',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
        },
        grid: {
          vertLines:   { color: '#1C2028', style: 1 },
          horzLines:   { color: '#1C2028', style: 1 },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: '#2E3847', style: 0, width: 1 },
          horzLine: { color: '#2E3847', style: 0, width: 1, labelBackgroundColor: '#141820' },
        },
        rightPriceScale: {
          borderColor: '#1C2028',
          scaleMargins: { top: 0.06, bottom: 0.25 },
        },
        timeScale: {
          borderColor: '#1C2028',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll:  true,
        handleScale:   true,
      });

      chartRef.current = chart;

      series = chart.addCandlestickSeries({
        upColor:       '#10D996',
        downColor:     '#FF3B5C',
        borderUpColor: '#10D996',
        borderDownColor: '#FF3B5C',
        wickUpColor:   '#10D996',
        wickDownColor: '#FF3B5C',
      });
      candleRef.current = series;

      volSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
      volRef.current = volSeries;

      const basePrice = instrument?.bid ?? 1.08452;
      const candles   = generateOHLCV(basePrice, 300);
      series.setData(candles);
      volSeries.setData(candles.map(c => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16,217,150,0.35)' : 'rgba(255,59,92,0.35)',
      })));

      chart.timeScale().fitContent();

      if (candles.length) {
        const last = candles[candles.length - 1];
        setOhlc({ o: last.open, h: last.high, l: last.low, c: last.close, v: last.volume });
      }

      // Crosshair update
      chart.subscribeCrosshairMove(param => {
        if (param.seriesData?.has(series)) {
          const bar = param.seriesData.get(series);
          setOhlc({ o: bar.open, h: bar.high, l: bar.low, c: bar.close, v: 0 });
        }
      });

      // Resize observer
      const ro = new ResizeObserver(() => {
        if (containerRef.current && chart) {
          chart.applyOptions({
            width:  containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      });
      ro.observe(containerRef.current);

      return () => { ro.disconnect(); chart.remove(); };
    };

    const cleanup = init();
    return () => { cleanup.then(fn => fn?.()); };
  }, [instrument?.symbol]);

  // Live tick simulation
  useEffect(() => {
    if (!candleRef.current || !volRef.current) return;
    const tick = setInterval(() => {
      const now   = Math.floor(Date.now() / 1000);
      const close = (prices[instrument?.symbol]?.bid) ?? 1.08452;
      const open  = close * (1 + (Math.random() - 0.5) * 0.0002);
      const high  = Math.max(open, close) * (1 + Math.random() * 0.0001);
      const low   = Math.min(open, close) * (1 - Math.random() * 0.0001);
      try {
        candleRef.current.update({ time: now, open, high, low, close });
        volRef.current.update({ time: now, value: Math.floor(Math.random() * 200000 + 20000), color: close >= open ? 'rgba(16,217,150,0.35)' : 'rgba(255,59,92,0.35)' });
      } catch {}
    }, 1500);
    return () => clearInterval(tick);
  }, [instrument?.symbol, prices]);

  const isUp = (price?.changePct ?? 0) >= 0;

  return (
    <div className="panel" style={{ flex: 1, borderBottom: 'none', borderRight: 'none', borderLeft: 'none' }}>
      {/* Chart Toolbar */}
      <div className="chart-toolbar">
        <div className="chart-symbol-display">
          <span className="csd-symbol">{instrument?.symbol ?? 'EUR/USD'}</span>
          <span className={`csd-price ${isUp ? 'bull' : 'bear'}`}>{fmtPrice(price?.bid, instrument?.digits ?? 5)}</span>
          <span className={`csd-change ${isUp ? 'bull' : 'bear'}`}>
            {pnlSign(price?.changePct)}{price?.changePct?.toFixed(2)}%
          </span>
        </div>

        <div className="tf-divider" />

        {TIMEFRAMES.map(t => (
          <button key={t} className={`tf-btn ${tf === t ? 'active' : ''}`} onClick={() => setTf(t)}>{t}</button>
        ))}

        <div className="tf-divider" />

        <button className={`indicator-btn ${chartType === 'candle' ? 'active' : ''}`} onClick={() => setChartType('candle')}>
          <CandlestickChart size={13} /> Candles
        </button>
        <button className={`indicator-btn ${chartType === 'line' ? 'active' : ''}`} onClick={() => setChartType('line')}>
          <LineChart size={13} /> Line
        </button>
        <button className="indicator-btn"><Activity size={13} /> Indicators</button>
        <button className="draw-btn"><SlidersHorizontal size={13} /> Drawing</button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          <button className="panel-btn"><Maximize2 size={13} /></button>
          <button className="panel-btn"><RefreshCw size={13} /></button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="chart-container" ref={containerRef} id="tv-chart">
        {/* OHLC overlay */}
        <div className="chart-ohlc-overlay">
          {[['O', ohlc.o], ['H', ohlc.h], ['L', ohlc.l], ['C', ohlc.c]].map(([label, val]) => (
            <div key={label} className="ohlc-item">
              <span className="ohlc-label">{label}</span>
              <span className={`ohlc-val ${label === 'H' ? 'bull' : label === 'L' ? 'bear' : ''}`}>
                {fmtPrice(val, instrument?.digits ?? 5)}
              </span>
            </div>
          ))}
          <div className="ohlc-item">
            <span className="ohlc-label">VOL</span>
            <span className="ohlc-val" style={{ color: 'var(--text-secondary)' }}>
              {(ohlc.v / 1000).toFixed(0)}K
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Depth of Market ────────────────────────────────────────────────────── */
function DepthOfMarket({ instrument }) {
  const [dom, setDom]  = useState(() => DOM_DATA(instrument?.bid ?? 1.08452));
  useEffect(() => {
    const iv = setInterval(() => setDom(DOM_DATA(instrument?.bid ?? 1.08452)), 800);
    return () => clearInterval(iv);
  }, [instrument?.symbol]);

  const asks = dom.filter(d => d.type === 'ask').reverse();
  const bids = dom.filter(d => d.type === 'bid').reverse();
  const maxVol = Math.max(...dom.map(d => d.volume));

  return (
    <div className="dom-panel panel">
      <div className="dom-header">
        <span className="panel-title">DOM</span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'var(--text-muted)' }}>{instrument?.symbol}</span>
      </div>
      <div className="dom-cols">
        <span>Price</span><span style={{ textAlign: 'right' }}>Volume</span><span style={{ textAlign: 'right' }}>Depth</span>
      </div>
      <div className="dom-list">
        {asks.map((row, i) => (
          <div key={`ask-${i}`} className="dom-row ask">
            <div className="dom-bar" style={{ width: `${(row.volume / maxVol) * 100}%` }} />
            <span className="dom-price">{fmtPrice(row.price, instrument?.digits ?? 5)}</span>
            <span className="dom-vol">{(row.volume / 1000).toFixed(1)}K</span>
            <span className="dom-depth">{(row.depth / 1000).toFixed(0)}K</span>
          </div>
        ))}
        <div className="dom-spread-row">
          <span className="dom-spread-label">SPREAD</span>
          <span className="dom-spread-val">{instrument?.spread ?? '0.6'} pts</span>
        </div>
        {bids.map((row, i) => (
          <div key={`bid-${i}`} className="dom-row bid">
            <div className="dom-bar" style={{ width: `${(row.volume / maxVol) * 100}%` }} />
            <span className="dom-price">{fmtPrice(row.price, instrument?.digits ?? 5)}</span>
            <span className="dom-vol">{(row.volume / 1000).toFixed(1)}K</span>
            <span className="dom-depth">{(row.depth / 1000).toFixed(0)}K</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Order Entry ────────────────────────────────────────────────────────── */
function OrderEntry({ instrument, prices, onTrade }) {
  const [side, setSide]    = useState('buy');
  const [type, setType]    = useState('Market');
  const [lots, setLots]    = useState('1.00');
  const [sl, setSl]        = useState('');
  const [tp, setTp]        = useState('');
  const [price, setPrice]  = useState('');

  const inst = prices[instrument?.symbol] ?? instrument;
  const bid  = inst?.bid ?? 0;
  const ask  = inst?.ask ?? 0;
  const spread = inst?.spread ?? 0;

  const margin = parseFloat(lots || 0) * ask * 1000 / 100;

  return (
    <div className="order-entry">
      <div className="oe-tabs">
        <button className={`oe-tab buy  ${side === 'buy'  ? 'active' : ''}`} onClick={() => setSide('buy') }>▲ BUY</button>
        <button className={`oe-tab sell ${side === 'sell' ? 'active' : ''}`} onClick={() => setSide('sell')}>▼ SELL</button>
      </div>

      <div className="oe-body">
        {/* Bid / Ask display */}
        <div className="oe-price-info">
          <div className="oe-price-info-item">
            <span className="oe-price-info-label">Bid</span>
            <span className="oe-price-info-val bear">{fmtPrice(bid, instrument?.digits ?? 5)}</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="oe-price-info-label">Spread</div>
            <div className="oe-spread">{spread} pts</div>
          </div>
          <div className="oe-price-info-item">
            <span className="oe-price-info-label">Ask</span>
            <span className="oe-price-info-val bull">{fmtPrice(ask, instrument?.digits ?? 5)}</span>
          </div>
        </div>

        {/* Order type */}
        <div className="oe-row">
          <label className="oe-label">Order Type</label>
          <div className="oe-type-grid">
            {['Market','Limit','Stop'].map(t => (
              <button key={t} className={`oe-type-btn ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>{t}</button>
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="oe-row">
          <label className="oe-label">Volume (Lots)</label>
          <div className="oe-input-wrap">
            <input className="oe-input" type="number" value={lots} step="0.01" min="0.01" onChange={e => setLots(e.target.value)} />
            <div className="oe-step-btns">
              <button className="oe-step-btn" onClick={() => setLots(v => (parseFloat(v)+0.01).toFixed(2))}>▲</button>
              <button className="oe-step-btn" onClick={() => setLots(v => Math.max(0.01, parseFloat(v)-0.01).toFixed(2))}>▼</button>
            </div>
            <span className="oe-unit">LOT</span>
          </div>
        </div>

        {/* Price (for limit/stop) */}
        {type !== 'Market' && (
          <div className="oe-row">
            <label className="oe-label">Price</label>
            <div className="oe-input-wrap">
              <input className="oe-input" type="number" placeholder={fmtPrice(bid, instrument?.digits ?? 5)} value={price} onChange={e => setPrice(e.target.value)} />
              <span className="oe-unit">{instrument?.symbol?.split('/')[1] ?? 'USD'}</span>
            </div>
          </div>
        )}

        {/* SL / TP */}
        <div className="oe-sltp">
          <div className="oe-row">
            <label className="oe-label">Stop Loss</label>
            <div className="oe-input-wrap">
              <input className="oe-input" type="number" placeholder="0.00" value={sl} onChange={e => setSl(e.target.value)} />
            </div>
          </div>
          <div className="oe-row">
            <label className="oe-label">Take Profit</label>
            <div className="oe-input-wrap">
              <input className="oe-input" type="number" placeholder="0.00" value={tp} onChange={e => setTp(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Margin info */}
        <div className="oe-margin-info">
          <span>Req. Margin</span>
          <span>${fmt(margin)}</span>
        </div>
        <div className="oe-margin-info">
          <span>Pip Value</span>
          <span>${(parseFloat(lots||0)*10).toFixed(2)}</span>
        </div>

        {/* Submit */}
        <div className="oe-submit-row">
          <button className={`oe-submit ${side}`} onClick={() => onTrade({ side, type, lots, sl, tp, instrument })}>
            {side === 'buy' ? '▲ BUY' : '▼ SELL'} {type.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Account Summary ────────────────────────────────────────────────────── */
function AccountSummary() {
  const [acct] = useState(ACCOUNT);
  const marginPct = Math.min((acct.margin / acct.equity) * 100, 100);
  const riskColor = marginPct < 20 ? 'var(--bull)' : marginPct < 50 ? 'var(--warn)' : 'var(--bear)';

  return (
    <div className="account-panel">
      <div className="panel-header">
        <span className="panel-title">Account</span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {acct.accountId} · {acct.leverage}
        </span>
      </div>

      <div className="account-grid">
        {[
          { label: 'Balance',      value: `$${fmt(acct.balance)}`,              sub: acct.currency },
          { label: 'Equity',       value: `$${fmt(acct.equity)}`,               sub: acct.accountType, cls: pnlClass(acct.equity - acct.balance) },
          { label: 'Unrealized P&L', value: `${pnlSign(acct.unrealizedPnl)}$${fmt(Math.abs(acct.unrealizedPnl))}`, cls: pnlClass(acct.unrealizedPnl) },
          { label: 'Today P&L',    value: `+$${fmt(acct.realizedPnlToday)}`,    cls: 'bull' },
          { label: 'Free Margin',  value: `$${fmt(acct.freeMargin)}`,           sub: `Used: $${fmt(acct.margin)}` },
          { label: 'Margin Level', value: `${fmt(acct.marginLevel)}%`,          cls: 'bull', sub: 'Safe' },
        ].map(s => (
          <div key={s.label} className="account-stat">
            <span className="account-stat-label">{s.label}</span>
            <span className={`account-stat-value ${s.cls || ''}`}>{s.value}</span>
            {s.sub && <span className="account-stat-sub">{s.sub}</span>}
          </div>
        ))}
      </div>

      {/* Risk Meter */}
      <div className="risk-meter">
        <div className="risk-title">Margin Usage</div>
        <div className="risk-bar-bg">
          <div className="risk-bar" style={{ width: `${marginPct}%`, background: riskColor }} />
        </div>
        <div className="risk-labels">
          <span>0%</span><span style={{ color: riskColor }}>{marginPct.toFixed(1)}%</span><span>100%</span>
        </div>
      </div>

      {/* P&L Sparkline */}
      <div className="pnl-chart">
        <div className="pnl-chart-header">
          <span className="pnl-chart-title">30-Day P&L</span>
          <span className="pnl-chart-val">+$3,567</span>
        </div>
        <PnLSparkline data={P_AND_L_HISTORY} />
      </div>
    </div>
  );
}

/* ─── Positions Table ────────────────────────────────────────────────────── */
function PositionsTable({ positions, onClose }) {
  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);
  return (
    <div className="bottom-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: '11px', color: 'var(--text-muted)' }}>
          {positions.length} positions · Total P&L:&nbsp;
          <span className={pnlClass(totalPnl)} style={{ fontWeight: 600 }}>{pnlSign(totalPnl)}${fmt(Math.abs(totalPnl))}</span>
        </span>
        <button style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', background: 'var(--bear-dim)', border: '1px solid var(--bear-dim)', color: 'var(--bear)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
          Close All
        </button>
      </div>
      <table className="data-table">
        <thead><tr>
          <th>Symbol</th><th>Type</th><th>Lots</th><th>Open Price</th><th>Current</th>
          <th>SL</th><th>TP</th><th>Swap</th><th>P&L</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {positions.map(p => (
            <tr key={p.id}>
              <td className="td-symbol">{p.symbol}</td>
              <td><span className={`td-badge ${p.type.toLowerCase()}`}>{p.type}</span></td>
              <td>{p.lots.toFixed(2)}</td>
              <td>{p.openPrice}</td>
              <td style={{ color: 'var(--text-primary)' }}>{p.currentPrice}</td>
              <td style={{ color: 'var(--bear)' }}>{p.sl || '—'}</td>
              <td style={{ color: 'var(--bull)' }}>{p.tp || '—'}</td>
              <td style={{ color: 'var(--text-muted)' }}>{p.swap}</td>
              <td className={`td-pnl ${p.pnl >= 0 ? 'pos' : 'neg'}`}>{pnlSign(p.pnl)}${fmt(Math.abs(p.pnl))}</td>
              <td>
                <div className="td-actions">
                  <button className="td-action-btn"><Edit size={10} /></button>
                  <button className="td-action-btn close" onClick={() => onClose(p.id)}>Close</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Pending Orders Table ───────────────────────────────────────────────── */
function OrdersTable({ orders }) {
  return (
    <div className="bottom-content">
      <table className="data-table">
        <thead><tr>
          <th>Symbol</th><th>Type</th><th>Lots</th><th>Price</th><th>Distance</th>
          <th>SL</th><th>TP</th><th>Expiry</th><th>Created</th><th>Actions</th>
        </tr></thead>
        <tbody>
          {orders.map(o => {
            const isBuy = o.type.includes('BUY');
            return (
              <tr key={o.id}>
                <td className="td-symbol">{o.symbol}</td>
                <td><span className={`td-badge ${isBuy ? 'buy' : 'sell'}`}>{o.type}</span></td>
                <td>{o.lots.toFixed(2)}</td>
                <td style={{ color: 'var(--text-primary)' }}>{o.price}</td>
                <td style={{ color: 'var(--text-muted)' }}>{o.distance > 0 ? '+' : ''}{o.distance}</td>
                <td style={{ color: 'var(--bear)' }}>{o.sl}</td>
                <td style={{ color: 'var(--bull)' }}>{o.tp}</td>
                <td style={{ color: 'var(--text-muted)' }}>{o.expiry}</td>
                <td style={{ color: 'var(--text-muted)' }}>{o.created}</td>
                <td>
                  <div className="td-actions">
                    <button className="td-action-btn"><Edit size={10} /></button>
                    <button className="td-action-btn close">Cancel</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Trade History ──────────────────────────────────────────────────────── */
function TradeHistory() {
  const totalProfit = TRADE_HISTORY.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const totalLoss   = TRADE_HISTORY.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0);
  const winRate     = (TRADE_HISTORY.filter(t => t.pnl > 0).length / TRADE_HISTORY.length * 100).toFixed(0);

  return (
    <div className="bottom-content">
      <div style={{ display: 'flex', gap: '1px', background: 'var(--border)', borderBottom: '1px solid var(--border)' }}>
        {[
          { label: 'Win Rate', value: `${winRate}%`, cls: 'bull' },
          { label: 'Gross Profit', value: `+$${fmt(totalProfit)}`, cls: 'bull' },
          { label: 'Gross Loss',   value: `-$${fmt(Math.abs(totalLoss))}`, cls: 'bear' },
          { label: 'Net P&L',      value: `+$${fmt(totalProfit + totalLoss)}`, cls: 'bull' },
          { label: 'Trades',       value: TRADE_HISTORY.length },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-elevated)', padding: '6px 16px', flex: 1 }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: '13px', fontWeight: 600 }} className={s.cls}>{s.value}</div>
          </div>
        ))}
      </div>
      <table className="data-table">
        <thead><tr>
          <th>Symbol</th><th>Type</th><th>Lots</th><th>Open</th><th>Close</th>
          <th>Open Time</th><th>Close Time</th><th>Duration</th><th>P&L</th>
        </tr></thead>
        <tbody>
          {TRADE_HISTORY.map(t => (
            <tr key={t.id}>
              <td className="td-symbol">{t.symbol}</td>
              <td><span className={`td-badge ${t.type.toLowerCase()}`}>{t.type}</span></td>
              <td>{t.lots.toFixed(2)}</td>
              <td>{t.openPrice}</td>
              <td>{t.closePrice}</td>
              <td style={{ color: 'var(--text-muted)' }}>{t.openTime}</td>
              <td style={{ color: 'var(--text-muted)' }}>{t.closeTime}</td>
              <td style={{ color: 'var(--text-muted)' }}>{t.duration}</td>
              <td className={`td-pnl ${t.pnl >= 0 ? 'pos' : 'neg'}`}>{pnlSign(t.pnl)}${fmt(Math.abs(t.pnl))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Economic Calendar ──────────────────────────────────────────────────── */
function EconomicCalendarPanel() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? ECONOMIC_CALENDAR : ECONOMIC_CALENDAR.filter(e => e.impact === filter);
  return (
    <div className="bottom-content">
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '6px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', letterSpacing: '0.04em' }}>FILTER:</span>
        {['all','high','medium','low'].map(f => (
          <button key={f} className={`cat-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ fontSize: '10px' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>
          {new Date().toLocaleDateString('en-US',{ weekday:'short', year:'numeric', month:'short', day:'numeric' })}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '60px 28px 28px 1fr 80px 80px 80px', gap: '0 8px', padding: '4px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
        {['Time','','Impact','Event','Forecast','Previous','Actual'].map(h => (
          <span key={h} style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: h === 'Forecast' || h === 'Previous' || h === 'Actual' ? 'right' : 'left' }}>{h}</span>
        ))}
      </div>
      {filtered.map(e => (
        <div key={e.id} className="cal-item">
          <span className="cal-time">{e.time}</span>
          <span className="cal-flag">{e.flag}</span>
          <div className={`cal-impact ${e.impact}`} />
          <span className="cal-event">{e.event}</span>
          <span className="cal-val">{e.forecast ?? '—'}</span>
          <span className="cal-val">{e.previous ?? '—'}</span>
          <span className={`cal-val ${e.actual ? (parseFloat(e.actual) > parseFloat(e.forecast) ? 'actual-up' : 'actual-down') : ''}`}>{e.actual ?? '—'}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── News Panel ─────────────────────────────────────────────────────────── */
function NewsPanel() {
  return (
    <div className="bottom-content">
      {NEWS.map(n => (
        <div key={n.id} className="news-item">
          <div className={`news-sentiment ${n.sentiment}`} />
          <div className="news-body">
            <div className="news-meta">
              <span className="news-source">{n.source}</span>
              <span className="news-time">{n.time}</span>
              <span className="news-symbol">{n.symbol}</span>
            </div>
            <span className="news-headline-text news-headline">{n.headline}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Bottom Panel (Tab Container) ──────────────────────────────────────── */
function BottomPanel({ positions, onClosePosition }) {
  const [tab, setTab] = useState('positions');

  const tabs = [
    { id: 'positions', label: 'Positions',  icon: <Layers size={12} />,      badge: positions.length },
    { id: 'orders',    label: 'Orders',     icon: <BookOpen size={12} />,     badge: PENDING_ORDERS.length },
    { id: 'history',   label: 'History',    icon: <Clock size={12} />,        badge: null },
    { id: 'calendar',  label: 'Calendar',   icon: <Calendar size={12} />,     badge: ECONOMIC_CALENDAR.filter(e => e.impact === 'high').length },
    { id: 'news',      label: 'News',       icon: <Newspaper size={12} />,    badge: null },
  ];

  return (
    <div className="bottom-panel">
      <div className="bottom-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`bottom-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
            {t.badge != null && <span className="tab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'positions' && <PositionsTable positions={positions} onClose={onClosePosition} />}
      {tab === 'orders'    && <OrdersTable orders={PENDING_ORDERS} />}
      {tab === 'history'   && <TradeHistory />}
      {tab === 'calendar'  && <EconomicCalendarPanel />}
      {tab === 'news'      && <NewsPanel />}
    </div>
  );
}

/* ─── Status Bar ─────────────────────────────────────────────────────────── */
function StatusBar({ ping }) {
  const now = new Date();
  return (
    <footer className="statusbar">
      <div className="statusbar-item">
        <div className="status-dot green" />
        <span>Connected</span>
      </div>
      <div className="statusbar-item">
        <Wifi size={10} />
        <span>OB-LIVE-01</span>
      </div>
      <div className="statusbar-item">
        <Zap size={10} />
        <span>{ping}ms</span>
      </div>
      <div className="statusbar-item">
        <Database size={10} />
        <span>ECN Pro · 1:100</span>
      </div>
      <div className="statusbar-item">
        <span>v2.4.1</span>
      </div>
      <div className="statusbar-item">
        <Link href="/mobile" style={{ color: 'inherit', textDecoration: 'none' }}>Mobile</Link>
      </div>
      <div className="statusbar-item">
        <span>{now.toLocaleTimeString('en-US', { hour12: false })} UTC</span>
      </div>
    </footer>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export default function TradingDashboard() {
  const [activeInstrument, setActiveInstrument] = useState(INSTRUMENTS[0]);
  const [prices, setPrices]       = useState(() => Object.fromEntries(INSTRUMENTS.map(i => [i.symbol, { ...i }])));
  const [positions, setPositions] = useState(OPEN_POSITIONS);
  const [toasts, setToasts]       = useState([]);
  const [ping, setPing]           = useState(12);

  // Simulate live prices
  useEffect(() => {
    const iv = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        INSTRUMENTS.forEach(inst => {
          const p = next[inst.symbol];
          const tick = (Math.random() - 0.5) * inst.pip * 4;
          const newBid = parseFloat((p.bid + tick).toFixed(inst.digits));
          const newAsk = parseFloat((newBid + inst.spread * inst.pip).toFixed(inst.digits));
          next[inst.symbol] = { ...p, bid: newBid, ask: newAsk, change: newBid - inst.bid };
        });
        return next;
      });
      setPing(Math.floor(Math.random() * 8 + 8));
    }, 700);
    return () => clearInterval(iv);
  }, []);

  // Update positions P&L
  useEffect(() => {
    const iv = setInterval(() => {
      setPositions(prev => prev.map(pos => {
        const p = prices[pos.symbol];
        if (!p) return pos;
        const diff = pos.type === 'BUY'
          ? (p.bid - pos.openPrice)
          : (pos.openPrice - p.ask);
        const pnl = diff * pos.lots * 100000;
        return { ...pos, currentPrice: pos.type === 'BUY' ? p.bid : p.ask, pnl: parseFloat(pnl.toFixed(2)) };
      }));
    }, 700);
    return () => clearInterval(iv);
  }, [prices]);

  const addToast = useCallback((text, sub, type = 'bull') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, sub, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const handleTrade = useCallback(({ side, type, lots, instrument }) => {
    const inst = prices[instrument?.symbol] ?? instrument;
    const fillPrice = side === 'buy' ? inst.ask : inst.bid;
    addToast(
      `${side.toUpperCase()} ${lots} lots ${instrument?.symbol}`,
      `${type} filled @ ${fmtPrice(fillPrice, instrument?.digits ?? 5)}`,
      side === 'buy' ? 'bull' : 'bear'
    );
  }, [prices, addToast]);

  const handleClosePosition = useCallback((id) => {
    const pos = positions.find(p => p.id === id);
    if (!pos) return;
    setPositions(prev => prev.filter(p => p.id !== id));
    addToast(
      `Position closed: ${pos.symbol}`,
      `P&L: ${pnlSign(pos.pnl)}$${fmt(Math.abs(pos.pnl))}`,
      pos.pnl >= 0 ? 'bull' : 'bear'
    );
  }, [positions, addToast]);

  return (
    <>
      <Head>
        <title>Obsidian — Trading Terminal</title>
        <meta name="description" content="Professional multi-asset trading platform" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      <div className="dashboard-root">
        <TopBar
          activeInstrument={activeInstrument}
          prices={prices}
          onSymbolClick={setActiveInstrument}
        />

        <div className="dashboard-body">
          {/* Left — Watchlist */}
          <WatchlistPanel
            activeInstrument={activeInstrument}
            prices={prices}
            onSelect={setActiveInstrument}
          />

          {/* Center */}
          <div className="main-area">
            <div className="chart-dom-row">
              <div className="chart-section">
                <ChartPanel instrument={activeInstrument} prices={prices} />
              </div>
              <DepthOfMarket instrument={prices[activeInstrument?.symbol] ?? activeInstrument} />
            </div>

            <BottomPanel positions={positions} onClosePosition={handleClosePosition} />
          </div>

          {/* Right — Order Entry + Account */}
          <div className="right-sidebar">
            <OrderEntry instrument={activeInstrument} prices={prices} onTrade={handleTrade} />
            <AccountSummary />
          </div>
        </div>

        <StatusBar ping={ping} />
        <ToastContainer toasts={toasts} />
      </div>
    </>
  );
}
