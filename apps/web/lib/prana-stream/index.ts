/**
 * File:        apps/web/lib/prana-stream/index.ts
 * Module:      web/prana-stream
 * Purpose:     Public barrel for the prana-stream React layer.
 *
 * Exports:
 *   - PranaProvider, usePranaStream
 *   - useWatchlistTicks, useOrderUpdates, usePositionUpdates, useAccountUpdates, useOrderBookDepth
 *   - useMarginBreach — modal/toast on margin shortfall
 *   - useOpenOrders — filtered order stream slice
 *   - usePositionPnL — per-position unrealized PnL
 *   - usePortfolioEquity — derived account equity summary
 *   - useLatestTick, useLatestTicks — read shared watchlist-ticks store
 *     (no new subscription)
 *   - PranaStreamClient, getPranaClient
 *   - All types from ./types
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

export { PranaProvider, usePranaStream } from './prana-provider';
export { PranaStreamClient, getPranaClient } from './socket-client';
export { useWatchlistTicks } from './hooks/use-watchlist-ticks';
export { useOrderUpdates } from './hooks/use-order-updates';
export { usePositionUpdates } from './hooks/use-position-updates';
export { useAccountUpdates } from './hooks/use-account-updates';
export { useOrderBookDepth } from './hooks/use-orderbook-depth';
export { useBackpressure } from './hooks/use-backpressure';
export { useSymbolSearch } from './hooks/use-symbol-search';
export { useMarginBreach } from './hooks/use-margin-breach';
export { useOpenOrders } from './hooks/use-open-orders';
export { usePositionPnL } from './hooks/use-position-pnl';
export { usePortfolioEquity } from './hooks/use-portfolio-equity';
export { decodeJwtClaims } from './jwt-decode';
export {
  watchlistTicksStore,
  pushWatchlistTicks,
  useLatestTick,
  useLatestTicks,
} from './stores/watchlist-ticks-store';
export { useLatestTickPrice, useTickChange } from './stores/tick-listener-store';
export type {
  Tick,
  RealtimeEvent,
  SubscribePayload,
  OrderBookFrame,
  OrderUpdatePayload,
  PositionUpdatePayload,
  AccountUpdatePayload,
  SnapshotPayload,
  ConnectionStatus,
  PranaEventName,
  BackpressureEvent,
  JwtClaims,
  MarginBreachPayload,
} from './types';
export type { JwtClaims as JwtClaimsType } from './jwt-decode';
export type { BackpressureState } from './hooks/use-backpressure';
export type {
  SymbolSearchResult,
  SymbolSearchOptions,
} from './hooks/use-symbol-search';
export type { MarginBreachState } from './hooks/use-margin-breach';
export type { OpenOrderFilter } from './hooks/use-open-orders';
export type { PositionPnL } from './hooks/use-position-pnl';
export type { PortfolioEquitySummary } from './hooks/use-portfolio-equity';
