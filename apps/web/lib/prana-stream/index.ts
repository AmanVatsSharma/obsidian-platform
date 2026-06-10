/**
 * File:        apps/web/lib/prana-stream/index.ts
 * Module:      web/prana-stream
 * Purpose:     Public barrel for the prana-stream React layer.
 *
 * Exports:
 *   - PranaProvider, usePranaStream
 *   - useWatchlistTicks, useOrderUpdates, usePositionUpdates, useAccountUpdates, useOrderBookDepth
 *   - PranaStreamClient, getPranaClient
 *   - All types from ./types
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

export { PranaProvider, usePranaStream } from './prana-provider';
export { PranaStreamClient, getPranaClient } from './socket-client';
export { useWatchlistTicks } from './hooks/use-watchlist-ticks';
export { useOrderUpdates } from './hooks/use-order-updates';
export { usePositionUpdates } from './hooks/use-position-updates';
export { useAccountUpdates } from './hooks/use-account-updates';
export { useOrderBookDepth } from './hooks/use-orderbook-depth';
export { useBackpressure } from './hooks/use-backpressure';
export { decodeJwtClaims } from './jwt-decode';
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
} from './types';
export type { JwtClaims as JwtClaimsType } from './jwt-decode';
export type { BackpressureState } from './hooks/use-backpressure';