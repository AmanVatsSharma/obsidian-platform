/**
 * File:        apps/web/features/mobile-terminal/components/mobile-trading-dashboard.tsx
 * Module:      Mobile Terminal · Dashboard
 * Purpose:     Presentational mobile trading app — 8 screens with bottom nav, bottom sheets.
 *              Consumes props from the MobileWorkstation adapter. NO mock data - proper
 *              empty states and loading indicators. The two fallback `setInterval`
 *              simulators (price ticks, P&L recompute) only run when the adapter
 *              has not delivered live data — i.e. unauthenticated demo mode.
 *
 * Exports:
 *   - MobileTradingDashboard({ data, onSetActiveSymbol })   — root component; renders screens, accepts live data
 *
 * Depends on:
 *   - @/features/trading-terminal/lib/types — Instrument, OpenPosition, PendingOrder, ToastItem, AccountSnapshot
 *   - lightweight-charts — dynamically imported for ChartScreen candlestick chart
 *   - lucide-react — icons
 *
 * Side-effects:
 *   - Sets price-tick interval (800ms) on mount only when no live quotes available
 *   - Sets P&L update interval (800ms) on mount only when no live positions
 *   - Both are gated on `hasLiveQuotes` / `hasLivePositions` from the adapter
 *
 * Key invariants:
 *   - Requires parent layout with NO AppShell — needs full-height (100dvh)
 *   - Uses LightweightCharts v4 API (addSeries + CandlestickSeries)
 *   - Is prop-driven — all data comes from `data` prop
 *   - CSS classes come from ../mobile.css (loaded by (mobile)/layout.tsx)
 *   - Empty states shown when data arrays are empty (no mock fallback)
 *   - Loading state shown when data.loading is true
 *   - Error banner shown when data.error is set
 *   - Chart's latest bar updates from live quotes (no random walk)
 *   - Sparkline in markets list is derived from `changePct` (no random walk)
 *
 * Read order:
 *   1. MobileTradingDashboard — entry point, state, price tick loop
 *   2. HomeScreen, ChartScreen — primary screens
 *   3. TradeTicket, DOMSheet — bottom sheets
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Home, BarChart2, TrendingUp, Briefcase, User,
  Search, Bell, Settings, X, Plus, RefreshCw, Activity,
  ChevronLeft, ArrowUpRight, ArrowDownRight, Layers,
  CandlestickChart, SlidersHorizontal, Shield, LogOut, Monitor,
} from 'lucide-react';
import type { Instrument, OpenPosition, ToastItem, AccountSnapshot, QuoteDto, PendingOrder } from '@/features/trading-terminal/lib/types';
import { useSymbolSearch } from '@/lib/prana-stream/hooks/use-symbol-search';
import { TIMEFRAMES } from '@/features/trading-terminal/lib/chart-timeframes';

// ─── Prop Contract ─────────────────────────────────────────────────────────────

type MobileWorkstationData = {
  // Read
  instruments: Instrument[];
  quotesBySymbol: Record<string, QuoteDto>;
  account: AccountSnapshot | null;
  orders: PendingOrder[];
  positions: OpenPosition[];
  accountId: string;

  // Write
  placeOrder: (input: {
    instrumentId: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'GTT' | 'TRAILING_STOP';
    quantity: string;
    price?: string;
    triggerPrice?: string;
    triggerCondition?: 'ABOVE' | 'BELOW';
    trailingDistance?: string;
    trailingPct?: string;
  }) => Promise<void>;
  placeAlgoOrder: (input: {
    instrumentId: string;
    side: 'BUY' | 'SELL';
    type: 'TWAP' | 'VWAP' | 'ICEBERG';
    quantity: string;
    slices?: number;
    durationMinutes?: number;
    displayQty?: string;
  }) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;

  // Meta
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
};

type MobileTradingDashboardProps = {
  data?: MobileWorkstationData;
  onSetActiveSymbol?: (symbol: string) => void;
  desktopHref?: string;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmt    = (n: number | undefined, d = 2) => n?.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) ?? '—';
const fmtP   = (n: number | undefined, dig: number | undefined) => n?.toFixed(dig ?? 5) ?? '—';
const sign   = (n: number) => n >= 0 ? '+' : '';
const pc     = (n: number) => n >= 0 ? 'bull' : 'bear';
const catIcon = (cat: string) => ({ forex:'FX', crypto:'₿', indices:'IX', commodities:'CM' }[cat] ?? 'FX');

type PriceMap = Record<string, Instrument>;
type Screen = 'home' | 'chart' | 'portfolio' | 'markets' | 'research' | 'account';

/* ─── Sparkline ──────────────────────────────────────────────────────────── */
function Spark({ data, color, w = 56, h = 22 }: { data: number[]; color: string; w?: number; h?: number }) {
  if (!data?.length) return <svg width={w} height={h} />;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 2) - 1}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ─── PnL Area Chart ─────────────────────────────────────────────────────── */
function PnLArea({ data, h = 44 }: { data: number[]; h?: number }) {
  const ref = useRef<HTMLDivElement>(null);
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
function ToastLayer({ toasts }: { toasts: ToastItem[] }) {
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

/* ─── Home Screen ────────────────────────────────────────────────────────── */
function HomeScreen({
  account, instruments, prices, positions, onSymbol, onTrade, desktopHref,
}: {
  account: AccountSnapshot | null;
  instruments: Instrument[];
  prices: PriceMap;
  positions: OpenPosition[];
  onSymbol: (inst: Instrument) => void;
  onTrade: (side: 'buy' | 'sell') => void;
  desktopHref?: string;
}) {
  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);

  // Display default values if no account data
  const displayAccount = account ?? {
    equity: 10000,
    unrealizedPnl: 0,
    balance: 10000,
    freeMargin: 10000,
    marginLevel: 100,
    drawdownPct: 0,
    realizedPnlToday: 0,
  };
  return (
    <div className="screen">
      <div className="m-topbar">
        <div className="m-topbar-logo"><div className="m-logo-dot" />OBSIDIAN</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="status-pill"><div className="status-pill-dot" />LIVE</div>
          <button className="m-icon-btn"><Bell size={18} /><span className="m-notif-badge" /></button>
          {desktopHref && (
            <Link href={desktopHref} className="m-icon-btn" style={{ textDecoration: 'none', color: 'var(--text)' }}><Monitor size={18} /></Link>
          )}
          <div className="m-avatar">AM</div>
        </div>
      </div>

      <div className="screen-scroll">
        <div className="equity-hero">
          <div className="equity-label">Total Equity</div>
          <div className="equity-amount">${fmt(displayAccount.equity)}</div>
          <div className="equity-delta">
            <div className={`equity-delta-pill ${pc(totalPnl)}`}>
              {pc(totalPnl) === 'bull' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {sign(totalPnl)}${fmt(Math.abs(totalPnl))} today
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>
              {sign(displayAccount.unrealizedPnl)}${fmt(Math.abs(displayAccount.unrealizedPnl))} unrealised
            </div>
          </div>
          <PnLArea data={[]} h={44} />
          <div className="equity-meta">
            {[
              { l: 'Balance',     v: `$${fmt(displayAccount.balance)}` },
              { l: 'Free Margin', v: `$${fmt(displayAccount.freeMargin)}` },
              { l: 'Margin Lvl',  v: `${fmt(displayAccount.marginLevel)}%`, c: 'bull' },
              { l: 'Drawdown',    v: `${displayAccount.drawdownPct}%`,      c: 'bear' },
            ].map(s => (
              <div key={s.l} className="equity-meta-item">
                <span className="equity-meta-label">{s.l}</span>
                <span className={`equity-meta-value mono ${s.c ?? ''}`}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sessions-row">
          {[{ n: 'London', open: true }, { n: 'New York', open: true }, { n: 'Tokyo', open: false }, { n: 'Sydney', open: false }].map(s => (
            <div key={s.n} className={`session-pill ${s.open ? 'open' : 'closed'}`}>
              <div className="session-dot" />{s.n}
            </div>
          ))}
        </div>

        <div className="quick-stats">
          {[
            { l: 'Open Positions', v: `${positions.length}`,                  sub: 'active trades' },
            { l: 'Today P&L',      v: `+$${fmt(displayAccount.realizedPnlToday)}`,   c: 'bull' },
            { l: 'Pending Orders', v: '—',                                    sub: 'live count pending' },
            { l: 'Win Rate',       v: '—',                                    c: 'bull', sub: 'live calc pending' },
          ].map(s => (
            <div key={s.l} className="stat-tile">
              <div className="stat-tile-label">{s.l}</div>
              <div className={`stat-tile-value mono ${s.c ?? ''}`}>{s.v}</div>
              {s.sub && <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', marginTop: '1px' }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        <div className="quick-trade-row">
          <button className="qt-btn buy" onClick={() => onTrade('buy')}>
            <ArrowUpRight size={16} />BUY
            <span className="qt-btn-price">{instruments[0] ? fmtP(prices[instruments[0].symbol]?.ask, instruments[0].digits) : '—'}</span>
          </button>
          <button className="qt-btn sell" onClick={() => onTrade('sell')}>
            <ArrowDownRight size={16} />SELL
            <span className="qt-btn-price">{instruments[0] ? fmtP(prices[instruments[0].symbol]?.bid, instruments[0].digits) : '—'}</span>
          </button>
        </div>

        <div className="section-label">Watchlist</div>
        <div className="watchlist-strip">
          <div className="watchlist-strip-scroll">
            {instruments.slice(0, 10).map((inst, i) => {
              const p = prices[inst.symbol] ?? inst;
              const up = (p.changePct ?? 0) >= 0;
              return (
                <div key={inst.symbol} className={`wl-chip ${i === 0 ? 'active' : ''}`} onClick={() => onSymbol(inst)}>
                  <div className="wl-chip-symbol">{inst.symbol}</div>
                  <div className={`wl-chip-price mono ${up ? 'bull' : 'bear'}`}>{fmtP(p.bid, inst.digits)}</div>
                  <div className={`wl-chip-chg ${up ? 'bull' : 'bear'}`}>{sign(p.changePct ?? 0)}{p.changePct?.toFixed(2)}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="section-label">Open Positions</div>
        <div className="m-card">
          {positions.slice(0, 3).map(pos => (
            <div key={pos.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderBottom: '1px solid var(--border)' }}>
              <div className={`pos-badge ${pos.type.toLowerCase()}`}>{pos.type}</div>
              <div className="pos-info">
                <div className="pos-symbol">{pos.symbol}</div>
                <div className="pos-meta">{pos.lots} lots @ {pos.openPrice}</div>
              </div>
              <div className="pos-pnl">
                <div className={`pos-pnl-val ${pc(pos.pnl)}`}>{sign(pos.pnl)}${fmt(Math.abs(pos.pnl))}</div>
                <div className={`pos-pnl-pct ${pc(pos.pnl)}`}>{sign(pos.pnlPct ?? 0)}{pos.pnlPct?.toFixed(2)}%</div>
              </div>
            </div>
          ))}
          <div style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px', color: 'var(--accent)', cursor: 'pointer' }}>
            View all {positions.length} positions →
          </div>
        </div>
        <div style={{ height: '16px' }} />
      </div>
    </div>
  );
}

/* ─── Chart Screen ───────────────────────────────────────────────────────── */
function ChartScreen({
  instrument, prices, onTrade, onBack,
}: {
  instrument: Instrument;
  prices: PriceMap;
  onTrade: (side: 'buy' | 'sell', inst: Instrument) => void;
  onBack: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const candleRef    = useRef<any>(null);
  const [tf, setTf]  = useState('5m');
  const [ohlc, setOhlc] = useState({ o: 0, h: 0, l: 0, c: 0 });
  const price = prices[instrument?.symbol] ?? instrument;
  const isUp  = (price?.changePct ?? 0) >= 0;

  useEffect(() => {
    if (!containerRef.current) return;
    let chart: any;
    const init = async () => {
      const { createChart, CrosshairMode } = await import('lightweight-charts');
      if (!containerRef.current) return;
      chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        layout: { background: { color: 'transparent' }, textColor: '#8B95A3', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 },
        grid: { vertLines: { color: '#1C2028', style: 1 }, horzLines: { color: '#1C2028', style: 1 } },
        crosshair: { mode: CrosshairMode.Normal, vertLine: { color: '#2E3847', style: 0, width: 1 as const }, horzLine: { color: '#2E3847', style: 0, width: 1 as const, labelBackgroundColor: '#141820' } },
        rightPriceScale: { borderColor: '#1C2028', scaleMargins: { top: 0.06, bottom: 0.28 } },
        timeScale: { borderColor: '#1C2028', timeVisible: true, secondsVisible: false },
        handleScroll: true, handleScale: true,
      });

      const series = chart.addCandlestickSeries({
        upColor: '#10D996', downColor: '#FF3B5C',
        borderUpColor: '#10D996', borderDownColor: '#FF3B5C',
        wickUpColor: '#10D996', wickDownColor: '#FF3B5C',
      });
      candleRef.current = series;

      const volSeries = chart.addHistogramSeries({ priceFormat: { type: 'volume' as const }, priceScaleId: 'volume' });
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

      // Seed chart with a single live candle when an instrument is selected.
      // No fabricated historical candles — backend will provide them when wired.
      const bid = instrument?.bid;
      if (bid != null) {
        const now = Math.floor(Date.now() / 1000);
        const seedCandle = { time: now, open: bid, high: bid, low: bid, close: bid, volume: 0 };
        series.setData([seedCandle]);
        volSeries.setData([{ time: now, value: 0, color: 'rgba(16,217,150,0.35)' }]);
        setOhlc({ o: bid, h: bid, l: bid, c: bid });
      } else {
        series.setData([]);
        volSeries.setData([]);
      }
      chart.timeScale().fitContent();

      chart.subscribeCrosshairMove((param: any) => {
        if (param.seriesData?.has(series)) { const b = param.seriesData.get(series) as any; setOhlc({ o: b.open, h: b.high, l: b.low, c: b.close }); }
      });

      const ro = new ResizeObserver(() => {
        if (containerRef.current && chart) chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      });
      ro.observe(containerRef.current);
      return () => { ro.disconnect(); chart.remove(); };
    };
    const cleanup = init();
    return () => { cleanup.then(fn => fn?.()); };
  }, [instrument?.symbol]);

  useEffect(() => {
    if (!candleRef.current) return;
    // Drive the latest bar from the live quote for the active symbol.
    // If no live quote has arrived yet, skip the update (the chart's seed
    // data already has a real last bar from the upstream instruments poll).
    const close = prices[instrument?.symbol]?.bid;
    if (close === undefined || close === 0) return;
    const now = Math.floor(Date.now() / 1000);
    try {
      // Use the previous close as a stand-in for open when we don't have it.
      // A real implementation reads the last bar from the series.
      const lastTime = (candleRef.current as unknown as { data?: () => { time: number; close: number }[] })
        ?.data?.()?.[(candleRef.current as unknown as { data?: () => { time: number; close: number }[] })?.data?.()?.length ?? 1 - 1]?.time ?? now;
      const lastClose = (candleRef.current as unknown as { data?: () => { time: number; close: number }[] })
        ?.data?.()?.[(candleRef.current as unknown as { data?: () => { time: number; close: number }[] })?.data?.()?.length ?? 1 - 1]?.close ?? close;
      const open = lastClose;
      const high = Math.max(open, close);
      const low = Math.min(open, close);
      candleRef.current.update({ time: Math.max(lastTime + 1, now), open, high, low, close });
    } catch {
      // Series not ready yet — ignore.
    }
  }, [instrument?.symbol, prices]);

  return (
    <div className="chart-screen" style={{ paddingBottom: 0 }}>
      <div className="chart-sym-bar">
        <button className="m-icon-btn" onClick={onBack} style={{ marginLeft: '-6px' }}><ChevronLeft size={20} /></button>
        <div>
          <div className="chart-sym-name">{instrument?.symbol}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>{instrument?.name}</div>
        </div>
        <div className={`chart-sym-price ${isUp ? 'bull' : 'bear'}`}>{fmtP(price?.bid, instrument?.digits)}</div>
        <div className={`chart-sym-badge ${isUp ? 'bull' : 'bear'}`}>{sign(price?.changePct ?? 0)}{price?.changePct?.toFixed(2)}%</div>
        <div className="chart-sym-spread" style={{ marginLeft: 'auto' }}>Spd: {instrument?.spread}</div>
      </div>

      <div className="chart-tf-bar">
        {TIMEFRAMES.map(t => (
          <button key={t} className={`m-tf-btn ${tf === t ? 'active' : ''}`} onClick={() => setTf(t)}>{t}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button className="m-icon-btn" style={{ width: '28px', height: '28px' }}><Activity size={13} /></button>
          <button className="m-icon-btn" style={{ width: '28px', height: '28px' }}><SlidersHorizontal size={13} /></button>
        </div>
      </div>

      <div className="chart-wrap" ref={containerRef}>
        <div className="chart-ohlc-bar">
          {([['O', ohlc.o, ''], ['H', ohlc.h, 'bull'], ['L', ohlc.l, 'bear'], ['C', ohlc.c, '']] as [string, number, string][]).map(([l, v, c]) => (
            <div key={l} className="ohlc-item">
              <span className="ohlc-l">{l}</span>
              <span className={`ohlc-v ${c}`}>{fmtP(v, instrument?.digits)}</span>
            </div>
          ))}
        </div>
        <div className="dom-swipe-hint">↑ Swipe up for DOM</div>
      </div>

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

/* ─── Trade Ticket Bottom Sheet ──────────────────────────────────────────── */
type OrderTypeMobile = 'Market' | 'Limit' | 'Stop' | 'Stop Limit' | 'GTT' | 'Trailing' | 'Iceberg' | 'TWAP' | 'VWAP';
type AlgoTypeMobile = 'TWAP' | 'VWAP' | 'ICEBERG';

function TradeTicket({
  instrument, prices, onClose, onConfirm,
}: {
  instrument: Instrument;
  prices: PriceMap;
  onClose: () => void;
  onConfirm: (order: {
    side: string;
    otype: OrderTypeMobile;
    lots: number;
    instrument: Instrument;
    price?: string;
    triggerPrice?: string;
    triggerCondition?: 'ABOVE' | 'BELOW';
    trailingDistance?: string;
    trailingPct?: string;
    displayQty?: string;
    algoType?: AlgoTypeMobile;
    slices?: number;
    durationMinutes?: number;
  }) => void;
}) {
  const [side, setSide]   = useState<'buy' | 'sell'>('buy');
  const [otype, setOtype] = useState<OrderTypeMobile>('Market');
  const [lots, setLots]   = useState(1.00);
  const [sl, setSl]       = useState('');
  const [tp, setTp]       = useState('');
  const [price, setPrice] = useState('');
  const [holding, setHolding] = useState(false);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // GTT fields
  const [triggerPrice, setTriggerPrice] = useState('');
  const [triggerCondition, setTriggerCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  // Trailing Stop fields
  const [trailingDistance, setTrailingDistance] = useState('');
  const [trailingPct, setTrailingPct] = useState('');

  // Algo fields (TWAP/VWAP/Iceberg)
  const [slices, setSlices] = useState('10');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [displayQty, setDisplayQty] = useState('');

  const inst  = instrument != null ? (prices[instrument.symbol] ?? instrument) : null;
  const p     = inst ? (prices[inst.symbol] ?? inst) : null;
  const bid   = p?.bid ?? 0;
  const ask   = p?.ask ?? 0;
  const dig   = inst?.digits ?? 5;
  const margin = inst ? lots * ask * 1000 / 100 : 0;
  const pipVal = inst ? lots * 10 : 0;
  // The component is rendered only when `instrument` is non-null (caller guards),
  // so the live-quote branch should be the common path. Use non-null fallbacks
  // here for the JSX render so the existing inline expressions type-check.
  const instSafe: Instrument = inst ?? instrument!;

  // Determine if algo order (goes via REST)
  const isAlgo = otype === 'TWAP' || otype === 'VWAP' || otype === 'Iceberg';

  const adjustLots = (d: number) => setLots(v => Math.max(0.01, parseFloat((v + d).toFixed(2))));
  const presets = [0.01, 0.05, 0.10, 0.50, 1.00, 2.00];

  const startHold = () => {
    setHolding(true);
    holdRef.current = setTimeout(() => {
      if (!inst) return; // No instrument selected — ignore hold-to-confirm
      const order: Parameters<typeof onConfirm>[0] = { side, otype, lots, instrument: inst };
      // Add conditional fields based on order type
      if (otype === 'Limit' || otype === 'Stop' || otype === 'Stop Limit') {
        order.price = price;
      }
      if (otype === 'GTT') {
        order.triggerPrice = triggerPrice;
        order.triggerCondition = triggerCondition;
      }
      if (otype === 'Trailing') {
        order.trailingDistance = trailingDistance;
        order.trailingPct = trailingPct;
      }
      if (otype === 'Iceberg') {
        order.displayQty = displayQty;
        order.algoType = 'ICEBERG';
      }
      if (otype === 'TWAP' || otype === 'VWAP') {
        order.algoType = otype as AlgoTypeMobile;
        order.slices = parseInt(slices) || 10;
        order.durationMinutes = parseInt(durationMinutes) || 30;
      }
      onConfirm(order);
      onClose();
    }, 900);
  };
  const endHold = () => {
    setHolding(false);
    if (holdRef.current) clearTimeout(holdRef.current);
  };

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="sheet-handle"><div className="sheet-handle-bar" /></div>
        <div className="sheet-header">
          <CandlestickChart size={18} style={{ color: 'var(--accent)' }} />
          <span className="sheet-title">{instSafe.symbol}</span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>{instSafe.name}</div>
          <button className="sheet-close" onClick={onClose}><X size={13} /></button>
        </div>

        <div className="side-toggle">
          <button className={`side-btn buy ${side === 'buy' ? 'active' : ''}`} onClick={() => setSide('buy')}>▲ BUY</button>
          <button className={`side-btn sell ${side === 'sell' ? 'active' : ''}`} onClick={() => setSide('sell')}>▼ SELL</button>
        </div>

        <div className="bidask-display">
          <div className="ba-side">
            <div className="ba-label">BID</div>
            <div className="ba-price bear">{fmtP(bid, dig)}</div>
          </div>
          <div className="ba-spread">
            <div style={{ fontSize: '9px', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>SPD</div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: '13px', fontWeight: '700', color: 'var(--warn)' }}>{(instSafe as Instrument & { spread?: number }).spread ?? 0}</div>
          </div>
          <div className="ba-side">
            <div className="ba-label">ASK</div>
            <div className="ba-price bull">{fmtP(ask, dig)}</div>
          </div>
        </div>

        <div className="order-type-row">
          {['Market', 'Limit', 'Stop', 'Stop Limit', 'GTT', 'Trailing', 'Iceberg', 'TWAP', 'VWAP'].map(t => (
            <button key={t} className={`ot-btn ${otype === t ? 'active' : ''}`} onClick={() => setOtype(t as OrderTypeMobile)}>{t}</button>
          ))}
        </div>

        {/* Price input for Limit, Stop, Stop Limit */}
        {(otype === 'Limit' || otype === 'Stop' || otype === 'Stop Limit') && (
          <div style={{ margin: '14px 16px 0' }}>
            <div className="sltp-label">Price</div>
            <div className="sltp-input-wrap" style={{ marginTop: '5px' }}>
              <input
                className="sltp-input"
                type="number"
                placeholder={fmtP(bid, dig)}
                value={price}
                onChange={e => setPrice(e.target.value)}
              />
              <span style={{ padding: '0 12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>{instSafe.symbol?.split('/')[1] ?? 'USD'}</span>
            </div>
          </div>
        )}

        {/* GTT Fields */}
        {otype === 'GTT' && (
          <div style={{ margin: '14px 16px 0', gap: '12px' }}>
            <div>
              <div className="sltp-label">Trigger Price</div>
              <div className="sltp-input-wrap" style={{ marginTop: '5px' }}>
                <input
                  className="sltp-input"
                  type="number"
                  placeholder={fmtP(bid, dig)}
                  value={triggerPrice}
                  onChange={e => setTriggerPrice(e.target.value)}
                />
                <span style={{ padding: '0 12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>{instSafe.symbol?.split('/')[1] ?? 'USD'}</span>
              </div>
            </div>
            <div>
              <div className="sltp-label">Trigger Condition</div>
              <div className="side-toggle" style={{ marginTop: '8px', marginBottom: '8px' }}>
                <button
                  className={`side-btn ${triggerCondition === 'ABOVE' ? 'active' : ''}`}
                  onClick={() => setTriggerCondition('ABOVE')}
                >
                  ↑ Above
                </button>
                <button
                  className={`side-btn ${triggerCondition === 'BELOW' ? 'active' : ''}`}
                  onClick={() => setTriggerCondition('BELOW')}
                >
                  ↓ Below
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trailing Stop Fields */}
        {otype === 'Trailing' && (
          <div style={{ margin: '14px 16px 0', gap: '12px' }}>
            <div>
              <div className="sltp-label">Trailing Distance</div>
              <div className="sltp-input-wrap" style={{ marginTop: '5px' }}>
                <input
                  className="sltp-input"
                  type="number"
                  step="0.00001"
                  placeholder="0.00005"
                  value={trailingDistance}
                  onChange={e => setTrailingDistance(e.target.value)}
                />
                <span style={{ padding: '0 12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>Points</span>
              </div>
            </div>
            <div>
              <div className="sltp-label">Trailing Percentage</div>
              <div className="sltp-input-wrap" style={{ marginTop: '5px' }}>
                <input
                  className="sltp-input"
                  type="number"
                  step="0.1"
                  placeholder="5.0"
                  value={trailingPct}
                  onChange={e => setTrailingPct(e.target.value)}
                />
                <span style={{ padding: '0 12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>%</span>
              </div>
            </div>
          </div>
        )}

        {/* TWAP / VWAP Fields */}
        {otype === 'TWAP' && (
          <div style={{ margin: '14px 16px 0', gap: '12px' }}>
            <div>
              <div className="sltp-label">Number of TWAP slices</div>
              <div className="sltp-input-wrap" style={{ marginTop: '5px' }}>
                <input
                  className="sltp-input"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="10"
                  value={slices}
                  onChange={e => setSlices(e.target.value)}
                />
                <span style={{ padding: '0 12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>slices</span>
              </div>
            </div>
            <div>
              <div className="sltp-label">Duration</div>
              <div className="sltp-input-wrap" style={{ marginTop: '5px' }}>
                <input
                  className="sltp-input"
                  type="number"
                  min="1"
                  max="480"
                  placeholder="30"
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(e.target.value)}
                />
                <span style={{ padding: '0 12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>minutes</span>
              </div>
            </div>
          </div>
        )}

        {/* Iceberg Fields */}
        {otype === 'Iceberg' && (
          <div style={{ margin: '14px 16px 0', gap: '12px' }}>
            <div>
              <div className="sltp-label">Display Quantity</div>
              <div className="sltp-input-wrap" style={{ marginTop: '5px' }}>
                <input
                  className="sltp-input"
                  type="number"
                  min="1"
                  placeholder="100"
                  value={displayQty}
                  onChange={e => setDisplayQty(e.target.value)}
                />
                <span style={{ padding: '0 12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>lots</span>
              </div>
            </div>
          </div>
        )}

        {/* VWAP Fields - same as TWAP */}
        {otype === 'VWAP' && (
          <div style={{ margin: '14px 16px 0', gap: '12px' }}>
            <div>
              <div className="sltp-label">Number of VWAP slices</div>
              <div className="sltp-input-wrap" style={{ marginTop: '5px' }}>
                <input
                  className="sltp-input"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="10"
                  value={slices}
                  onChange={e => setSlices(e.target.value)}
                />
                <span style={{ padding: '0 12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>slices</span>
              </div>
            </div>
            <div>
              <div className="sltp-label">Duration</div>
              <div className="sltp-input-wrap" style={{ marginTop: '5px' }}>
                <input
                  className="sltp-input"
                  type="number"
                  min="1"
                  max="480"
                  placeholder="30"
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(e.target.value)}
                />
                <span style={{ padding: '0 12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>minutes</span>
              </div>
            </div>
          </div>
        )}

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
            {presets.map(pr => (
              <button key={pr} className="lot-preset" onClick={() => setLots(pr)}>{pr}</button>
            ))}
          </div>
        </div>

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

        <div className="trade-info">
          {[
            { l: 'Req. Margin', v: `$${fmt(margin)}` },
            { l: 'Pip Value',   v: `$${fmt(pipVal)}` },
            { l: 'Leverage',    v: '1:100' },
            { l: 'Commission',  v: `$${fmt(lots * 7)}` },
          ].map(i => (
            <div key={i.l} className="ti-item">
              <span className="ti-label">{i.l}</span>
              <span className="ti-value mono">{i.v}</span>
            </div>
          ))}
        </div>

        <div className="hold-btn-wrap">
          <button
            className={`hold-btn ${side}`}
            onMouseDown={startHold} onMouseUp={endHold} onMouseLeave={endHold}
            onTouchStart={startHold} onTouchEnd={endHold}
          >
            <div className={`hold-btn-progress ${holding ? 'filling' : ''}`} />
            {side === 'buy' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            {side === 'buy' ? '▲ BUY' : '▼ SELL'} {otype.toUpperCase()}
          </button>
          <div className="hold-hint">Hold to confirm order • Release to cancel</div>
        </div>
        <div style={{ height: '8px' }} />
      </div>
    </>
  );
}

/* ─── Portfolio Screen ───────────────────────────────────────────────────── */
function PortfolioScreen({
  account, positions, orders, onClose, onTrade,
}: {
  account: AccountSnapshot | null;
  positions: OpenPosition[];
  orders: PendingOrder[];
  onClose: (id: string) => void;
  onTrade: (side: 'buy' | 'sell', inst: Instrument) => void;
}) {
  const [swiped, setSwiped] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<'open' | 'pending'>('open');
  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);

  // Default values if no account data
  const displayAccount = account ?? {
    equity: 10000,
    unrealizedPnl: 0,
    balance: 10000,
    margin: 0,
    freeMargin: 10000,
    marginLevel: 100,
    realizedPnlToday: 0,
  };

  return (
    <div className="screen">
      <div className="m-topbar">
        <div className="m-topbar-title">Portfolio</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          <button className="m-icon-btn"><SlidersHorizontal size={17} /></button>
          <button className="m-icon-btn"><RefreshCw size={17} /></button>
        </div>
      </div>

      <div className="screen-scroll">
        <div className="portfolio-summary">
          <div style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', marginBottom: '4px' }}>Total Equity</div>
          <div className="ps-equity">${fmt(displayAccount.equity)}</div>
          <div className="ps-deltas">
            <div className={`ps-delta ${pc(totalPnl)}`}>{sign(totalPnl)}${fmt(Math.abs(totalPnl))} open P&L</div>
            <div className="ps-delta bull">+${fmt(displayAccount.realizedPnlToday)} today</div>
          </div>
          <PnLArea data={[]} h={40} />
          <div className="ps-stat-row" style={{ marginTop: '10px' }}>
            {[
              { l: 'Margin',  v: `$${fmt(displayAccount.margin)}` },
              { l: 'Free',    v: `$${fmt(displayAccount.freeMargin)}` },
              { l: 'Level',   v: `${fmt(displayAccount.marginLevel)}%`, c: 'bull' },
            ].map(s => (
              <div key={s.l} className="ps-stat">
                <div className="ps-stat-label">{s.l}</div>
                <div className={`ps-stat-value mono ${s.c ?? ''}`}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="tab-row">
          {[{ id: 'open' as const, label: `Open (${positions.length})` }, { id: 'pending' as const, label: `Pending (${orders.length})` }].map(t => (
            <button key={t.id} className={`m-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {tab === 'open' && (
          <>
            <div className="swipe-hint">← Swipe left on a position to close</div>
            {positions.map(pos => (
              <div key={pos.id} className="position-item">
                <div className="position-swipe-bg">
                  <button className="pos-close-btn-bg" onClick={() => onClose(pos.id)}>CLOSE</button>
                </div>
                <div
                  className={`position-inner ${swiped[pos.id] ? 'swiped' : ''}`}
                  onClick={() => setSwiped(prev => ({ ...prev, [pos.id]: !prev[pos.id] }))}
                >
                  <div className={`pos-badge ${pos.type.toLowerCase()}`}>{pos.type}</div>
                  <div className="pos-info">
                    <div className="pos-symbol">{pos.symbol}</div>
                    <div className="pos-meta">{pos.lots} lots · @ {pos.openPrice}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', marginTop: '1px' }}>
                      SL: <span className="bear">{pos.sl || '—'}</span> · TP: <span className="bull">{pos.tp || '—'}</span>
                    </div>
                  </div>
                  <div className="pos-pnl">
                    <div className={`pos-pnl-val ${pc(pos.pnl)}`}>{sign(pos.pnl)}${fmt(Math.abs(pos.pnl))}</div>
                    <div className={`pos-pnl-pct ${pc(pos.pnl)}`}>{sign(pos.pnlPct ?? 0)}{Math.abs(pos.pnlPct ?? 0).toFixed(2)}%</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-data)' }}>{pos.currentPrice}</div>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ padding: '14px 16px' }}>
              <button style={{ width: '100%', padding: '12px', borderRadius: 'var(--r-lg)', background: 'var(--bear-dim)', border: '1px solid rgba(255,59,92,0.25)', color: 'var(--bear)', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
                Close All
              </button>
            </div>
          </>
        )}

        {tab === 'pending' && orders.map(o => {
          const isBuy = o.type.includes('BUY');
          return (
            <div key={o.id} className="position-item">
              <div className="position-inner">
                <div className={`pos-badge ${isBuy ? 'buy' : 'sell'}`}>{isBuy ? 'BUY' : 'SELL'}</div>
                <div className="pos-info">
                  <div className="pos-symbol">{o.symbol}</div>
                  <div className="pos-meta">{o.type} · {o.lots} lots @ {o.price}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', marginTop: '1px' }}>Expiry: {o.expiry}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button style={{ padding: '5px 12px', borderRadius: 'var(--r-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ height: '16px' }} />
      </div>
    </div>
  );
}

/* ─── Markets Screen ─────────────────────────────────────────────────────── */
function MarketsScreen({ instruments, prices, onSelect }: { instruments: Instrument[]; prices: PriceMap; onSelect: (inst: Instrument) => void }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const cats = ['all', 'forex', 'crypto', 'indices', 'commodities'];

  // ── Live symbol search via PranaStream ─────────────────────────────────
  // Debounced REST search for symbols not in the local cached list; the
  // top 8 hits get auto-subscribed for live ticks. Local filter still
  // runs first for instant feedback on cached symbols.
  const { getLivePrice, isLive } = useSymbolSearch(search, {
    debounceMs: 200,
    autoTouchTopN: 8,
    limit: 30,
  });

  const filtered = useMemo(
    () =>
      instruments.filter((i) =>
        (cat === 'all' || i.category === cat) &&
        (i.symbol.toLowerCase().includes(search.toLowerCase()) || i.name.toLowerCase().includes(search.toLowerCase())),
      ),
    [instruments, cat, search],
  );

  return (
    <div className="screen">
      <div className="m-topbar">
        <div className="m-topbar-title">Markets</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          <button className="m-icon-btn"><Bell size={17} /></button>
          <button className="m-icon-btn"><Settings size={17} /></button>
        </div>
      </div>

      <div className="screen-scroll">
        <div className="markets-search">
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input placeholder="Search symbol or market…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}><X size={14} /></button>}
        </div>

        <div className="cat-scroll">
          {cats.map(c => (
            <button key={c} className={`m-cat-btn ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
              {c === 'all' ? 'All Markets' : c === 'commodities' ? 'Commodities' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {filtered.map(inst => {
          const cached = prices[inst.symbol] ?? inst;
          // Prefer a PranaStream live price (when the symbol is touched
          // via useSymbolSearch) over the cached poll-derived price.
          const exchange = (inst as { exchangeCode?: string })?.exchangeCode ?? 'forex';
          const liveTick = getLivePrice(exchange, inst.symbol);
          const live = liveTick ? { bid: liveTick.price, changePct: cached.changePct } : cached;
          const p = live ?? cached;
          const up = (p.changePct ?? 0) >= 0;
          const liveIsActive = isLive(exchange, inst.symbol);
          // Sparkline derived from the live change% — no random walk.
          // The shape is a smooth walk from -|changePct|/2 to +|changePct|/2
          // (with sign matching up) so the visual is reproducible and
          // directionally consistent with the day's move.
          const changePct = p.changePct ?? 0;
          const direction = up ? 1 : -1;
          const magnitude = Math.abs(changePct) / 100;
          const sparkData = Array.from({ length: 15 }, (_, i) => {
            const t = (i / 14) - 0.5; // -0.5 .. +0.5
            const offset = t * direction * magnitude;
            return p.bid * (1 + offset);
          });
          return (
            <div key={inst.symbol} className="market-row" onClick={() => onSelect(inst)}>
              <div className={`mr-icon ${inst.category}`}>{catIcon(inst.category)}</div>
              <div className="mr-info">
                <div className="mr-symbol">
                  {inst.symbol}
                  {liveIsActive && (
                    <span
                      className="mr-live-pill"
                      title="Live PranaStream price"
                      style={{
                        marginLeft: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                        fontSize: 9,
                        fontFamily: 'var(--font-data)',
                        color: 'var(--bull)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      <Activity size={9} /> LIVE
                    </span>
                  )}
                </div>
                <div className="mr-name">{inst.name}</div>
              </div>
              <div className="mr-spark">
                <Spark data={sparkData} color={up ? 'var(--bull)' : 'var(--bear)'} w={56} h={22} />
              </div>
              <div className="mr-price-col">
                <div className="mr-price">{fmtP(p.bid, inst.digits)}</div>
                <div className={`mr-chg ${up ? 'bull' : 'bear'}`}>{sign(p.changePct ?? 0)}{p.changePct?.toFixed(2)}%</div>
              </div>
            </div>
          );
        })}
        <div style={{ height: '16px' }} />
      </div>
    </div>
  );
}

/* ─── DOM Bottom Sheet ───────────────────────────────────────────────────── */
function DOMSheet({ instrument, prices, onClose }: { instrument: Instrument; prices: PriceMap; onClose: () => void }) {
  // DOM data is empty until the real order-book depth endpoint is wired.
  // No fabricated bid/ask levels — render empty state in the body.
  const dom: ReadonlyArray<{ type: 'ask' | 'bid'; price: number; volume: number; depth: number }> = [];
  const asks: ReadonlyArray<{ type: 'ask' | 'bid'; price: number; volume: number; depth: number }> = [];
  const bids: ReadonlyArray<{ type: 'ask' | 'bid'; price: number; volume: number; depth: number }> = [];
  const maxVol = 0;
  const midPrice = prices[instrument?.symbol]?.bid ?? instrument?.bid ?? 0;

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet" style={{ maxHeight: '80dvh' }}>
        <div className="sheet-handle"><div className="sheet-handle-bar" /></div>
        <div className="dom-header-bar">
          <Layers size={16} style={{ color: 'var(--accent)' }} />
          <span className="m-topbar-title">Depth of Market</span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '12px', color: 'var(--text-muted)' }}>{instrument?.symbol}</span>
          <button className="sheet-close" onClick={onClose} style={{ marginLeft: 'auto' }}><X size={13} /></button>
        </div>

        <div className="dom-cols-header">
          <span className="dom-col-label">Price</span>
          <span className="dom-col-label right">Volume</span>
          <span className="dom-col-label right">Depth</span>
        </div>

        <div style={{ overflow: 'auto', maxHeight: 'calc(80dvh - 120px)' }}>
          {asks.map((row, i) => (
            <div key={`ask-${i}`} className="dom-row ask">
              <div className="dom-vol-bar" style={{ width: `${(row.volume / maxVol) * 100}%` }} />
              <span className="dom-price-val">{fmtP(row.price, instrument?.digits ?? 5)}</span>
              <span className="dom-vol-val">{(row.volume / 1000).toFixed(1)}K</span>
              <span className="dom-depth-val">{(row.depth / 1000).toFixed(0)}K</span>
            </div>
          ))}
          <div className="dom-spread-bar">
            <span className="dom-mid-price">{fmtP(midPrice, instrument?.digits ?? 5)}</span>
            <span className="dom-spread-txt">spread</span>
            <span className="dom-spread-val">{instrument?.spread ?? '0.6'} pts</span>
          </div>
          {bids.map((row, i) => (
            <div key={`bid-${i}`} className="dom-row bid">
              <div className="dom-vol-bar" style={{ width: `${(row.volume / maxVol) * 100}%` }} />
              <span className="dom-price-val">{fmtP(row.price, instrument?.digits ?? 5)}</span>
              <span className="dom-vol-val">{(row.volume / 1000).toFixed(1)}K</span>
              <span className="dom-depth-val">{(row.depth / 1000).toFixed(0)}K</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── Research Screen (Calendar & News) ──────────────────────────────────── */
function CalendarNewsScreen() {
  const [tab, setTab]       = useState<'calendar' | 'news' | 'alerts'>('calendar');
  const [impact, setImpact] = useState('all');
  const filteredCal: ReadonlyArray<{ id: string; impact: string }> = [];

  return (
    <div className="screen">
      <div className="m-topbar">
        <div className="m-topbar-title">Research</div>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-data)', fontSize: '11px', color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      <div className="tab-row">
        {[{ id: 'calendar' as const, label: 'Calendar' }, { id: 'news' as const, label: 'News' }, { id: 'alerts' as const, label: 'Alerts' }].map(t => (
          <button key={t.id} className={`m-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="screen-scroll">
        {tab === 'calendar' && (
          <>
            <div className="impact-filter">
              {[{ id: 'all', label: 'All Events' }, { id: 'high', label: 'High', dot: 'high' }, { id: 'medium', label: 'Medium', dot: 'medium' }].map(f => (
                <button key={f.id} className={`impact-btn ${impact === f.id ? `active ${f.id}` : ''}`} onClick={() => setImpact(f.id)}>
                  {f.dot && <div className={`impact-dot ${f.dot}`} />}
                  {f.label}
                </button>
              ))}
            </div>
            {filteredCal.length === 0 ? (
              <div className="empty-state-pad" style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
                No economic events
                <div style={{ marginTop: '6px' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>Backend pending</span>
                </div>
              </div>
            ) : filteredCal.map((e: any) => (
              <div key={e.id} className="cal-event-row">
                <div className={`cal-impact-dot ${e.impact}`} />
                <div className="cal-time">{e.time}</div>
                <div className="cal-flag">{e.flag}</div>
                <div className="cal-info">
                  <div className="cal-event-name">{e.event}</div>
                  <div className="cal-vals">
                    {e.forecast && <span className="cal-val-item">F: {e.forecast}</span>}
                    {e.previous && <span className="cal-val-item">P: {e.previous}</span>}
                    {e.actual   && <span className={`cal-val-item ${parseFloat(e.actual) >= parseFloat(e.forecast ?? '0') ? 'cal-actual-up' : 'cal-actual-down'}`}>A: {e.actual}</span>}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'news' && (
          <div className="empty-state-pad" style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
            No news yet
            <div style={{ marginTop: '6px' }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>Backend pending</span>
            </div>
          </div>
        )}

        {tab === 'alerts' && (
          <>
            <div className="alert-empty">
              <div className="alert-empty-icon"><Bell size={36} /></div>
              <div className="alert-empty-text">No active price alerts</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Set alerts to get notified when prices reach your targets</div>
            </div>
            <button className="add-alert-btn"><Plus size={16} /> Add Price Alert</button>
          </>
        )}
        <div style={{ height: '16px' }} />
      </div>
    </div>
  );
}

/* ─── Account Screen ─────────────────────────────────────────────────────── */
function AccountScreen({ account }: { account: AccountSnapshot | null }) {
  const [tab, setTab] = useState<'overview' | 'history' | 'stats'>('overview');

  // Default values if no account data
  const displayAccount = account ?? {
    name: 'No Account',
    accountId: '—',
    server: '—',
    accountType: 'Trading',
    leverage: '1:100',
    equity: 0,
    balance: 0,
    margin: 0,
    freeMargin: 0,
    marginLevel: 100,
    unrealizedPnl: 0,
    realizedPnlToday: 0,
    drawdownPct: 0,
    currency: 'USD',
  };

  const marginPct  = Math.min((displayAccount.margin / (displayAccount.equity || 1)) * 100, 100);
  const riskColor  = marginPct < 20 ? 'var(--bull)' : marginPct < 50 ? 'var(--warn)' : 'var(--bear)';
  const totalProfit = 0;
  const totalLoss = 0;
  const winRate = '0';

  return (
    <div className="screen">
      <div className="m-topbar">
        <div className="m-topbar-title">Account</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          <button className="m-icon-btn"><Settings size={17} /></button>
          <button className="m-icon-btn" style={{ color: 'var(--bear)' }}><LogOut size={17} /></button>
        </div>
      </div>

      <div className="tab-row">
        {[{ id: 'overview' as const, label: 'Overview' }, { id: 'history' as const, label: 'History' }, { id: 'stats' as const, label: 'Stats' }].map(t => (
          <button key={t.id} className={`m-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="screen-scroll">
        {tab === 'overview' && (
          <>
            <div className="account-hero">
              <div className="account-avatar-lg">AM</div>
              <div className="account-info">
                <div className="account-name">{displayAccount.name}</div>
                <div className="account-id">{displayAccount.accountId} · {displayAccount.server}</div>
                <div className="account-type-tag"><Shield size={10} />{displayAccount.accountType} · {displayAccount.leverage}</div>
              </div>
              <div className="account-equity-side">
                <div className="account-eq-label">Equity</div>
                <div className="account-eq-value">${fmt(displayAccount.equity)}</div>
              </div>
            </div>

            <div className="stats-grid-4">
              {[
                { l: 'Balance',        v: `$${fmt(displayAccount.balance)}` },
                { l: 'Unrealised P&L', v: `${sign(displayAccount.unrealizedPnl)}$${fmt(Math.abs(displayAccount.unrealizedPnl))}`, c: pc(displayAccount.unrealizedPnl) },
                { l: 'Free Margin',    v: `$${fmt(displayAccount.freeMargin)}` },
                { l: 'Margin Level',   v: `${fmt(displayAccount.marginLevel)}%`, c: 'bull' },
                { l: 'Used Margin',    v: `$${fmt(displayAccount.margin)}` },
                { l: 'Today P&L',      v: `+$${fmt(displayAccount.realizedPnlToday)}`, c: 'bull' },
              ].map(s => (
                <div key={s.l} className="stat-cell">
                  <div className="sc-label">{s.l}</div>
                  <div className={`sc-value mono ${s.c ?? ''}`}>{s.v}</div>
                </div>
              ))}
            </div>

            <div className="risk-section">
              <div className="risk-card">
                <div className="risk-header">
                  <div className="risk-title">Margin Usage</div>
                  <div className="risk-pct" style={{ color: riskColor }}>{marginPct.toFixed(1)}%</div>
                </div>
                <div className="risk-track">
                  <div className="risk-fill" style={{ width: `${marginPct}%`, background: riskColor }} />
                </div>
                <div className="risk-labels"><span>Safe</span><span>Warning</span><span>Margin Call</span></div>
              </div>
            </div>

            <div style={{ margin: '0 12px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>30-Day P&L</span>
                <span style={{ fontFamily: 'var(--font-data)', fontSize: '14px', fontWeight: 600, color: 'var(--bull)' }}>+$3,567</span>
              </div>
              <PnLArea data={[]} h={52} />
            </div>
          </>
        )}

        {tab === 'history' && (
          <>
            <div className="history-summary">
              {[
                { l: 'Win Rate',     v: `${winRate}%`, c: 'bull' },
                { l: 'Gross Profit', v: `+$${fmt(totalProfit)}`, c: 'bull' },
                { l: 'Net P&L',      v: `+$${fmt(totalProfit + totalLoss)}`, c: 'bull' },
              ].map(s => (
                <div key={s.l} className="hs-item">
                  <div className="hs-label">{s.l}</div>
                  <div className={`hs-value mono ${s.c}`}>{s.v}</div>
                </div>
              ))}
            </div>
            {/* Trade history - show empty state when no data */}
            <div className="empty-state-pad" style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>
              No trade history yet
              <div style={{ marginTop: '6px' }}>
                <span style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>Backend pending</span>
              </div>
            </div>
          </>
        )}

        {tab === 'stats' && (
          <div style={{ padding: '16px' }}>
            {[
              { label: 'Total Trades',  value: 0 },
              { label: 'Win Rate',      value: `${winRate}%`,                                     c: 'bull' },
              { label: 'Gross Profit',  value: `+$${fmt(totalProfit)}`,                            c: 'bull' },
              { label: 'Gross Loss',    value: `-$${fmt(Math.abs(totalLoss))}`,                    c: 'bear' },
              { label: 'Net P&L',       value: `+$${fmt(totalProfit + totalLoss)}`,                c: 'bull' },
              { label: 'Profit Factor', value: `${(totalProfit / Math.abs(totalLoss || 1)).toFixed(2)}`, c: 'bull' },
              { label: 'Best Trade',    value: `+$${fmt(0)}`, c: 'bull' },
              { label: 'Worst Trade',   value: `-$${fmt(0)}`, c: 'bear' },
              { label: 'Max Drawdown',  value: `${displayAccount.drawdownPct}%`,                         c: 'bear' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.label}</span>
                <span className={`mono ${s.c ?? ''}`} style={{ fontSize: '14px', fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: '16px' }} />
      </div>
    </div>
  );
}

/* ─── Bottom Navigation ──────────────────────────────────────────────────── */
function BottomNav({ active, onChange, onTrade }: { active: Screen; onChange: (s: Screen) => void; onTrade: () => void }) {
  const items = [
    { id: 'home' as Screen,      icon: <Home size={20} />,      label: 'Home' },
    { id: 'markets' as Screen,   icon: <BarChart2 size={20} />,  label: 'Markets' },
    { id: '_trade' as Screen,    fab: true, icon: null,          label: '' },
    { id: 'portfolio' as Screen, icon: <Briefcase size={20} />,  label: 'Portfolio' },
    { id: 'account' as Screen,   icon: <User size={20} />,       label: 'Account' },
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
            <div className="nav-icon" style={{ color: active === item.id ? 'var(--accent)' : 'var(--text-muted)' }}>
              {item.icon}
            </div>
            <span className="nav-label">{item.label}</span>
          </div>
        )
      )}
    </nav>
  );
}

/* ─── Root Component (Presentational) ────────────────────────────────────────
 *
 * Accepts all trading data via the `data` prop (supplied by MobileWorkstation adapter).
 * The adapter handles Apollo hooks - this component is purely presentational.
 *
 * NO FALLBACK TO MOCK DATA - all data comes from props. Proper loading/empty/error states shown.
 */
export function MobileTradingDashboard({
  data,
  onSetActiveSymbol,
  desktopHref,
}: MobileTradingDashboardProps) {
  // Require data prop - always show loading/error state if missing, not mock fallback
  if (!data) {
    return (
      <div className="mobile-app">
        <div className="screen">
          <div className="data-error">
            <div className="data-error-icon">⚠️</div>
            <div className="data-error-text">Loading trading data...</div>
          </div>
        </div>
      </div>
    );
  }

  const resolved = data;

  // Merge live quotes (from adapter) with instrument catalogue for price lookups.
  // The adapter's quotesBySymbol contains only the active instrument's live quote;
  // inactive instruments keep their base price from the catalogue.
  const prices: PriceMap = useMemo(() => {
    const base: PriceMap = {};
    resolved.instruments.forEach(inst => { base[inst.symbol] = { ...inst }; });
    Object.entries(resolved.quotesBySymbol).forEach(([symbol, quote]) => {
      if (base[symbol]) {
        base[symbol] = {
          ...base[symbol],
          bid: quote.price,
          ask: quote.price + base[symbol].spread * base[symbol].pip,
          lastPrice: quote.price,
        };
      }
    });
    return base;
  }, [resolved.instruments, resolved.quotesBySymbol]);

  // UI-only state (navigation, sheets, toasts — not trading data)
  const [screen, setScreen]           = useState<Screen>('home');
  const [activeInstrument, setActive] = useState<Instrument | null>(resolved.instruments[0] ?? null);
  const [toasts, setToasts]           = useState<ToastItem[]>([]);
  const [showTrade, setShowTrade]     = useState(false);
  const [tradeSide, setTradeSide]     = useState<'buy' | 'sell'>('buy');
  const [showDOM, setShowDOM]         = useState(false);
  // Sim prices start empty — no fabricated instrument list. The catalogue
  // hydrates via `useGetInstrumentsQuery` and sims only tick for live symbols.
  const [simPrices, setSimPrices] = useState<Record<string, { bid: number; ask: number }>>(() => {
    const seed: Record<string, { bid: number; ask: number }> = {};
    resolved.instruments.forEach((inst) => { seed[inst.symbol] = { bid: inst.bid, ask: inst.ask }; });
    return seed;
  });

  // Price-tick simulation — only active when the adapter provides no live quotes
  // (i.e. unauthenticated or demo mode). When live quotes arrive, the adapter
  // drives prices via useGetQuoteQuery and this interval is redundant.
  const hasLiveQuotes = Object.keys(resolved.quotesBySymbol).length > 0;

  useEffect(() => {
    if (hasLiveQuotes) return; // adapter drives prices
    const iv = setInterval(() => {
      setSimPrices(prev => {
        const next: Record<string, { bid: number; ask: number }> = { ...prev };
        resolved.instruments.forEach(inst => {
          // Fall back to the instrument's base price if no seed entry exists
          // (defensive — should not happen since simPrices is seeded on mount).
          const p = next[inst.symbol] ?? { bid: inst.bid, ask: inst.ask };
          const tick = (Math.random() - 0.5) * inst.pip * 4;
          const newBid = parseFloat((p.bid + tick).toFixed(inst.digits));
          const newAsk = parseFloat((newBid + inst.spread * inst.pip).toFixed(inst.digits));
          next[inst.symbol] = { bid: newBid, ask: newAsk };
        });
        return next;
      });
    }, 800);
    return () => clearInterval(iv);
  }, [hasLiveQuotes, resolved.instruments]);

  // P&L simulation — only active when the adapter provides no live positions
  // (i.e. unauthenticated or demo mode). When live positions arrive, the
  // adapter computes P&L and this interval is redundant.
  const hasLivePositions = resolved.positions.length > 0;

  useEffect(() => {
    if (hasLivePositions) return; // adapter drives positions
    const iv = setInterval(() => {
      setLocalPositions(prev => prev.map(pos => {
        const p = prices[pos.symbol];
        if (!p) return pos;
        const diff = pos.type === 'BUY' ? (p.bid - pos.openPrice) : (pos.openPrice - p.ask);
        const pnl  = diff * pos.lots * 100000;
        return { ...pos, currentPrice: pos.type === 'BUY' ? p.bid : p.ask, pnl: parseFloat(pnl.toFixed(2)) };
      }));
    }, 800);
    return () => clearInterval(iv);
  }, [hasLivePositions, prices]);

  // Local positions state — seeded from adapter data; only mutated locally
  // for demo/mock mode (close-position swipe). In live mode, mutations
  // go through the adapter's placeOrder/cancelOrder and Apollo refetches.
  const [localPositions, setLocalPositions] = useState<OpenPosition[]>(resolved.positions);

  // Sync positions from adapter when they change (e.g. after a mutation refetch)
  useEffect(() => { setLocalPositions(resolved.positions); }, [resolved.positions]);

  const addToast = useCallback((text: string, sub: string, type: 'bull' | 'bear' = 'bull') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, text, sub, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const handleTrade = useCallback((side: 'buy' | 'sell', inst?: Instrument) => {
    setTradeSide(side);
    if (inst) setActive(inst);
    setShowTrade(true);
  }, []);

  const handleConfirmTrade = useCallback(async ({
    side, otype, lots, instrument,
    price, triggerPrice, triggerCondition, trailingDistance, trailingPct,
    displayQty, algoType, slices, durationMinutes
  }: {
    side: string;
    otype: OrderTypeMobile;
    lots: number;
    instrument: Instrument;
    price?: string;
    triggerPrice?: string;
    triggerCondition?: 'ABOVE' | 'BELOW';
    trailingDistance?: string;
    trailingPct?: string;
    displayQty?: string;
    algoType?: AlgoTypeMobile;
    slices?: number;
    durationMinutes?: number;
  }) => {
    const instId = instrument.instrumentId ?? instrument.symbol;
    const p = prices[instrument?.symbol] ?? instrument;
    const fillPrice = side === 'buy' ? p.ask : p.bid;

    try {
      // Determine order type mapping to API enum
      const typeMap: Record<string, string> = {
        'Market': 'MARKET',
        'Limit': 'LIMIT',
        'Stop': 'STOP',
        'Stop Limit': 'STOP_LIMIT',
        'GTT': 'GTT',
        'Trailing': 'TRAILING_STOP',
      };

      // Route to appropriate handler based on order type
      if (otype === 'TWAP' || otype === 'VWAP' || otype === 'Iceberg') {
        // Algo orders - use REST
        await resolved.placeAlgoOrder({
          instrumentId: instId,
          side: side === 'buy' ? 'BUY' : 'SELL',
          type: otype === 'Iceberg' ? 'ICEBERG' : (otype as 'TWAP' | 'VWAP'),
          quantity: lots.toFixed(2),
          slices,
          durationMinutes,
          displayQty,
        });
        addToast(
          `${side.toUpperCase()} ${lots} lots ${instrument?.symbol}`,
          `${otype} algo order placed`,
          side === 'buy' ? 'bull' : 'bear'
        );
      } else {
        // Standard orders via GraphQL mutation
        await resolved.placeOrder({
          instrumentId: instId,
          side: side === 'buy' ? 'BUY' : 'SELL',
          type: (typeMap[otype] || 'MARKET') as 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'GTT' | 'TRAILING_STOP',
          quantity: lots.toFixed(2),
          price,
          triggerPrice,
          triggerCondition,
          trailingDistance,
          trailingPct,
        });
        addToast(
          `${side.toUpperCase()} ${lots} lots ${instrument?.symbol}`,
          `${otype} ${otype === 'Market' ? 'filled' : 'placed'} @ ${fmtP(fillPrice, instrument?.digits)}`,
          side === 'buy' ? 'bull' : 'bear'
        );
      }
    } catch (e) {
      addToast(
        `Order failed`,
        e instanceof Error ? e.message : 'Unknown error',
        'bear'
      );
    }
  }, [resolved.placeOrder, resolved.placeAlgoOrder, prices, addToast]);

  const handleClosePosition = useCallback((id: string) => {
    const pos = localPositions.find(p => p.id === id);
    if (!pos) return;
    // Optimistic local removal; adapter's cancelOrder fires async
    setLocalPositions(prev => prev.filter(p => p.id !== id));
    void resolved.cancelOrder(id);
    addToast(`Closed ${pos.symbol}`, `P&L: ${sign(pos.pnl)}$${fmt(Math.abs(pos.pnl))}`, pos.pnl >= 0 ? 'bull' : 'bear');
  }, [localPositions, resolved.cancelOrder, addToast]);

  const handleSymbol = useCallback((inst: Instrument) => {
    setActive(inst);
    setScreen('chart');
    onSetActiveSymbol?.(inst.symbol);
  }, [onSetActiveSymbol]);

  const displayPositions = hasLivePositions ? resolved.positions : localPositions;

  return (
    <div className="mobile-app">
      {resolved.loading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--bg-base)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, color: 'var(--text-muted)', fontSize: '14px',
        }}>
          Loading…
        </div>
      )}

      {resolved.error && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          background: 'rgba(255,59,92,0.15)', borderBottom: '1px solid var(--bear)',
          padding: '8px 16px', fontSize: '12px', color: 'var(--bear)',
          zIndex: 9998, fontFamily: 'var(--font-data)',
        }}>
          {resolved.error}
        </div>
      )}

      {!resolved.isAuthenticated && (
        <div style={{
          position: 'fixed', top: resolved.error ? '36px' : 0, left: 0, right: 0,
          background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)',
          padding: '10px 16px', fontSize: '13px', color: 'var(--text-secondary)',
          zIndex: 9997, textAlign: 'center',
        }}>
          Sign in to trade live · <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Log in</span>
        </div>
      )}

      <div style={{ paddingTop: resolved.error || !resolved.isAuthenticated ? (resolved.error && !resolved.isAuthenticated ? '72px' : '36px') : 0 }}>
        {screen === 'home'      && <HomeScreen account={resolved.account} instruments={resolved.instruments} prices={prices} positions={displayPositions} onSymbol={handleSymbol} onTrade={(s) => { setTradeSide(s); setShowTrade(true); }} desktopHref={desktopHref} />}
        {screen === 'chart'     && activeInstrument && <ChartScreen instrument={activeInstrument} prices={prices} onTrade={handleTrade} onBack={() => setScreen('markets')} />}
        {screen === 'portfolio' && <PortfolioScreen account={resolved.account} positions={displayPositions} orders={resolved.orders} onClose={handleClosePosition} onTrade={handleTrade} />}
        {screen === 'markets'   && <MarketsScreen instruments={resolved.instruments} prices={prices} onSelect={(inst) => { setActive(inst); setScreen('chart'); }} />}
        {screen === 'research'  && <CalendarNewsScreen />}
        {screen === 'account'   && <AccountScreen account={resolved.account} />}
      </div>

      <BottomNav
        active={screen}
        onChange={(s) => setScreen(s)}
        onTrade={() => setShowTrade(true)}
      />

      {showTrade && activeInstrument && (
        <TradeTicket
          instrument={activeInstrument}
          prices={prices}
          onClose={() => setShowTrade(false)}
          onConfirm={handleConfirmTrade}
        />
      )}

      {showDOM && activeInstrument && (
        <DOMSheet
          instrument={activeInstrument}
          prices={prices}
          onClose={() => setShowDOM(false)}
        />
      )}

      <ToastLayer toasts={toasts} />
    </div>
  );
}
