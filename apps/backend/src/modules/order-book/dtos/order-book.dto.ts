/**
 * File:        apps/backend/src/modules/order-book/dtos/order-book.dto.ts
 * Module:      order-book
 * Purpose:     Canonical DTO shapes for the order-book module.
 *
 * Exports:
 *   - OrderBookLevel    — single price level in the book (price, qty, order count)
 *   - OrderBook         — full snapshot for an exchange:symbol pair
 *   - OrderBookFrame    — realtime WS frame emitted for orderbook updates
 *   - OrderBookDepthResponse — REST API response shape for depth endpoint
 *
 * Depends on:
 *   - none (pure types)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - prices stored as strings to preserve precision (decimal prices)
 *   - bids sorted descending, asks sorted ascending (caller's responsibility)
 *   - frame type is 'orderbook.depth' for WS routing
 *
 * Read order:
 *   1. OrderBookLevel   — understand the price-level shape
 *   2. OrderBookFrame    — understand the WS broadcast shape
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

export type OrderBookLevel = {
  /** Price level (decimal string for precision) */
  price: string;
  /** Total quantity at this price level */
  qty: string;
  /** Number of orders contributing to this level */
  orders: number;
};

export type OrderBook = {
  /** Exchange code, e.g. 'NSE' */
  exchange: string;
  /** Trading symbol, e.g. 'INFY' */
  symbol: string;
  /** Bid levels sorted descending by price */
  bids: OrderBookLevel[];
  /** Ask levels sorted ascending by price */
  asks: OrderBookLevel[];
  /** Unix timestamp ms when book was last updated */
  ts: number;
};

export type OrderBookFrame = {
  type: 'orderbook.depth';
  /** 'EXCHANGE:SYMBOL' key */
  key: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  /** bid-ask spread in absolute price units */
  spread: number;
  /** (bestBid + bestAsk) / 2 */
  midPrice: number;
  ts: number;
  v: 1;
};

export type OrderBookDepthResponse = {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadBps: number;
  midPrice: number;
  ts: number;
};