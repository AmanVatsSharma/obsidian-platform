/**
 * File:        apps/dealer-workstation/src/lib/mock-data-context.tsx
 * Module:      dealer-workstation · Data Context
 * Purpose:     React context and provider for all dealer terminal state — instruments, orders,
 *              alerts, toasts, and simulated real-time updates (price ticks every 500ms).
 *
 * Exports:
 *   - MockDealerDataProvider — wraps the terminal; drives simulated live data
 *   - useDeskData()          — hook to access DeskState from any child component
 *
 * Key invariants:
 *   - useInterval uses a ref for the callback to avoid stale closures; the interval itself is stable
 *   - Price ticks apply tiny random Brownian-motion moves (±0.0002 for FX, scaled per instrument)
 *   - All order mutations (accept/reject/requote) prepend to executions[] and add a toast
 *   - processedOrders is capped at 5 entries to keep the recent strip compact
 *
 * Side-effects:
 *   - setInterval(500ms) for price simulation while mounted
 *   - No network calls — pure in-memory demo data
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';

import {
  BOOK_POSITIONS, CHAT_MESSAGES, CLIENTS, ECONOMIC_EVENTS, EXECUTIONS,
  INSTRUMENTS, LP_PROVIDERS, NEWS_ITEMS, PENDING_ORDERS, SURVEILLANCE_ALERTS,
  WATCHLIST_CLIENT_IDS,
} from './mock-data';
import type { DeskState, Execution, Instrument, ProcessedOrder, SurveillanceAlert, Toast } from './types';

const DeskContext = createContext<DeskState | null>(null);

export function useDeskData(): DeskState {
  const ctx = useContext(DeskContext);
  if (!ctx) throw new Error('useDeskData must be used within MockDealerDataProvider');
  return ctx;
}

function useInterval(callback: () => void, delay: number) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

let toastCounter = 0;
function mkToastId() { return `toast-${++toastCounter}`; }

function tickPrice(inst: Instrument): Instrument {
  // Brownian motion scaled per instrument volatility
  const scale = inst.symbol === 'BTC/USD' ? 12 : inst.symbol === 'XAU/USD' ? 0.4 : inst.symbol === 'US500' ? 0.3 : 0.00008;
  const move = (Math.random() - 0.49) * scale;
  const spread = inst.ask - inst.bid;
  const newBid = Math.max(inst.low * 0.998, Math.min(inst.high * 1.002, inst.bid + move));
  const newAsk = newBid + spread;
  return { ...inst, bid: newBid, ask: newAsk };
}

export function MockDealerDataProvider({ children }: { children: React.ReactNode }) {
  const [instruments, setInstruments] = useState(INSTRUMENTS);
  const [pendingOrders, setPendingOrders] = useState(PENDING_ORDERS);
  const [executions, setExecutions] = useState(EXECUTIONS);
  const [surveillanceAlerts, setAlerts] = useState(SURVEILLANCE_ALERTS);
  const [chatMessages, setChatMessages] = useState(CHAT_MESSAGES);
  const [processedOrders, setProcessedOrders] = useState<ProcessedOrder[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [autoAccept, setAutoAccept] = useState(false);
  const [spreadMultiplier, setSpreadMultiplier] = useState(1);
  const [haltTrading, setHaltTrading] = useState(false);
  const [focusedOrderIdx, setFocusedOrderIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('book');
  const [orderAges, setOrderAges] = useState<Record<string, number>>(
    () => Object.fromEntries(PENDING_ORDERS.map(o => [o.id, o.age]))
  );

  // Simulated real-time price ticks
  useInterval(useCallback(() => {
    setInstruments(prev => prev.map(tickPrice));
  }, []), 500);

  // Live order age counter — ticks every second
  useInterval(useCallback(() => {
    setOrderAges(prev => {
      const next: Record<string, number> = {};
      for (const k in prev) next[k] = (prev[k] ?? 0) + 1;
      return next;
    });
  }, []), 1000);

  // Add toast
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = mkToastId();
    setToasts(prev => [{ ...toast, id }, ...prev.slice(0, 3)]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
  }, []);

  const acceptOrder = useCallback((id: string) => {
    setPendingOrders(prev => {
      const order = prev.find(o => o.id === id);
      if (!order) return prev;
      const exec: Execution = {
        id: `EX-${Date.now()}`, time: new Date().toLocaleTimeString('en-GB', { hour12: false }) + '.000',
        clientId: order.clientId, clientType: order.tier, symbol: order.symbol,
        side: order.side, lots: order.lots, fillPrice: order.clientPrice,
        marketPrice: order.marketPrice, slippage: order.slippage, pnlImpact: Math.round(order.slippage * order.lots * 1000),
        latency: 14, route: 'MANUAL', lp: 'LP1', dealer: 'M.Chen',
      };
      setExecutions(ex => [exec, ...ex]);
      setProcessedOrders(p => [{ id: order.id, clientName: order.clientName, symbol: order.symbol, side: order.side, lots: order.lots, action: 'ACCEPT' as const }, ...p].slice(0, 5));
      setOrderAges(prev => { const next = { ...prev }; delete next[id]; return next; });
      addToast({ type: 'accept', icon: '✓', title: 'Order Accepted', msg: `${order.side} ${order.lots} ${order.symbol} — ${order.clientName}` });
      return prev.filter(o => o.id !== id);
    });
  }, [addToast]);

  const rejectOrder = useCallback((id: string) => {
    setPendingOrders(prev => {
      const order = prev.find(o => o.id === id);
      if (!order) return prev;
      setProcessedOrders(p => [{ id: order.id, clientName: order.clientName, symbol: order.symbol, side: order.side, lots: order.lots, action: 'REJECT' as const }, ...p].slice(0, 5));
      setOrderAges(prev => { const next = { ...prev }; delete next[id]; return next; });
      addToast({ type: 'reject', icon: '✗', title: 'Order Rejected', msg: `${order.side} ${order.lots} ${order.symbol} — ${order.clientName}` });
      return prev.filter(o => o.id !== id);
    });
  }, [addToast]);

  const requoteOrder = useCallback((id: string, newPrice: number) => {
    setPendingOrders(prev => prev.map(o => o.id === id ? { ...o, clientPrice: newPrice } : o));
    addToast({ type: 'warn', icon: '↻', title: 'Requote Sent', msg: `New price: ${newPrice}` });
  }, [addToast]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map((a: SurveillanceAlert) => a.id === id ? { ...a, status: 'DISMISSED' as const } : a));
  }, []);

  const flagAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map((a: SurveillanceAlert) => a.id === id ? { ...a, status: 'FLAGGED' as const } : a));
  }, []);

  const sendChatMessage = useCallback((channel: string, text: string) => {
    if (!text.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now(), channel, author: 'You', avatar: 'YO',
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      text,
    }]);
  }, []);

  const value: DeskState = {
    instruments, bookPositions: BOOK_POSITIONS, pendingOrders, clients: CLIENTS,
    executions, surveillanceAlerts, lpProviders: LP_PROVIDERS,
    economicEvents: ECONOMIC_EVENTS, newsItems: NEWS_ITEMS, chatMessages,
    processedOrders, toasts, autoAccept, spreadMultiplier, haltTrading,
    focusedOrderIdx, activeTab, orderAges,
    acceptOrder, rejectOrder, requoteOrder, dismissAlert, flagAlert,
    addToast, dismissToast,
    setAutoAccept, setSpreadMultiplier, setHaltTrading,
    setFocusedOrderIdx, setActiveTab, sendChatMessage,
  };

  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}
