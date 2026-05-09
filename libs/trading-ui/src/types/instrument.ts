/**
 * File:        libs/trading-ui/src/types/instrument.ts
 * Module:      trading-ui · Types
 * Purpose:     Core domain types for instruments, positions, orders, and account state shared across all trading surfaces.
 *
 * Exports:
 *   - InstrumentCategory                — union of asset class strings
 *   - Instrument                        — live quote + metadata for a tradeable symbol
 *   - DomRow                            — single depth-of-market level
 *   - OpenPosition                      — live position with real-time P&L
 *   - PendingOrder                      — resting limit/stop order
 *   - TradeHistoryRow                   — closed trade record
 *   - AccountSnapshot                   — account-level balance/margin/equity snapshot
 *   - CalendarEvent                     — economic calendar entry
 *   - NewsItem                          — market news headline
 *   - ToastItem                         — transient trade-feedback notification
 *
 * Depends on:
 *   - none
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Instrument.instrumentId is set only when the row originates from OMS watchlist API; absent for mock catalogue rows
 *   - OpenPosition.pnl is updated client-side via tick simulation; authoritative P&L comes from the backend
 *
 * Read order:
 *   1. Instrument — start here (used by every panel)
 *   2. OpenPosition — core trading state
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
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
  /** Set when the row originates from `/market/watchlists/.../items` — required for OMS order submission. */
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
