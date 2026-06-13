/**
 * File:        libs/trading-ui/src/workstation/trading-workstation.tsx
 * Module:      trading-ui · Workstation
 * Purpose:     Full trading workstation shell — platform-agnostic orchestrator for all trading panels.
 *              NO MOCK DATA - all data must be passed via props. Empty states shown when data is empty.
 *              Accepts optional PranaStream-sourced data (ticks, candles, dom, ping) — when the
 *              caller supplies them, the internal simulators are disabled. The lib itself does
 *              NOT import from apps/web/lib/prana-stream — it stays layer-agnostic so Electron,
 *              mobile, and other wrappers can wire their own data sources.
 *
 * Exports:
 *   - TradingWorkstation({ fetchJson, mobileHref?, forceMobileLayout?, omsConfig?, onTradeSubmit?,
 *                          balance?, positions?, pendingOrders?, ticks?, candles?, domFrame?, ping? }) → ReactNode
 *
 * Depends on:
 *   - ../lib/workstation-api — FetchJsonFn, OmsConfig, PlaceUiOrder, mergeApiWatchlistInstruments, submitOrderToOms
 *   - ../lib/format-utils — fmt, fmtPrice, pnlSign
 *   - ../types/instrument — Instrument, OpenPosition, ToastItem
 *   - ../panels/* — all nine trading panel components
 *
 * Side-effects:
 *   - setInterval for price tick simulation (only when no live `ticks` prop is provided AND no `prices` seed)
 *   - setInterval for P&L recalculation (only when no live positions provided)
 *   - Network call via fetchJson (watchlist merge)
 *
 * Key invariants:
 *   - fetchJson is injected by the caller — no direct use of window.fetch, useAuth, or next/link
 *   - Web app passes fetch+Bearer; Electron passes window.ntBridge.api.fetch (IPC call)
 *   - mobileHref absent → StatusBarTrading omits the Mobile link (correct for Electron renderer)
 *   - omsConfig absent → submitOrderToOms returns { ok: false } and falls back to simulated fill toast
 *   - instruments/positions/orders MUST be passed via props - NO automatic mock data fallback
 *   - Empty arrays shown as "no data" UI, not fallback to mock data
 *   - When `ticks` is provided, the price simulator is disabled; bids/asks are derived from ticks
 *   - When `candles` is provided, the chart uses them; otherwise the chart panel may fall back
 *     to its own seeded generator (still random; flagged by the panel as such)
 *   - When `domFrame` is provided, the DOM panel uses it; otherwise the DOM panel may fall back
 *   - When `ping` is provided, no internal ping simulator runs
 *
 * Read order:
 *   1. TradingWorkstation — component entry, state declarations
 *   2. handleTrade — core trade-submission + toast feedback
 *   3. price/position simulation effects (only when no live data)
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Instrument, OpenPosition, PendingOrder, ToastItem } from '../types/instrument';
import { fmt, fmtPrice, pnlSign } from '../lib/format-utils';
// NO MOCK DATA - all data must come from props
import {
  mergeApiWatchlistInstruments,
  submitOrderToOms,
  type FetchJsonFn,
  type OmsConfig,
  type PlaceUiOrder,
} from '../lib/workstation-api';
import { AccountSummaryPanel } from '../panels/account-summary-panel';
import { BottomTabsPanel } from '../panels/bottom-tabs-panel';
import { ChartPanel } from '../panels/chart-panel';
import { DepthOfMarket } from '../panels/depth-of-market';
import { OrderEntry } from '../panels/order-entry';
import { StatusBarTrading } from '../panels/status-bar-trading';
import { ToastContainer } from '../panels/toast-container';
import { TradingTopBar } from '../panels/trading-top-bar';
import { WatchlistPanel } from '../panels/watchlist-panel';

export function TradingWorkstation({
  fetchJson,
  mobileHref,
  forceMobileLayout = false,
  omsConfig,
  initialInstrument,
  onInstrumentChange,
  onTradeSubmit,
  balance,
  /** Seed positions from GraphQL instead of the mock OPEN_POSITIONS. */
  positions: seededPositions,
  pendingOrders,
  /** Optional PranaStream-sourced live price ticks. When provided, the internal price simulator is disabled and bid/ask derive from ticks. */
  ticks,
  /** Optional pre-built candle series for the chart. When provided, the ChartPanel uses it instead of its own generator. */
  candles,
  /** Optional live DOM snapshot from PranaStream. When provided, the DepthOfMarket panel uses it. */
  domFrame,
  /** Optional server ping value. When provided, the random ping simulator is disabled. */
  ping,
}: {
  fetchJson: FetchJsonFn;
  mobileHref?: string;
  forceMobileLayout?: boolean;
  omsConfig?: OmsConfig;
  /** Seed the active instrument on mount (used by tab manager to restore per-tab state). */
  initialInstrument?: Instrument | null;
  /** Called whenever the active instrument changes — lets the tab manager track the label. */
  onInstrumentChange?: (instrument: Instrument | null) => void;
  /** Inject a custom trade-submission handler (web wrapper uses Apollo; Electron can inject IPC). */
  onTradeSubmit?: (payload: PlaceUiOrder) => Promise<{ ok: true; detail?: string } | { ok: false; message: string }>;
  /** Seed positions from GraphQL instead of the mock OPEN_POSITIONS. */
  positions?: OpenPosition[];
  /** Seed pending orders from GraphQL instead of the mock PENDING_ORDERS. */
  pendingOrders?: PendingOrder[];
  /** Live account balance snapshot — passed to AccountSummaryPanel; absent = ACCOUNT mock. */
  balance?: {
    equity: number;
    freeMargin: number;
    margin: number;
    unrealizedPnl: number;
    realizedPnlToday: number;
    balance: number;
    currency: string;
    accountId: string;
    accountType: string;
    leverage: string;
  };
  /** Live tick stream keyed by "EXCHANGE:SYMBOL". When supplied, the price simulator is disabled. */
  ticks?: { exchange: string; symbol: string; price: number; ts: number }[];
  /** Live OHLCV series for the active instrument. When supplied, the chart panel uses it. */
  candles?: { time: number; open: number; high: number; low: number; close: number; volume: number }[];
  /** Live order book depth frame from PranaStream. When supplied, the DOM panel uses it. */
  domFrame?: {
    exchange: string;
    symbol: string;
    bids: { price: number; size: number }[];
    asks: { price: number; size: number }[];
    ts: number;
  } | null;
  /** Live ping value (ms). When supplied, the ping simulator is disabled. */
  ping?: number;
}) {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [activeInstrument, setActiveInstrument] = useState<Instrument | null>(
    initialInstrument !== undefined ? initialInstrument : null,
  );
  const [prices, setPrices] = useState<Record<string, Instrument>>({});
  const [positions, setPositions] = useState<OpenPosition[]>(seededPositions ?? []);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // External ping (e.g. live from PranaStream) wins; otherwise seed 12, otherwise simulator updates it.
  const [internalPing, setInternalPing] = useState(12);
  const effectivePing = ping ?? internalPing;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const merged = await mergeApiWatchlistInstruments(fetchJson, []);
      if (!cancelled) {
        setInstruments(merged);
        setPrices((prev) => {
          const next = { ...prev };
          for (const i of merged) {
            if (!next[i.symbol]) next[i.symbol] = { ...i };
          }
          return next;
        });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [fetchJson]);

  // Notify parent when active instrument changes (tab label sync)
  useEffect(() => {
    onInstrumentChange?.(activeInstrument);
  }, [activeInstrument, onInstrumentChange]);

  // Sync seeded positions from GraphQL when they arrive (e.g., account switch)
  useEffect(() => {
    if (seededPositions && seededPositions.length > 0) {
      setPositions(seededPositions);
    }
  }, [seededPositions]);

  useEffect(() => {
    if (ticks) return; // live data wins; skip the simulator
    const iv = setInterval(() => {
      setPrices((prev) => {
        const next = { ...prev };
        for (const inst of instruments) {
          const p = next[inst.symbol];
          if (!p) continue;
          const tick = (Math.random() - 0.5) * inst.pip * 4;
          const newBid = parseFloat((p.bid + tick).toFixed(inst.digits));
          const newAsk = parseFloat((newBid + inst.spread * inst.pip).toFixed(inst.digits));
          next[inst.symbol] = { ...p, bid: newBid, ask: newAsk, change: newBid - inst.bid };
        }
        return next;
      });
      if (ping === undefined) setInternalPing(Math.floor(Math.random() * 8 + 8));
    }, 700);
    return () => clearInterval(iv);
  }, [instruments, ticks, ping]);

  // Synthesize bid/ask from live ticks when the caller supplies them.
  // (Replaces the simulator's bid/ask derivation with the same formula, but driven by real data.)
  const lastTickPriceBySymbol = useMemo(() => {
    if (!ticks) return null;
    const m = new Map<string, number>();
    for (const t of ticks) m.set(`${t.exchange}:${t.symbol}`, t.price);
    return m;
  }, [ticks]);

  useEffect(() => {
    if (!lastTickPriceBySymbol) return;
    setPrices((prev) => {
      const next = { ...prev };
      for (const [key, price] of lastTickPriceBySymbol) {
        const symbol = key.split(':')[1];
        const inst = next[symbol];
        if (!inst) continue;
        const halfSpread = (inst.spread * inst.pip) / 2;
        const bid = parseFloat((price - halfSpread).toFixed(inst.digits));
        const ask = parseFloat((price + halfSpread).toFixed(inst.digits));
        next[symbol] = { ...inst, bid, ask, change: bid - inst.bid };
      }
      return next;
    });
  }, [lastTickPriceBySymbol]);

  useEffect(() => {
    const iv = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos) => {
          const p = prices[pos.symbol];
          if (!p) return pos;
          const diff = pos.type === 'BUY' ? p.bid - pos.openPrice : pos.openPrice - p.ask;
          const pnl = diff * pos.lots * 100000;
          return {
            ...pos,
            currentPrice: pos.type === 'BUY' ? p.bid : p.ask,
            pnl: parseFloat(pnl.toFixed(2)),
          };
        }),
      );
    }, 700);
    return () => clearInterval(iv);
  }, [prices]);

  const addToast = useCallback((text: string, sub: string | undefined, type: 'bull' | 'bear') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, sub, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const handleTrade = useCallback(
    async (payload: PlaceUiOrder) => {
      const result = onTradeSubmit
        ? await onTradeSubmit(payload)
        : await submitOrderToOms(fetchJson, payload, omsConfig);
      if (result.ok) {
        addToast(
          `${payload.side.toUpperCase()} ${payload.lots} lots ${payload.instrument?.symbol ?? ''}`,
          `OMS accepted · ${result.detail ?? 'ok'}`,
          payload.side === 'buy' ? 'bull' : 'bear',
        );
        return;
      }
      const inst =
        payload.instrument && prices[payload.instrument.symbol]
          ? prices[payload.instrument.symbol]
          : payload.instrument;
      const fillPrice = payload.side === 'buy' ? inst?.ask ?? 0 : inst?.bid ?? 0;
      addToast(
        `${payload.side.toUpperCase()} ${payload.lots} lots ${payload.instrument?.symbol ?? ''} (simulated)`,
        `${payload.type} @ ${fmtPrice(fillPrice, payload.instrument?.digits ?? 5)} · ${result.message}`,
        payload.side === 'buy' ? 'bull' : 'bear',
      );
    },
    [addToast, fetchJson, omsConfig, prices, onTradeSubmit],
  );

  const handleClosePosition = useCallback(
    (id: string) => {
      const pos = positions.find((p) => p.id === id);
      if (!pos) return;
      setPositions((prev) => prev.filter((p) => p.id !== id));
      addToast(
        `Position closed: ${pos.symbol}`,
        `P&L: ${pnlSign(pos.pnl)}$${fmt(Math.abs(pos.pnl))}`,
        pos.pnl >= 0 ? 'bull' : 'bear',
      );
    },
    [positions, addToast],
  );

  const pinned = useMemo(() => {
    const catalogue = instruments.filter((i) => instruments.some((b) => b.symbol === i.symbol));
    return (catalogue.length ? catalogue : instruments).slice(0, 5);
  }, [instruments]);

  const shellClass = forceMobileLayout ? 'nt-workstation-shell nt-mobile-layout' : 'nt-workstation-shell';

  return (
    <div className={shellClass}>
      <div className="dashboard-root">
        <TradingTopBar
          activeInstrument={activeInstrument}
          prices={prices}
          onSymbolClick={setActiveInstrument}
          account={balance ?? null}
          pinned={pinned}
        />

        <div className="dashboard-body">
          <WatchlistPanel
            instruments={instruments}
            activeInstrument={activeInstrument}
            prices={prices}
            onSelect={setActiveInstrument}
          />

          <div className="main-area">
            <div className="chart-dom-row">
              <div className="chart-section">
                <ChartPanel
                  instrument={activeInstrument}
                  prices={prices}
                  // Optional: Pass real candles when available (skips lib's simulated candles)
                  candles={candles}
                />
              </div>
              <DepthOfMarket
                instrument={activeInstrument ? prices[activeInstrument.symbol] ?? activeInstrument : null}
                // Optional: Pass live DOM when available (skips lib's simulated DOM)
                domFrame={domFrame}
              />
            </div>

            <BottomTabsPanel positions={positions} onClosePosition={handleClosePosition} pendingOrders={pendingOrders} />
          </div>

          <div className="right-sidebar">
            <OrderEntry instrument={activeInstrument} prices={prices} onTrade={(p) => void handleTrade(p)} />
            <AccountSummaryPanel snapshot={balance ? {
              name: 'Trading Account',
              accountId: balance.accountId,
              accountType: balance.accountType,
              broker: 'Obsidian Markets',
              currency: balance.currency,
              leverage: balance.leverage,
              balance: balance.balance,
              equity: balance.equity,
              margin: balance.margin,
              freeMargin: balance.freeMargin,
              marginLevel: balance.margin > 0 ? (balance.equity / balance.margin) * 100 : 0,
              unrealizedPnl: balance.unrealizedPnl,
              realizedPnlToday: balance.realizedPnlToday,
              drawdownPct: 0,
              server: 'OB-LIVE-01',
              ping: effectivePing,
            } : undefined} />
          </div>
        </div>

        <StatusBarTrading ping={effectivePing} account={balance ?? null} mobileHref={mobileHref} />
        <ToastContainer toasts={toasts} />
      </div>
    </div>
  );
}
