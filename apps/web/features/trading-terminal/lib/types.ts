/**
 * @file types.ts
 * @module web-trading
 * @description Shared types for the trader workstation (instruments, DOM, orders).
 * @author BharatERP
 * @created 2026-04-03
 */

export type InstrumentCategory = 'forex' | 'crypto' | 'indices' | 'commodities';

export type Instrument = {
  symbol: string;
  name: string;
  bid: number;
  ask: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  spread: number;
  pip: number;
  category: InstrumentCategory;
  digits: number;
  /** When set (e.g. from `/market/watchlists/.../items`) orders can be sent to OMS. */
  instrumentId?: string;
};

export type DomRow = {
  price: number;
  volume: number;
  type: 'bid' | 'ask';
  depth: number;
};

export type OpenPosition = {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  lots: number;
  openPrice: number;
  currentPrice: number;
  sl: number | string;
  tp: number | string;
  pnl: number;
  pnlPct: number;
  swap: number;
  commission: number;
  openTime: string;
  margin: number;
};

export type PendingOrder = {
  id: string;
  symbol: string;
  type: string;
  lots: number;
  price: number;
  distance: number;
  sl: number;
  tp: number;
  created: string;
  expiry: string;
};

export type TradeHistoryRow = {
  id: string;
  symbol: string;
  type: string;
  lots: number;
  openPrice: number;
  closePrice: number;
  pnl: number;
  openTime: string;
  closeTime: string;
  duration: string;
};

export type AccountSnapshot = {
  name: string;
  accountId: string;
  accountType: string;
  broker: string;
  currency: string;
  leverage: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  unrealizedPnl: number;
  realizedPnlToday: number;
  drawdownPct: number;
  server: string;
  ping: number;
};

export type CalendarEvent = {
  id: string;
  time: string;
  country: string;
  flag: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  forecast: string | null;
  previous: string | null;
  actual: string | null;
};

export type NewsItem = {
  id: string;
  time: string;
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  symbol: string;
  headline: string;
  category: string;
};

export type ToastItem = {
  id: number;
  text: string;
  sub?: string;
  type: 'bull' | 'bear';
};
