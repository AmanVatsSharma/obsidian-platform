'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import {
  Home, BarChart2, TrendingUp, Briefcase, MoreHorizontal,
  Search, Bell, Settings, ChevronDown, ChevronLeft, ChevronRight,
  X, Plus, Minus, RefreshCw, Wifi, Zap, Activity, Layers,
  BookOpen, Clock, Newspaper, Calendar, ArrowUpRight, ArrowDownRight,
  Edit, Trash2, Shield, LogOut, User, DollarSign, AlertCircle,
  CandlestickChart, SlidersHorizontal,
} from 'lucide-react';
import {
  INSTRUMENTS, OPEN_POSITIONS, PENDING_ORDERS, TRADE_HISTORY,
  ACCOUNT, DOM_DATA, ECONOMIC_CALENDAR, NEWS, TIMEFRAMES,
  generateOHLCV, P_AND_L_HISTORY,
} from '../lib/mockData';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt    = (n, d = 2) => n?.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) ?? '—';
const fmtP   = (n, dig)   => n?.toFixed(dig ?? 5) ?? '—';
const sign   = (n)        => n >= 0 ? '+' : '';
const pc     = (n)        => n >= 0 ? 'bull' : 'bear';
const catIcon = (cat) => ({ forex:'FX', crypto:'₿', indices:'IX', commodities:'CM' }[cat] ?? 'FX');

/* ─── Sparkline ──────────────────────────────────────────────────────────── */
function Spark({ data, color, w = 56, h = 22 }) {
  if (!data?.length) return <svg width={w} height={h} />;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 2) - 1}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display:'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ─── PnL Area Chart ─────────────────────────────────────────────────────── */
function PnLArea({ data, w = '100%', h = 44 }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(300);
  useEffect(() => {
    if (ref.current) setWidth(ref.current.clientWidth);
  }, []);
  if (!data?.length) return <div style={{ height: h }} />;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${h - ((v - mn) / rng) * (h - 4) - 2}`);
  const fill = `M 0,${h} L ${pts.join(' L ')} L ${width},${h} Z`;
  return (
    <div ref={ref} style={{ width: '100%', height: h }}>
      <svg width="100%" height={h} viewBox={`0 0 ${width} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="m-pnl-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10D996" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10D996" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={fill} fill="url(#m-pnl-g)" />
        <polyline points={pts.join(' ')} fill="none" stroke="#10D996" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function ToastLayer({ toasts }) {
  return (
    <div className="m-toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`m-toast ${t.type ?? 'info'}`}>
          <div className="m-toast-dot" />
          <div>
            <div className="m-toast-text">{t.text}</div>
            {t.sub && <div className="m-toast-sub">{t.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Screen 1: Home ─────────────────────────────────────────────────────── */
function HomeScreen({ prices, onSymbol, onTrade }) {
  const acct = ACCOUNT;
  const totalPnl = OPEN_POSITIONS.reduce((s, p) => s + p.pnl, 0);

  return (
    <div className="screen">
      {/* Top bar */}
      <div className="m-topbar">
        <div className="m-topbar-logo"><div className="m-logo-dot" />OBSIDIAN</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="status-pill"><div className="status-pill-dot" />LIVE</div>
          <button className="m-icon-btn"><Bell size={18} /><span className="m-notif-badge" /></button>
          <div className="m-avatar">AM</div>
        </div>
      </div>

      <div className="screen-scroll">
        {/* Equity Hero */}
        <div className="equity-hero">
          <div className="equity-label">Total Equity</div>
          <div className="equity-amount">${fmt(acct.equity)}</div>
          <div className="equity-delta">
            <div className={`equity-delta-pill ${pc(totalPnl)}`}>
              {pc(totalPnl) === 'bull' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {sign(totalPnl)}${fmt(Math.abs(totalPnl))} today
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>
              {sign(acct.unrealizedPnl)}${fmt(Math.abs(acct.unrealizedPnl))} unrealised
            </div>
          </div>
          <PnLArea data={P_AND_L_HISTORY} h={44} />
          <div className="equity-meta">
            {[
              { l:'Balance',     v: `$${fmt(acct.balance)}` },
              { l:'Free Margin', v: `$${fmt(acct.freeMargin)}` },
              { l:'Margin Lvl',  v: `${fmt(acct.marginLevel)}%`, c:'bull' },
              { l:'Drawdown',    v: `${acct.drawdownPct}%`,       c:'bear' },
            ].map(s => (
              <div key={s.l} className="equity-meta-item">
                <span className="equity-meta-label">{s.l}</span>
                <span className={`equity-meta-value mono ${s.c ?? ''}`}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions */}
        <div className="sessions-row">
          {[{n:'London',open:true},{n:'New York',open:true},{n:'Tokyo',open:false},{n:'Sydney',open:false}].map(s => (
            <div key={s.n} className={`session-pill ${s.open ? 'open' : 'closed'}`}>
              <div className="session-dot" />{s.n}
            </div>
          ))}
        </div>

        {/* Quick stats */}
        <div className="quick-stats">
          {[
            { l:'Open Positions', v: `${OPEN_POSITIONS.length}`, sub:'active trades' },
            { l:'Today P&L',      v: `+$${fmt(acct.realizedPnlToday)}`, c:'bull' },
            { l:'Pending Orders', v: `${PENDING_ORDERS.length}`,  sub:'waiting' },
            { l:'Win Rate',       v: `67%`, c:'bull', sub:'last 30 trades' },
          ].map(s => (
            <div key={s.l} className="stat-tile">
              <div className="stat-tile-label">{s.l}</div>
              <div className={`stat-tile-value mono ${s.c ?? ''}`}>{s.v}</div>
              {s.sub && <div style={{ fontSize:'10px', color:'var(--text-muted)', fontFamily:'var(--font-data)', marginTop:'1px' }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Quick trade */}
        <div className="quick-trade-row">
          <button className="qt-btn buy" onClick={() => onTrade('buy')}>
            <ArrowUpRight size={16} />BUY
            <span className="qt-btn-price">{fmtP(prices[INSTRUMENTS[0].symbol]?.ask, INSTRUMENTS[0].digits)}</span>
          </button>
          <button className="qt-btn sell" onClick={() => onTrade('sell')}>
            <ArrowDownRight size={16} />SELL
            <span className="qt-btn-price">{fmtP(prices[INSTRUMENTS[0].symbol]?.bid, INSTRUMENTS[0].digits)}</span>
          </button>
        </div>

        {/* Watchlist strip */}
        <div className="section-label">Watchlist</div>
        <div className="watchlist-strip">
          <div className="watchlist-strip-scroll">
            {INSTRUMENTS.slice(0, 10).map((inst, i) => {
              const p = prices[inst.symbol] ?? inst;
              const up = p.changePct >= 0;
              return (
                <div key={inst.symbol} className={`wl-chip ${i === 0 ? 'active' : ''}`} onClick={() => onSymbol(inst)}>
                  <div className="wl-chip-symbol">{inst.symbol}</div>
                  <div className={`wl-chip-price mono ${up ? 'bull' : 'bear'}`}>{fmtP(p.bid, inst.digits)}</div>
                  <div className={`wl-chip-chg ${up ? 'bull' : 'bear'}`}>{sign(p.changePct)}{p.changePct?.toFixed(2)}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent positions */}
        <div className="section-label">Open Positions</div>
        <div className="m-card">
          {OPEN_POSITIONS.slice(0, 3).map(pos => (
            <div key={pos.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
              <div className={`pos-badge ${pos.type.toLowerCase()}`}>{pos.type}</div>
              <div className="pos-info">
                <div className="pos-symbol">{pos.symbol}</div>
                <div className="pos-meta">{pos.lots} lots @ {pos.openPrice}</div>
              </div>
              <div className="pos-pnl">
                <div className={`pos-pnl-val ${pc(pos.pnl)}`}>{sign(pos.pnl)}${fmt(Math.abs(pos.pnl))}</div>
                <div className={`pos-pnl-pct ${pc(pos.pnl)}`}>{sign(pos.pnlPct)}{pos.pnlPct?.toFixed(2)}%</div>
              </div>
            </div>
          ))}
          <div style={{ padding:'10px 14px', textAlign:'center', fontSize:'12px', color:'var(--accent)', cursor:'pointer' }}>
            View all {OPEN_POSITIONS.length} positions →
          </div>
        </div>

        <div style={{ height: '16px' }} />
      </div>
    </div>
  );
}

/* ─── Screen 2: Chart ────────────────────────────────────────────────────── */
function ChartScreen({ instrument, prices, onTrade, onBack }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const candleRef    = useRef(null);
  const volRef       = useRef(null);
  const [tf, setTf]  = useState('5m');
  const [ohlc, setOhlc] = useState({ o:0, h:0, l:0, c:0 });
  const price = prices[instrument?.symbol] ?? instrument;
  const isUp  = (price?.changePct ?? 0) >= 0;

  useEffect(() => {
    if (!containerRef.current) return;
    let chart;
    const init = async () => {
      const { createChart, CrosshairMode } = await import('lightweight-charts');
      if (!containerRef.current) return;
      chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        layout: { background:{ color:'transparent' }, textColor:'#8B95A3', fontFamily:"'IBM Plex Mono', monospace", fontSize:10 },
        grid: { vertLines:{ color:'#1C2028', style:1 }, horzLines:{ color:'#1C2028', style:1 } },
        crosshair: { mode: CrosshairMode.Normal, vertLine:{ color:'#2E3847', style:0, width:1 }, horzLine:{ color:'#2E3847', style:0, width:1, labelBackgroundColor:'#141820' } },
        rightPriceScale: { borderColor:'#1C2028', scaleMargins:{ top:0.06, bottom:0.28 } },
        timeScale: { borderColor:'#1C2028', timeVisible:true, secondsVisible:false },
        handleScroll: true, handleScale: true,
      });
      chartRef.current = chart;
      const series = chart.addCandlestickSeries({
        upColor:'#10D996', downColor:'#FF3B5C',
        borderUpColor:'#10D996', borderDownColor:'#FF3B5C',
        wickUpColor:'#10D996', wickDownColor:'#FF3B5C',
      });
      candleRef.current = series;
      const volSeries = chart.addHistogramSeries({ priceFormat:{ type:'volume' }, priceScaleId:'volume' });
      chart.priceScale('volume').applyOptions({ scaleMargins:{ top:0.82, bottom:0 } });
      volRef.current = volSeries;
      const candles = generateOHLCV(instrument?.bid ?? 1.08452, 200);
      series.setData(candles);
      volSeries.setData(candles.map(c => ({ time:c.time, value:c.volume, color: c.close>=c.open ? 'rgba(16,217,150,0.35)':'rgba(255,59,92,0.35)' })));
      chart.timeScale().fitContent();
      if (candles.length) { const l = candles[candles.length-1]; setOhlc({ o:l.open, h:l.high, l:l.low, c:l.close }); }
      chart.subscribeCrosshairMove(param => {
        if (param.seriesData?.has(series)) { const b = param.seriesData.get(series); setOhlc({ o:b.open, h:b.high, l:b.low, c:b.close }); }
      });
      const ro = new ResizeObserver(() => {
        if (containerRef.current && chart) chart.applyOptions({ width:containerRef.current.clientWidth, height:containerRef.current.clientHeight });
      });
      ro.observe(containerRef.current);
      return () => { ro.disconnect(); chart.remove(); };
    };
    const cleanup = init();
    return () => { cleanup.then(fn => fn?.()); };
  }, [instrument?.symbol]);

  useEffect(() => {
    if (!candleRef.current) return;
    const iv = setInterval(() => {
      const close = prices[instrument?.symbol]?.bid ?? 1.08452;
      const open  = close * (1 + (Math.random()-0.5)*0.0002);
      const high  = Math.max(open,close)*(1+Math.random()*0.0001);
      const low   = Math.min(open,close)*(1-Math.random()*0.0001);
      try { candleRef.current.update({ time: Math.floor(Date.now()/1000), open, high, low, close }); } catch {}
    }, 1500);
    return () => clearInterval(iv);
  }, [instrument?.symbol, prices]);

  return (
    <div className="chart-screen" style={{ paddingBottom: 0 }}>
      {/* Symbol bar */}
      <div className="chart-sym-bar">
        <button className="m-icon-btn" onClick={onBack} style={{ marginLeft:'-6px' }}><ChevronLeft size={20} /></button>
        <div>
          <div className="chart-sym-name">{instrument?.symbol}</div>
          <div style={{ fontSize:'10px', color:'var(--text-muted)', fontFamily:'var(--font-data)' }}>{instrument?.name}</div>
        </div>
        <div className={`chart-sym-price ${isUp?'bull':'bear'}`}>{fmtP(price?.bid, instrument?.digits)}</div>
        <div className={`chart-sym-badge ${isUp?'bull':'bear'}`}>{sign(price?.changePct)}{price?.changePct?.toFixed(2)}%</div>
        <div className="chart-sym-spread" style={{ marginLeft:'auto' }}>Spd: {instrument?.spread}</div>
      </div>

      {/* TF bar */}
      <div className="chart-tf-bar">
        {TIMEFRAMES.map(t => (
          <button key={t} className={`m-tf-btn ${tf===t?'active':''}`} onClick={() => setTf(t)}>{t}</button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:'4px', flexShrink:0 }}>
          <button className="m-icon-btn" style={{ width:'28px', height:'28px' }}><Activity size={13} /></button>
          <button className="m-icon-btn" style={{ width:'28px', height:'28px' }}><SlidersHorizontal size={13} /></button>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-wrap" ref={containerRef}>
        <div className="chart-ohlc-bar">
          {[['O',ohlc.o],['H',ohlc.h,'bull'],['L',ohlc.l,'bear'],['C',ohlc.c]].map(([l,v,c]) => (
            <div key={l} className="ohlc-item">
              <span className="ohlc-l">{l}</span>
              <span className={`ohlc-v ${c??''}`}>{fmtP(v, instrument?.digits)}</span>
            </div>
          ))}
        </div>
        <div className="dom-swipe-hint">↑ Swipe up for DOM</div>
      </div>

      {/* Trade bar */}
      <div className="chart-trade-bar">
        <button className="chart-trade-btn sell" onClick={() => onTrade('sell', instrument)}>
          ▼ SELL
          <div className="chart-trade-price">{fmtP(price?.bid, instrument?.digits)}</div>
        </button>
        <button className="chart-trade-btn buy" onClick={() => onTrade('buy', instrument)}>
          ▲ BUY
          <div className="chart-trade-price">{fmtP(price?.ask, instrument?.digits)}</div>
        </button>
      </div>
    </div>
  );
}

/* ─── Screen 3: Trade Ticket (Bottom Sheet) ──────────────────────────────── */
function TradeTicket({ instrument, prices, onClose, onConfirm }) {
  const [side, setSide]   = useState('buy');
  const [otype, setOtype] = useState('Market');
  const [lots, setLots]   = useState(1.00);
  const [sl, setSl]       = useState('');
  const [tp, setTp]       = useState('');
  const [holding, setHolding] = useState(false);
  const holdRef = useRef(null);

  const inst  = prices[instrument?.symbol] ?? instrument ?? INSTRUMENTS[0];
  const p     = prices[inst.symbol] ?? inst;
  const bid   = p?.bid ?? 0;
  const ask   = p?.ask ?? 0;
  const dig   = inst?.digits ?? 5;
  const margin = lots * ask * 1000 / 100;
  const pipVal = lots * 10;

  const adjustLots = (d) => setLots(v => Math.max(0.01, parseFloat((v + d).toFixed(2))));
  const presets = [0.01, 0.05, 0.10, 0.50, 1.00, 2.00];

  const startHold = () => {
    setHolding(true);
    holdRef.current = setTimeout(() => {
      onConfirm({ side, otype, lots, sl, tp, instrument: inst });
      onClose();
    }, 900);
  };
  const endHold = () => {
    setHolding(false);
    clearTimeout(holdRef.current);
  };

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="sheet-handle"><div className="sheet-handle-bar" /></div>
        <div className="sheet-header">
          <CandlestickChart size={18} style={{ color:'var(--accent)' }} />
          <span className="sheet-title">{inst.symbol}</span>
          <div style={{ fontSize:'12px', color:'var(--text-muted)', fontFamily:'var(--font-data)' }}>{inst.name}</div>
          <button className="sheet-close" onClick={onClose}><X size={13} /></button>
        </div>

        {/* Buy / Sell toggle */}
        <div className="side-toggle">
          <button className={`side-btn buy ${side==='buy'?'active':''}`} onClick={() => setSide('buy')}>▲ BUY</button>
          <button className={`side-btn sell ${side==='sell'?'active':''}`} onClick={() => setSide('sell')}>▼ SELL</button>
        </div>

        {/* Big bid/ask */}
        <div className="bidask-display">
          <div className="ba-side">
            <div className="ba-label">BID</div>
            <div className="ba-price bear">{fmtP(bid, dig)}</div>
          </div>
          <div className="ba-spread">
            <div style={{ fontSize:'9px', letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--text-muted)', fontFamily:'var(--font-data)' }}>SPD</div>
            <div style={{ fontFamily:'var(--font-data)', fontSize:'13px', fontWeight:'700', color:'var(--warn)' }}>{inst.spread}</div>
          </div>
          <div className="ba-side">
            <div className="ba-label">ASK</div>
            <div className="ba-price bull">{fmtP(ask, dig)}</div>
          </div>
        </div>

        {/* Order type */}
        <div className="order-type-row">
          {['Market','Limit','Stop','Stop Limit'].map(t => (
            <button key={t} className={`ot-btn ${otype===t?'active':''}`} onClick={() => setOtype(t)}>{t}</button>
          ))}
        </div>

        {/* Limit price (if not market) */}
        {otype !== 'Market' && (
          <div style={{ margin:'14px 16px 0' }}>
            <div className="sltp-label">Price</div>
            <div className="sltp-input-wrap" style={{ marginTop:'5px' }}>
              <input className="sltp-input" type="number" placeholder={fmtP(bid, dig)} />
              <span style={{ padding:'0 12px', fontSize:'11px', color:'var(--text-muted)', fontFamily:'var(--font-data)' }}>{inst.symbol?.split('/')[1] ?? 'USD'}</span>
            </div>
          </div>
        )}

        {/* Lot wheel */}
        <div className="lot-wheel">
          <div className="lot-wheel-label">Volume (Lots)</div>
          <div className="lot-wheel-row">
            <button className="lot-spin-btn" onClick={() => adjustLots(-0.01)}>−</button>
            <div>
              <div className="lot-display">{lots.toFixed(2)}</div>
              <div className="lot-unit">LOTS · ${fmt(lots * 100000 * ask / 1000)} notional</div>
            </div>
            <button className="lot-spin-btn" onClick={() => adjustLots(0.01)}>+</button>
          </div>
          <div className="lot-presets">
            {presets.map(p => (
              <button key={p} className="lot-preset" onClick={() => setLots(p)}>{p}</button>
            ))}
          </div>
        </div>

        {/* SL / TP */}
        <div className="sltp-row">
          <div className="sltp-item">
            <div className="sltp-label">Stop Loss</div>
            <div className="sltp-input-wrap">
              <input className="sltp-input" type="number" placeholder="0.00000" value={sl} onChange={e => setSl(e.target.value)} />
            </div>
          </div>
          <div className="sltp-item">
            <div className="sltp-label">Take Profit</div>
            <div className="sltp-input-wrap">
              <input className="sltp-input" type="number" placeholder="0.00000" value={tp} onChange={e => setTp(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Trade info */}
        <div className="trade-info">
          {[
            { l:'Req. Margin', v:`$${fmt(margin)}` },
            { l:'Pip Value',   v:`$${fmt(pipVal)}` },
            { l:'Leverage',    v:`1:${ACCOUNT.leverage.split(':')[1]}` },
            { l:'Commission',  v:`$${fmt(lots*7)}` },
          ].map(i => (
            <div key={i.l} className="ti-item">
              <span className="ti-label">{i.l}</span>
              <span className="ti-value mono">{i.v}</span>
            </div>
          ))}
        </div>

        {/* Hold to confirm */}
        <div className="hold-btn-wrap">
          <button
            className={`hold-btn ${side}`}
            onMouseDown={startHold} onMouseUp={endHold} onMouseLeave={endHold}
            onTouchStart={startHold} onTouchEnd={endHold}
          >
            <div className={`hold-btn-progress ${holding?'filling':''}`} />
            {side === 'buy' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            {side === 'buy' ? '▲ BUY' : '▼ SELL'} {otype.toUpperCase()}
          </button>
          <div className="hold-hint">Hold to confirm order • Release to cancel</div>
        </div>

        <div style={{ height:'8px' }} />
      </div>
    </>
  );
}

/* ─── Screen 4: Portfolio ────────────────────────────────────────────────── */
function PortfolioScreen({ positions, prices, onClose, onTrade }) {
  const [swiped, setSwiped] = useState({});
  const [tab, setTab] = useState('open');
  const totalPnl = positions.reduce((s,p) => s+p.pnl, 0);
  const equity = ACCOUNT.equity;

  const toggleSwipe = (id) => setSwiped(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="screen">
      <div className="m-topbar">
        <div className="m-topbar-title">Portfolio</div>
        <div style={{ marginLeft:'auto', display:'flex', gap:'4px' }}>
          <button className="m-icon-btn"><SlidersHorizontal size={17} /></button>
          <button className="m-icon-btn"><RefreshCw size={17} /></button>
        </div>
      </div>

      <div className="screen-scroll">
        {/* Summary */}
        <div className="portfolio-summary">
          <div style={{ fontSize:'10px', letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)', fontFamily:'var(--font-data)', marginBottom:'4px' }}>Total Equity</div>
          <div className="ps-equity">${fmt(equity)}</div>
          <div className="ps-deltas">
            <div className={`ps-delta ${pc(totalPnl)}`}>{sign(totalPnl)}${fmt(Math.abs(totalPnl))} open P&L</div>
            <div className="ps-delta bull">+${fmt(ACCOUNT.realizedPnlToday)} today</div>
          </div>
          <PnLArea data={P_AND_L_HISTORY} h={40} />
          <div className="ps-stat-row" style={{ marginTop:'10px' }}>
            {[
              { l:'Margin',  v:`$${fmt(ACCOUNT.margin)}` },
              { l:'Free',    v:`$${fmt(ACCOUNT.freeMargin)}` },
              { l:'Level',   v:`${fmt(ACCOUNT.marginLevel)}%`, c:'bull' },
            ].map(s => (
              <div key={s.l} className="ps-stat">
                <div className="ps-stat-label">{s.l}</div>
                <div className={`ps-stat-value mono ${s.c??''}`}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-row">
          {[
            {id:'open',   label:`Open (${positions.length})`},
            {id:'pending',label:`Pending (${PENDING_ORDERS.length})`},
          ].map(t => (
            <button key={t.id} className={`m-tab ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {tab === 'open' && (
          <>
            <div className="swipe-hint">← Swipe left on a position to close</div>
            {positions.map(pos => (
              <div key={pos.id} className="position-item">
                <div className="position-swipe-bg">
                  <button
                    className="pos-close-btn-bg"
                    onClick={() => onClose(pos.id)}
                  >CLOSE</button>
                </div>
                <div
                  className={`position-inner ${swiped[pos.id] ? 'swiped' : ''}`}
                  onClick={() => toggleSwipe(pos.id)}
                >
                  <div className={`pos-badge ${pos.type.toLowerCase()}`}>{pos.type}</div>
                  <div className="pos-info">
                    <div className="pos-symbol">{pos.symbol}</div>
                    <div className="pos-meta">{pos.lots} lots · @ {pos.openPrice}</div>
                    <div style={{ fontSize:'10px', color:'var(--text-muted)', fontFamily:'var(--font-data)', marginTop:'1px' }}>
                      SL: <span className="bear">{pos.sl || '—'}</span> · TP: <span className="bull">{pos.tp || '—'}</span>
                    </div>
                  </div>
                  <div className="pos-pnl">
                    <div className={`pos-pnl-val ${pc(pos.pnl)}`}>{sign(pos.pnl)}${fmt(Math.abs(pos.pnl))}</div>
                    <div className={`pos-pnl-pct ${pc(pos.pnl)}`}>{sign(pos.pnl)}{Math.abs(pos.pnlPct)?.toFixed(2)}%</div>
                    <div style={{ fontSize:'9px', color:'var(--text-muted)', marginTop:'2px', fontFamily:'var(--font-data)' }}>{pos.currentPrice}</div>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ padding:'14px 16px', display:'flex', gap:'10px' }}>
              <button style={{ flex:1, padding:'12px', borderRadius:'var(--r-lg)', background:'var(--bear-dim)', border:'1px solid rgba(255,59,92,0.25)', color:'var(--bear)', fontSize:'13px', fontWeight:'700', cursor:'pointer', fontFamily:'var(--font-display)' }}>
                Close All
              </button>
            </div>
          </>
        )}

        {tab === 'pending' && (
          <>
            {PENDING_ORDERS.map(o => {
              const isBuy = o.type.includes('BUY');
              return (
                <div key={o.id} className="position-item">
                  <div className="position-inner">
                    <div className={`pos-badge ${isBuy?'buy':'sell'}`}>{isBuy?'BUY':'SELL'}</div>
                    <div className="pos-info">
                      <div className="pos-symbol">{o.symbol}</div>
                      <div className="pos-meta">{o.type} · {o.lots} lots @ {o.price}</div>
                      <div style={{ fontSize:'10px', color:'var(--text-muted)', fontFamily:'var(--font-data)', marginTop:'1px' }}>Expiry: {o.expiry}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <button style={{ padding:'5px 12px', borderRadius:'var(--r-sm)', background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-muted)', fontSize:'11px', cursor:'pointer' }}>Cancel</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        <div style={{ height:'16px' }} />
      </div>
    </div>
  );
}

/* ─── Screen 5: Markets ──────────────────────────────────────────────────── */
function MarketsScreen({ prices, onSelect }) {
  const [search, setSearch] = useState('');
  const [cat, setCat]       = useState('all');
  const cats = ['all','forex','crypto','indices','commodities'];

  const filtered = INSTRUMENTS.filter(i =>
    (cat === 'all' || i.category === cat) &&
    (i.symbol.toLowerCase().includes(search.toLowerCase()) || i.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="screen">
      <div className="m-topbar">
        <div className="m-topbar-title">Markets</div>
        <div style={{ marginLeft:'auto', display:'flex', gap:'4px' }}>
          <button className="m-icon-btn"><Bell size={17} /></button>
          <button className="m-icon-btn"><Settings size={17} /></button>
        </div>
      </div>

      <div className="screen-scroll">
        <div className="markets-search">
          <Search size={16} style={{ color:'var(--text-muted)', flexShrink:0 }} />
          <input placeholder="Search symbol or market…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex' }}><X size={14} /></button>}
        </div>

        <div className="cat-scroll">
          {cats.map(c => (
            <button key={c} className={`m-cat-btn ${cat===c?'active':''}`} onClick={() => setCat(c)}>
              {c === 'all' ? 'All Markets' : c === 'commodities' ? 'Commodities' : c.charAt(0).toUpperCase()+c.slice(1)}
            </button>
          ))}
        </div>

        {filtered.map(inst => {
          const p = prices[inst.symbol] ?? inst;
          const up = (p.changePct ?? 0) >= 0;
          const sparkData = Array.from({ length: 15 }, (_, i) => p.bid * (1 + (Math.random()-0.5) * 0.003));
          return (
            <div key={inst.symbol} className="market-row" onClick={() => onSelect(inst)}>
              <div className={`mr-icon ${inst.category}`}>{catIcon(inst.category)}</div>
              <div className="mr-info">
                <div className="mr-symbol">{inst.symbol}</div>
                <div className="mr-name">{inst.name}</div>
              </div>
              <div className="mr-spark">
                <Spark data={sparkData} color={up ? 'var(--bull)' : 'var(--bear)'} w={56} h={22} />
              </div>
              <div className="mr-price-col">
                <div className="mr-price">{fmtP(p.bid, inst.digits)}</div>
                <div className={`mr-chg ${up?'bull':'bear'}`}>{sign(p.changePct)}{p.changePct?.toFixed(2)}%</div>
              </div>
            </div>
          );
        })}

        <div style={{ height:'16px' }} />
      </div>
    </div>
  );
}

/* ─── Screen 6: DOM (Bottom Sheet version) ───────────────────────────────── */
function DOMSheet({ instrument, prices, onClose }) {
  const [dom, setDom] = useState(() => DOM_DATA(instrument?.bid ?? 1.08452));
  useEffect(() => {
    const iv = setInterval(() => setDom(DOM_DATA(prices[instrument?.symbol]?.bid ?? instrument?.bid ?? 1.08452)), 800);
    return () => clearInterval(iv);
  }, [instrument?.symbol, prices]);

  const asks = dom.filter(d => d.type === 'ask').slice().reverse();
  const bids = dom.filter(d => d.type === 'bid').slice().reverse();
  const maxVol = Math.max(...dom.map(d => d.volume));
  const midPrice = prices[instrument?.symbol]?.bid ?? instrument?.bid ?? 0;

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet" style={{ maxHeight:'80dvh' }}>
        <div className="sheet-handle"><div className="sheet-handle-bar" /></div>
        <div className="dom-header-bar">
          <Layers size={16} style={{ color:'var(--accent)' }} />
          <span className="m-topbar-title">Depth of Market</span>
          <span style={{ fontFamily:'var(--font-data)', fontSize:'12px', color:'var(--text-muted)' }}>{instrument?.symbol}</span>
          <button className="sheet-close" onClick={onClose} style={{ marginLeft:'auto' }}><X size={13} /></button>
        </div>

        <div className="dom-cols-header">
          <span className="dom-col-label">Price</span>
          <span className="dom-col-label right">Volume</span>
          <span className="dom-col-label right">Depth</span>
        </div>

        <div style={{ overflow:'auto', maxHeight:'calc(80dvh - 120px)' }}>
          {asks.map((row, i) => (
            <div key={`ask-${i}`} className="dom-row ask">
              <div className="dom-vol-bar" style={{ width:`${(row.volume/maxVol)*100}%` }} />
              <span className="dom-price-val">{fmtP(row.price, instrument?.digits ?? 5)}</span>
              <span className="dom-vol-val">{(row.volume/1000).toFixed(1)}K</span>
              <span className="dom-depth-val">{(row.depth/1000).toFixed(0)}K</span>
            </div>
          ))}

          <div className="dom-spread-bar">
            <span className="dom-mid-price">{fmtP(midPrice, instrument?.digits ?? 5)}</span>
            <span className="dom-spread-txt">spread</span>
            <span className="dom-spread-val">{instrument?.spread ?? '0.6'} pts</span>
          </div>

          {bids.map((row, i) => (
            <div key={`bid-${i}`} className="dom-row bid">
              <div className="dom-vol-bar" style={{ width:`${(row.volume/maxVol)*100}%` }} />
              <span className="dom-price-val">{fmtP(row.price, instrument?.digits ?? 5)}</span>
              <span className="dom-vol-val">{(row.volume/1000).toFixed(1)}K</span>
              <span className="dom-depth-val">{(row.depth/1000).toFixed(0)}K</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── Screen 7: Calendar & News ─────────────────────────────────────────── */
function CalendarNewsScreen() {
  const [tab, setTab]       = useState('calendar');
  const [impact, setImpact] = useState('all');

  const filteredCal = ECONOMIC_CALENDAR.filter(e => impact === 'all' || e.impact === impact);

  return (
    <div className="screen">
      <div className="m-topbar">
        <div className="m-topbar-title">Research</div>
        <div style={{ marginLeft:'auto', fontFamily:'var(--font-data)', fontSize:'11px', color:'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
        </div>
      </div>

      <div className="tab-row">
        {[{id:'calendar',label:'Calendar'},{id:'news',label:'News'},{id:'alerts',label:'Alerts'}].map(t => (
          <button key={t.id} className={`m-tab ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="screen-scroll">
        {tab === 'calendar' && (
          <>
            <div className="impact-filter">
              {[
                { id:'all',    label:'All Events' },
                { id:'high',   label:'High',   dot:'high' },
                { id:'medium', label:'Medium', dot:'medium' },
              ].map(f => (
                <button key={f.id} className={`impact-btn ${impact===f.id?`active ${f.id}`:''}`} onClick={() => setImpact(f.id)}>
                  {f.dot && <div className={`impact-dot ${f.dot}`} />}
                  {f.label}
                </button>
              ))}
            </div>
            {filteredCal.map(e => (
              <div key={e.id} className="cal-event-row">
                <div className={`cal-impact-dot ${e.impact}`} />
                <div className="cal-time">{e.time}</div>
                <div className="cal-flag">{e.flag}</div>
                <div className="cal-info">
                  <div className="cal-event-name">{e.event}</div>
                  <div className="cal-vals">
                    {e.forecast  && <span className="cal-val-item">F: {e.forecast}</span>}
                    {e.previous  && <span className="cal-val-item">P: {e.previous}</span>}
                    {e.actual    && <span className={`cal-val-item ${parseFloat(e.actual) >= parseFloat(e.forecast ?? '0') ? 'cal-actual-up':'cal-actual-down'}`}>A: {e.actual}</span>}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'news' && (
          <>
            {NEWS.map(n => (
              <div key={n.id} className="news-row">
                <div className={`news-bar ${n.sentiment}`} />
                <div className="news-content">
                  <div className="news-meta-row">
                    <span className="news-source">{n.source}</span>
                    <span className="news-time">{n.time}</span>
                    <span className="news-sym-tag">{n.symbol}</span>
                  </div>
                  <div className="news-headline">{n.headline}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'alerts' && (
          <>
            <div className="alert-empty">
              <div className="alert-empty-icon"><Bell size={36} /></div>
              <div className="alert-empty-text">No active price alerts</div>
              <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'4px' }}>Set alerts to get notified when prices reach your targets</div>
            </div>
            <button className="add-alert-btn"><Plus size={16} /> Add Price Alert</button>
          </>
        )}

        <div style={{ height:'16px' }} />
      </div>
    </div>
  );
}

/* ─── Screen 8: Account ──────────────────────────────────────────────────── */
function AccountScreen() {
  const [tab, setTab] = useState('overview');
  const acct = ACCOUNT;
  const marginPct = Math.min((acct.margin / acct.equity) * 100, 100);
  const riskColor = marginPct < 20 ? 'var(--bull)' : marginPct < 50 ? 'var(--warn)' : 'var(--bear)';
  const totalProfit = TRADE_HISTORY.filter(t=>t.pnl>0).reduce((s,t)=>s+t.pnl,0);
  const totalLoss   = TRADE_HISTORY.filter(t=>t.pnl<0).reduce((s,t)=>s+t.pnl,0);
  const winRate     = (TRADE_HISTORY.filter(t=>t.pnl>0).length / TRADE_HISTORY.length * 100).toFixed(0);

  return (
    <div className="screen">
      <div className="m-topbar">
        <div className="m-topbar-title">Account</div>
        <div style={{ marginLeft:'auto', display:'flex', gap:'4px' }}>
          <button className="m-icon-btn"><Settings size={17} /></button>
          <button className="m-icon-btn" style={{ color:'var(--bear)' }}><LogOut size={17} /></button>
        </div>
      </div>

      <div className="tab-row">
        {[{id:'overview',label:'Overview'},{id:'history',label:'History'},{id:'stats',label:'Stats'}].map(t => (
          <button key={t.id} className={`m-tab ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="screen-scroll">
        {tab === 'overview' && (
          <>
            {/* Account hero */}
            <div className="account-hero">
              <div className="account-avatar-lg">AM</div>
              <div className="account-info">
                <div className="account-name">{acct.name}</div>
                <div className="account-id">{acct.accountId} · {acct.server}</div>
                <div className="account-type-tag"><Shield size={10} />{acct.accountType} · {acct.leverage}</div>
              </div>
              <div className="account-equity-side">
                <div className="account-eq-label">Equity</div>
                <div className="account-eq-value">${fmt(acct.equity)}</div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="stats-grid-4">
              {[
                { l:'Balance',       v:`$${fmt(acct.balance)}` },
                { l:'Unrealised P&L',v:`${sign(acct.unrealizedPnl)}$${fmt(Math.abs(acct.unrealizedPnl))}`, c:pc(acct.unrealizedPnl) },
                { l:'Free Margin',   v:`$${fmt(acct.freeMargin)}` },
                { l:'Margin Level',  v:`${fmt(acct.marginLevel)}%`, c:'bull' },
                { l:'Used Margin',   v:`$${fmt(acct.margin)}` },
                { l:'Today P&L',     v:`+$${fmt(acct.realizedPnlToday)}`, c:'bull' },
              ].map(s => (
                <div key={s.l} className="stat-cell">
                  <div className="sc-label">{s.l}</div>
                  <div className={`sc-value mono ${s.c??''}`}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Risk meter */}
            <div className="risk-section">
              <div className="risk-card">
                <div className="risk-header">
                  <div className="risk-title">Margin Usage</div>
                  <div className="risk-pct" style={{ color: riskColor }}>{marginPct.toFixed(1)}%</div>
                </div>
                <div className="risk-track">
                  <div className="risk-fill" style={{ width:`${marginPct}%`, background: riskColor }} />
                </div>
                <div className="risk-labels"><span>Safe</span><span>Warning</span><span>Margin Call</span></div>
              </div>
            </div>

            {/* 30-day chart */}
            <div style={{ margin:'0 12px 12px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'10px', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)', fontFamily:'var(--font-display)' }}>30-Day P&L</span>
                <span style={{ fontFamily:'var(--font-data)', fontSize:'14px', fontWeight:600, color:'var(--bull)' }}>+$3,567</span>
              </div>
              <PnLArea data={P_AND_L_HISTORY} h={52} />
            </div>
          </>
        )}

        {tab === 'history' && (
          <>
            <div className="history-summary">
              {[
                { l:'Win Rate', v:`${winRate}%`, c:'bull' },
                { l:'Gross Profit', v:`+$${fmt(totalProfit)}`, c:'bull' },
                { l:'Net P&L', v:`+$${fmt(totalProfit+totalLoss)}`, c:'bull' },
              ].map(s => (
                <div key={s.l} className="hs-item">
                  <div className="hs-label">{s.l}</div>
                  <div className={`hs-value mono ${s.c}`}>{s.v}</div>
                </div>
              ))}
            </div>
            {TRADE_HISTORY.map(t => (
              <div key={t.id} className="history-row">
                <div className={`hr-badge ${t.type.toLowerCase()}`}>{t.type}</div>
                <div className="hr-info">
                  <div className="hr-symbol">{t.symbol} <span style={{ fontSize:'10px', color:'var(--text-muted)' }}>· {t.lots} lots</span></div>
                  <div className="hr-meta">{t.openTime} → {t.closeTime} · {t.duration}</div>
                </div>
                <div className={`hr-pnl ${pc(t.pnl)}`}>{sign(t.pnl)}${fmt(Math.abs(t.pnl))}</div>
              </div>
            ))}
          </>
        )}

        {tab === 'stats' && (
          <div style={{ padding:'16px' }}>
            {[
              { label:'Total Trades',     value: TRADE_HISTORY.length },
              { label:'Win Rate',         value:`${winRate}%`,                 c:'bull' },
              { label:'Gross Profit',     value:`+$${fmt(totalProfit)}`,        c:'bull' },
              { label:'Gross Loss',       value:`-$${fmt(Math.abs(totalLoss))}`, c:'bear' },
              { label:'Net P&L',          value:`+$${fmt(totalProfit+totalLoss)}`,c:'bull' },
              { label:'Profit Factor',    value:`${(totalProfit/Math.abs(totalLoss||1)).toFixed(2)}`, c:'bull' },
              { label:'Best Trade',       value:`+$${fmt(Math.max(...TRADE_HISTORY.map(t=>t.pnl)))}`, c:'bull' },
              { label:'Worst Trade',      value:`-$${fmt(Math.abs(Math.min(...TRADE_HISTORY.map(t=>t.pnl))))}`, c:'bear' },
              { label:'Avg Win',          value:`+$${fmt(totalProfit / (TRADE_HISTORY.filter(t=>t.pnl>0).length||1))}`, c:'bull' },
              { label:'Max Drawdown',     value:`${acct.drawdownPct}%`,         c:'bear' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:'13px', color:'var(--text-secondary)' }}>{s.label}</span>
                <span className={`mono ${s.c??''}`} style={{ fontSize:'14px', fontWeight:600 }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ height:'16px' }} />
      </div>
    </div>
  );
}

/* ─── Bottom Navigation ──────────────────────────────────────────────────── */
function BottomNav({ active, onChange, onTrade }) {
  const items = [
    { id:'home',      icon:<Home size={20} />,      label:'Home' },
    { id:'markets',   icon:<BarChart2 size={20} />,  label:'Markets' },
    { id:'_trade',    fab:true },
    { id:'portfolio', icon:<Briefcase size={20} />,  label:'Portfolio' },
    { id:'account',   icon:<User size={20} />,       label:'Account' },
  ];
  return (
    <nav className="bottom-nav">
      {items.map(item =>
        item.fab ? (
          <div key="_trade" className="nav-trade-fab" onClick={onTrade}>
            <div className="nav-fab-btn"><TrendingUp size={22} color="#fff" /></div>
            <span className="nav-fab-label">Trade</span>
          </div>
        ) : (
          <div
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            <div className={`nav-icon ${active===item.id?'active':''}`}
              style={{ color: active===item.id ? 'var(--accent)' : 'var(--text-muted)' }}>
              {item.icon}
            </div>
            <span className="nav-label">{item.label}</span>
          </div>
        )
      )}
    </nav>
  );
}

/* ─── Root App ───────────────────────────────────────────────────────────── */
export default function MobileDashboard() {
  const [screen, setScreen]           = useState('home');
  const [activeInstrument, setActive] = useState(INSTRUMENTS[0]);
  const [prices, setPrices]           = useState(() => Object.fromEntries(INSTRUMENTS.map(i => [i.symbol, { ...i }])));
  const [positions, setPositions]     = useState(OPEN_POSITIONS);
  const [toasts, setToasts]           = useState([]);
  const [showTrade, setShowTrade]     = useState(false);
  const [tradeSide, setTradeSide]     = useState('buy');
  const [showDOM, setShowDOM]         = useState(false);

  /* Live price tick */
  useEffect(() => {
    const iv = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        INSTRUMENTS.forEach(inst => {
          const p = next[inst.symbol];
          const tick = (Math.random() - 0.5) * inst.pip * 4;
          const newBid = parseFloat((p.bid + tick).toFixed(inst.digits));
          const newAsk = parseFloat((newBid + inst.spread * inst.pip).toFixed(inst.digits));
          next[inst.symbol] = { ...p, bid: newBid, ask: newAsk };
        });
        return next;
      });
    }, 800);
    return () => clearInterval(iv);
  }, []);

  /* Live P&L update */
  useEffect(() => {
    const iv = setInterval(() => {
      setPositions(prev => prev.map(pos => {
        const p = prices[pos.symbol];
        if (!p) return pos;
        const diff = pos.type === 'BUY' ? (p.bid - pos.openPrice) : (pos.openPrice - p.ask);
        const pnl  = diff * pos.lots * 100000;
        return { ...pos, currentPrice: pos.type==='BUY'?p.bid:p.ask, pnl: parseFloat(pnl.toFixed(2)) };
      }));
    }, 800);
    return () => clearInterval(iv);
  }, [prices]);

  const addToast = useCallback((text, sub, type='bull') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, text, sub, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const handleTrade = useCallback((side, inst) => {
    setTradeSide(side);
    if (inst) setActive(inst);
    setShowTrade(true);
  }, []);

  const handleConfirmTrade = useCallback(({ side, otype, lots, instrument }) => {
    const p = prices[instrument?.symbol] ?? instrument;
    const fillPrice = side==='buy' ? p.ask : p.bid;
    addToast(
      `${side.toUpperCase()} ${lots} lots ${instrument?.symbol}`,
      `${otype} filled @ ${fmtP(fillPrice, instrument?.digits)}`,
      side === 'buy' ? 'bull' : 'bear'
    );
  }, [prices, addToast]);

  const handleClosePosition = useCallback((id) => {
    const pos = positions.find(p => p.id === id);
    if (!pos) return;
    setPositions(prev => prev.filter(p => p.id !== id));
    addToast(`Closed ${pos.symbol}`, `P&L: ${sign(pos.pnl)}$${fmt(Math.abs(pos.pnl))}`, pos.pnl>=0?'bull':'bear');
  }, [positions, addToast]);

  const handleSymbol = useCallback((inst) => {
    setActive(inst);
    setScreen('chart');
  }, []);

  return (
    <>
      <Head>
        <title>Obsidian — Mobile Terminal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <meta name="theme-color" content="#06080A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Obsidian" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <div className="mobile-app">
        {/* Screens */}
        {screen === 'home'      && <HomeScreen prices={prices} onSymbol={handleSymbol} onTrade={(s) => { setTradeSide(s); setShowTrade(true); }} />}
        {screen === 'chart'     && <ChartScreen instrument={activeInstrument} prices={prices} onTrade={handleTrade} onBack={() => setScreen('markets')} />}
        {screen === 'portfolio' && <PortfolioScreen positions={positions} prices={prices} onClose={handleClosePosition} onTrade={handleTrade} />}
        {screen === 'markets'   && <MarketsScreen prices={prices} onSelect={(inst) => { setActive(inst); setScreen('chart'); }} />}
        {screen === 'research'  && <CalendarNewsScreen />}
        {screen === 'account'   && <AccountScreen />}

        {/* Bottom Nav */}
        <BottomNav
          active={screen}
          onChange={(s) => {
            if (s === 'home')      setScreen('home');
            if (s === 'markets')   setScreen('markets');
            if (s === 'portfolio') setScreen('portfolio');
            if (s === 'account')   setScreen('account');
          }}
          onTrade={() => setShowTrade(true)}
        />

        {/* Trade Ticket Sheet */}
        {showTrade && (
          <TradeTicket
            instrument={activeInstrument}
            prices={prices}
            onClose={() => setShowTrade(false)}
            onConfirm={handleConfirmTrade}
          />
        )}

        {/* DOM Sheet */}
        {showDOM && (
          <DOMSheet
            instrument={activeInstrument}
            prices={prices}
            onClose={() => setShowDOM(false)}
          />
        )}

        {/* Toasts */}
        <ToastLayer toasts={toasts} />
      </div>
    </>
  );
}
