/**
 * File:        libs/trading-ui/src/index.ts
 * Module:      trading-ui · Public API
 * Purpose:     Barrel re-export — single import surface for @obsidian/trading-ui consumers.
 *
 * Exports:
 *   - TradingWorkstation                  — full workstation shell (platform-agnostic)
 *   - WatchlistPanel                      — instrument watchlist panel
 *   - ChartPanel                          — lightweight-charts candlestick panel
 *   - DepthOfMarket                       — DOM bid/ask depth panel
 *   - OrderEntry                          — BUY/SELL ticket panel
 *   - AccountSummaryPanel                 — account stats + sparkline
 *   - BottomTabsPanel                     — positions/orders/history/calendar/news tabs
 *   - TradingTopBar                       — top header with pinned symbols ticker
 *   - StatusBarTrading                    — footer connection/server/latency strip
 *   - ToastContainer                      — trade-feedback toast overlay
 *   - Instrument, OpenPosition, AccountSnapshot, ToastItem, ... — domain types
 *   - FetchJsonFn, OmsConfig, PlaceUiOrder — injection contract types
 *   - fmt, fmtPrice, pnlClass, pnlSign    — number/price formatting utils
 *   - INSTRUMENTS, OPEN_POSITIONS, ACCOUNT — mock data seeds
 *
 * Depends on:
 *   - none (this is the leaf boundary)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - All exports are platform-agnostic: no next/link, no useAuth, no process.env.NEXT_PUBLIC_*
 *   - Consumers tagged scope:web and scope:desktop can both import from this barrel
 *
 * Read order:
 *   1. This file — full surface overview
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

// Workstation orchestrator
export { TradingWorkstation } from './workstation/trading-workstation';

// Individual panels
export { WatchlistPanel } from './panels/watchlist-panel';
export { ChartPanel } from './panels/chart-panel';
export { DepthOfMarket } from './panels/depth-of-market';
export { OrderEntry } from './panels/order-entry';
export { AccountSummaryPanel } from './panels/account-summary-panel';
export { BottomTabsPanel } from './panels/bottom-tabs-panel';
export { TradingTopBar } from './panels/trading-top-bar';
export { StatusBarTrading } from './panels/status-bar-trading';
export { ToastContainer } from './panels/toast-container';

// Domain types
export type {
  InstrumentCategory,
  Instrument,
  DomRow,
  OpenPosition,
  PendingOrder,
  TradeHistoryRow,
  AccountSnapshot,
  CalendarEvent,
  NewsItem,
  ToastItem,
} from './types/instrument';

// API / injection contract types
export type { FetchJsonFn, OmsConfig, PlaceUiOrder } from './lib/workstation-api';

// Formatting utilities
export { fmt, fmtPrice, pnlClass, pnlSign } from './lib/format-utils';

// Mock data seeds (dev / demo / Storybook)
export { INSTRUMENTS, OPEN_POSITIONS, ACCOUNT, P_AND_L_HISTORY } from './lib/mock-data';
