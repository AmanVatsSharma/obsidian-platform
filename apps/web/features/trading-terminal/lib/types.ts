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

/**
 * File:        lib/types.ts
 * Module:      web-trading · Order types & bracket config
 * Purpose:     Extended order type system with bracket, algo, position, and risk types
 *
 * Exports:
 *   - OrderTypeExtended     — all supported order types including algo/conditional
 *   - ORDER_TYPE_LABELS     — UI label map for order types
 *   - ORDER_TYPE_OPTIONS    — ordered list of order type options
 *   - TriggerCondition      — GTT trigger direction (ABOVE/BELOW)
 *   - BracketConfig         — TP/SL leg configuration for bracket orders
 *   - PlaceBracketOrderRequest — full payload for POST /api/orders/bracket
 *   - PendingOrder          — pending order with orderRole, parentOrderId, algoMeta
 *   - AlgoMeta              — TWAP/VWAP slice progress metadata
 *   - OrderRole             — 'PRIMARY' | 'TAKE_PROFIT' | 'STOP_LOSS'
 *   - StrategyPosition      — multi-leg strategy position with P&L
 *   - PositionLeg           — single leg of a strategy position
 *   - AccountRisk           — margin, buying power, per-instrument exposure
 *   - ExposurePerInstrument — instrument-level margin utilization
 *   - OrderChildNode        — child order from GetOrderChildren query
 *   - CancelBracketResult   — cancel bracket group result
 *   - OrderBookLevel        — single price level in the order book
 *   - OrderBookDepth        — full depth snapshot (bids + asks + spread)
 *   - TradePayload          — full payload from OrderEntry onTrade callback
 *
 * Depends on:
 *   - <none> — standalone type definitions
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - GTT requires triggerPrice + triggerCondition
 *   - Bracket requires at least takeProfitPrice OR stopLossPrice
 *   - TWAP/VWAP require slices (1–50) and durationMinutes (1–480)
 *   - PendingOrder.orderRole determines bracket child vs parent display
 *
 * Read order:
 *   1. OrderTypeExtended — maps UI type label → API enum value
 *   2. BracketConfig     — TP/SL leg shape
 *   3. PlaceBracketOrderRequest — full bracket submit payload
 *   4. OrderBookDepth    — DOM snapshot for depth-of-market display
 *   5. PendingOrder      — pending order with orderRole and algoMeta
 *   6. StrategyPosition  — multi-leg position with unrealizedPnl per leg
 *   7. AccountRisk       — margin level and per-instrument exposure
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

// ─── Order Types ───────────────────────────────────────────────────────────

export type OrderTypeExtended =
  | 'MARKET'
  | 'LIMIT'
  | 'STOP'
  | 'GTT'
  | 'TRAILING_STOP'
  | 'ICEBERG'
  | 'TWAP'
  | 'VWAP';

/** UI label → API type mapping */
export const ORDER_TYPE_LABELS: Record<OrderTypeExtended, string> = {
  MARKET: 'Market',
  LIMIT: 'Limit',
  STOP: 'Stop',
  GTT: 'GTT',
  TRAILING_STOP: 'Trailing',
  ICEBERG: 'Iceberg',
  TWAP: 'TWAP',
  VWAP: 'VWAP',
};

export const ORDER_TYPE_OPTIONS: OrderTypeExtended[] = [
  'MARKET',
  'LIMIT',
  'STOP',
  'GTT',
  'TRAILING_STOP',
  'ICEBERG',
  'TWAP',
  'VWAP',
];

// ─── Conditional / Algo ────────────────────────────────────────────────────

export type TriggerCondition = 'ABOVE' | 'BELOW';

// ─── Bracket ────────────────────────────────────────────────────────────────

export interface BracketConfig {
  takeProfitPrice: string;
  stopLossPrice: string;
  takeProfitQty?: string;
  stopLossQty?: string;
}

// ─── Bracket Order Submit ────────────────────────────────────────────────────

export interface PlaceBracketOrderRequest {
  accountId: string;
  instrumentId: string;
  side: 'BUY' | 'SELL';
  type: OrderTypeExtended;
  quantity: string;
  /** Required for LIMIT, STOP, GTT */
  price?: string;
  /** GTT trigger price */
  triggerPrice?: string;
  /** GTT trigger direction */
  triggerCondition?: TriggerCondition;
  /** Trailing stop distance (absolute) */
  trailingDistance?: string;
  /** Trailing stop percentage */
  trailingPct?: string;
  /** Iceberg display quantity */
  displayQty?: string;
  /** TWAP/VWAP slice count (1–50) */
  slices?: number;
  /** TWAP/VWAP total duration in minutes (1–480) */
  durationMinutes?: number;
  timeInForce?: 'DAY' | 'IOC' | 'GTC' | 'FOK';
  clientOrderId?: string;
  externalRefId?: string;
  bracket: BracketConfig;
}

// ─── Order Book ─────────────────────────────────────────────────────────────

export interface OrderBookLevel {
  price: number;
  size: number;
  /** Cumulative size up to and including this level */
  total: number;
}

export interface OrderBookDepth {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadPips: number;
  timestamp: string;
}

// ─── Pending Orders ──────────────────────────────────────────────────────────

export type OrderRole = 'PRIMARY' | 'TAKE_PROFIT' | 'STOP_LOSS';

export interface PendingOrder {
  id: string;
  symbol: string;
  type: OrderTypeExtended;
  orderRole?: OrderRole | null;
  parentOrderId?: string | null;
  side: 'BUY' | 'SELL';
  lots: number;
  price: number;
  distance: number;
  sl: number;
  tp: number;
  status: string;
  created: string;
  expiry?: string;
  algoMeta?: AlgoMeta;
}

export interface AlgoMeta {
  slices?: number;
  completedSlices?: number;
  durationMinutes?: number;
}

// ─── Strategy Positions ──────────────────────────────────────────────────────

export interface PositionLeg {
  id: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  openPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
}

export interface StrategyPosition {
  id: string;
  instrumentId: string;
  symbol: string;
  strategyType: string;
  netQuantity: number;
  unrealizedPnl: number;
  realizedPnl: number;
  legs: PositionLeg[];
}

// ─── Account Risk ────────────────────────────────────────────────────────────

export interface ExposurePerInstrument {
  instrumentId: string;
  symbol: string;
  netExposure: number;
  marginUtilization: number;
}

export interface AccountRisk {
  marginLevel: number;
  usedMargin: number;
  buyingPower: number;
  exposurePerInstrument: ExposurePerInstrument[];
}

// ─── Order Children ─────────────────────────────────────────────────────────

export interface OrderChildNode {
  id: string;
  type: string;
  orderRole: string;
  status: string;
  price: string;
  quantity: string;
  filledQty: string;
  remainingQty: string;
}

// ─── Bracket Cancel ──────────────────────────────────────────────────────────

export interface CancelBracketResult {
  id: string;
  status: string;
  childrenCancelled: number;
}

// ─── Extended UI Order Payload ──────────────────────────────────────────────

/** Full payload returned by OrderEntry's onTrade callback */
export interface TradePayload {
  side: 'buy' | 'sell';
  type: OrderTypeExtended;
  lots: string;
  price: string;
  sl: string;
  tp: string;
  instrument: Instrument | null;
  /** GTT */
  triggerPrice?: string;
  triggerCondition?: TriggerCondition;
  /** Trailing */
  trailingDistance?: string;
  trailingPct?: string;
  /** Iceberg */
  displayQty?: string;
  /** TWAP/VWAP */
  slices?: number;
  durationMinutes?: number;
}
