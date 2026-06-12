/**
 * File:        apps/web/lib/prana-stream/types.ts
 * Module:      web/prana-stream
 * Purpose:     TypeScript types for the PranaStream realtime stream
 *
 * Exports:
 *   - Tick                         — single market price update
 *   - RealtimeEvent<T>             — envelope for all events (mirrors backend contracts)
 *   - SubscribePayload             — subscription request body
 *   - OrderBookFrame               — order book depth frame
 *   - OrderUpdatePayload           — order event payload
 *   - PositionUpdatePayload        — position event payload
 *   - AccountUpdatePayload         — account balance event payload
 *   - ConnectionStatus             — WS connection state
 *
 * Depends on:
 *   - none (pure types)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Mirrors apps/backend/src/modules/realtime/prana-stream/events/contracts.ts
 *   - Backend event names: 'watchlist.ticks', 'order.updated',
 *     'position.updated', 'account.updated', 'orderbook.depth', 'snapshot'
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

export type Tick = {
  exchange: string;
  symbol: string;
  price: number;
  ts: number;
};

export type RealtimeEvent<T> = {
  type:
    | 'watchlist.tick'
    | 'order.updated'
    | 'position.updated'
    | 'account.updated'
    | 'margin.breach';
  userId: string;
  requestId?: string;
  seq: number;
  ts: string;
  data: T;
  v: 1;
};

/**
 * Margin breach payload — emitted when account falls below required margin.
 * The client renders a blocking modal (critical/breach) or toast (warning).
 */
export type MarginBreachPayload = {
  accountId: string;
  requiredMargin: string;
  availableCash: string;
  shortfall: string;
  severity: 'warning' | 'critical' | 'breach';
  triggeredBy?: { kind: 'order' | 'position'; id: string };
  ts: string;
};

export type SubscribePayload = {
  watchlist?: Array<{ exchange: string; symbol: string }>;
  orders?: boolean;
  positions?: boolean;
  accounts?: boolean;
};

export type OrderBookFrame = {
  type: 'orderbook.depth';
  key: string;
  exchange: string;
  symbol: string;
  bids: Array<{ price: number; quantity: number; orders?: number }>;
  asks: Array<{ price: number; quantity: number; orders?: number }>;
  ts: number;
};

export type OrderUpdatePayload = {
  id: string;
  accountId: string;
  instrumentId: string;
  side: string;
  type: string;
  quantity: string;
  price?: string;
  status: string;
  filledQty?: string;
  remainingQty?: string;
  createdAt: string;
  updatedAt?: string;
};

export type PositionUpdatePayload = {
  accountId: string;
  instrumentId: string;
  netQty: string;
  averagePrice?: string;
  realizedPnl?: string;
  unrealizedPnl?: string;
};

export type AccountUpdatePayload = {
  accountId: string;
  totalCash: string;
  lockedCash: string;
  availableCash: string;
  currency?: string;
  ts?: string;
};

export type SnapshotPayload = {
  watchlist?: Tick[];
  orders?: OrderUpdatePayload[];
  positions?: PositionUpdatePayload[];
  accounts?: AccountUpdatePayload[];
};

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'backpressure-slow'
  | 'backpressure-critical'
  | 'error';

export type BackpressureEvent = {
  level: 0 | 1 | 2 | 3;
  pendingBytes: number;
  softLimit: number;
  hardLimit: number;
  reason: 'soft-limit-exceeded' | 'hard-limit-approaching' | 'hard-limit-exceeded';
  hint: 'client-should-slow-subscription-rate' | 'client-should-reconnect-with-snapshot';
};

export type PranaEventName =
  | 'watchlist.ticks'
  | 'order.updated'
  | 'position.updated'
  | 'account.updated'
  | 'orderbook.depth'
  | 'snapshot'
  | 'backpressure.slow'
  | 'backpressure.disconnect'
  | 'margin.breach';
