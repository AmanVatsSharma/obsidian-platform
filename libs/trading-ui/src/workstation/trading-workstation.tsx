/**
 * File:        libs/trading-ui/src/workstation/trading-workstation.tsx
 * Module:      trading-ui · Workstation
 * Purpose:     Full trading workstation shell — platform-agnostic orchestrator for all trading panels.
 *
 * Exports:
 *   - TradingWorkstation({ fetchJson, mobileHref?, forceMobileLayout?, omsConfig? }) → ReactNode
 *
 * Depends on:
 *   - ../lib/workstation-api — FetchJsonFn, OmsConfig, PlaceUiOrder, mergeApiWatchlistInstruments, submitOrderToOms
 *   - ../lib/mock-data — ACCOUNT, INSTRUMENTS, OPEN_POSITIONS
 *   - ../lib/format-utils — fmt, fmtPrice, pnlSign
 *   - ../types/instrument — Instrument, OpenPosition, ToastItem
 *   - ../panels/* — all nine trading panel components
 *
 * Side-effects:
 *   - setInterval for price tick simulation (cleared on unmount)
 *   - setInterval for P&L recalculation against live prices (cleared on unmount)
 *   - Network call on mount via fetchJson (watchlist merge)
 *
 * Key invariants:
 *   - fetchJson is injected by the caller — no direct use of window.fetch, useAuth, or next/link
 *   - Web app passes fetch+Bearer; Electron passes window.ntBridge.api.fetch (IPC call)
 *   - mobileHref absent → StatusBarTrading omits the Mobile link (correct for Electron renderer)
 *   - omsConfig absent → submitOrderToOms returns { ok: false } and falls back to simulated fill toast
 *
 * Read order:
 *   1. TradingWorkstation — component entry, state declarations
 *   2. handleTrade — core trade-submission + toast feedback
 *   3. price/position simulation effects
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Instrument, OpenPosition, ToastItem } from '../types/instrument';
import { fmt, fmtPrice, pnlSign } from '../lib/format-utils';
import { ACCOUNT, INSTRUMENTS, OPEN_POSITIONS } from '../lib/mock-data';
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
}: {
  fetchJson: FetchJsonFn;
  mobileHref?: string;
  forceMobileLayout?: boolean;
  omsConfig?: OmsConfig;
  /** Seed the active instrument on mount (used by tab manager to restore per-tab state). */
  initialInstrument?: Instrument | null;
  /** Called whenever the active instrument changes — lets the tab manager track the label. */
  onInstrumentChange?: (instrument: Instrument | null) => void;
}) {
  const [instruments, setInstruments] = useState<Instrument[]>(INSTRUMENTS);
  const [activeInstrument, setActiveInstrument] = useState<Instrument | null>(
    initialInstrument !== undefined ? initialInstrument : INSTRUMENTS[0] ?? null,
  );
  const [prices, setPrices] = useState<Record<string, Instrument>>(() =>
    Object.fromEntries(INSTRUMENTS.map((i) => [i.symbol, { ...i }])),
  );
  const [positions, setPositions] = useState<OpenPosition[]>(OPEN_POSITIONS);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [ping, setPing] = useState(12);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const merged = await mergeApiWatchlistInstruments(fetchJson, [...INSTRUMENTS]);
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

  useEffect(() => {
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
      setPing(Math.floor(Math.random() * 8 + 8));
    }, 700);
    return () => clearInterval(iv);
  }, [instruments]);

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
      const result = await submitOrderToOms(fetchJson, payload, omsConfig);
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
    [addToast, fetchJson, omsConfig, prices],
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
    const catalogue = instruments.filter((i) => INSTRUMENTS.some((b) => b.symbol === i.symbol));
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
          account={ACCOUNT}
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
                <ChartPanel instrument={activeInstrument} prices={prices} />
              </div>
              <DepthOfMarket
                instrument={activeInstrument ? prices[activeInstrument.symbol] ?? activeInstrument : null}
              />
            </div>

            <BottomTabsPanel positions={positions} onClosePosition={handleClosePosition} />
          </div>

          <div className="right-sidebar">
            <OrderEntry instrument={activeInstrument} prices={prices} onTrade={(p) => void handleTrade(p)} />
            <AccountSummaryPanel />
          </div>
        </div>

        <StatusBarTrading ping={ping} account={ACCOUNT} mobileHref={mobileHref} />
        <ToastContainer toasts={toasts} />
      </div>
    </div>
  );
}
