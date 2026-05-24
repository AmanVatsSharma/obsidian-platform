/**
 * File:        apps/backend/src/modules/order-book/services/order-book.service.ts
 * Module:      order-book
 * Purpose:     In-memory order-book store for all exchange:symbol pairs.
 *              Computes spread, mid-price, and top-N depth.
 *              Broadcasts updates to realtime subscribers via RealtimeAggregatorService.
 *
 * Exports:
 *   - OrderBookService — injectable service
 *   - updateBook()    — ingest a new bid/ask stack for one instrument
 *   - getBook()       — retrieve full book snapshot by key
 *   - getDepth()      — retrieve top-N levels for one instrument
 *   - getSpread()     — compute spread + mid price for one instrument
 *
 * Depends on:
 *   - AppLoggerService     — structured logging with requestId
 *   - RealtimeAggregatorService — outbound WS broadcast
 *
 * Side-effects:
 *   - In-memory Map storage (Redis-backed swap-in planned)
 *   - Calls RealtimeAggregatorService.publishOrderBook on every update
 *
 * Key invariants:
 *   - Key format is always 'EXCHANGE:SYMBOL' (uppercase)
 *   - Bids must be sorted descending, asks ascending before calling updateBook
 *   - Empty book returns null from getSpread / getBook
 *
 * Read order:
 *   1. updateBook() — core ingest + broadcast path
 *   2. getDepth()  — read path
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../../shared/logger';
import { RealtimeAggregatorService } from '../../realtime/prana-stream/services/realtime-aggregator.service';
import { OrderBook, OrderBookFrame, OrderBookLevel, OrderBookDepthResponse } from '../dtos/order-book.dto';

@Injectable()
export class OrderBookService {
  /** Key = '${exchange}:${symbol}' (uppercase) */
  private readonly books: Map<string, OrderBook> = new Map();

  constructor(
    private readonly logger: AppLoggerService,
    private readonly realtimeAggregator: RealtimeAggregatorService,
  ) {
    this.logger.setContext(OrderBookService.name);
  }

  /**
   * Ingest a new bid/ask stack for an instrument.
   * Expects bids sorted descending, asks sorted ascending.
   * Computes ts = Date.now(), stores the book, and broadcasts via WS.
   */
  updateBook(exchange: string, symbol: string, bids: OrderBookLevel[], asks: OrderBookLevel[]): void {
    const key = `${exchange}:${symbol}`.toUpperCase();
    const ts = Date.now();

    const book: OrderBook = { exchange: exchange.toUpperCase(), symbol: symbol.toUpperCase(), bids, asks, ts };
    this.books.set(key, book);

    const bestBid = bids[0]?.price ?? '0';
    const bestAsk = asks[0]?.price ?? '0';
    const spread = Number(bestAsk) - Number(bestBid);
    const midPrice = (Number(bestBid) + Number(bestAsk)) / 2;

    const frame: OrderBookFrame = {
      type: 'orderbook.depth',
      key,
      bids,
      asks,
      spread,
      midPrice,
      ts,
      v: 1,
    };

    this.realtimeAggregator.publishOrderBook(key, frame);
    this.logger.debug('orderBook updated', { key, bidLevels: bids.length, askLevels: asks.length, spread });
  }

  /** Return the full book snapshot, or null if not yet cached. */
  getBook(key: string): OrderBook | null {
    return this.books.get(key.toUpperCase()) ?? null;
  }

  /**
   * Return top-N bid and ask levels for an instrument.
   * Defaults to 5 levels; caller clamps to max 20.
   */
  getDepth(key: string, levels = 5): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } {
    const book = this.books.get(key.toUpperCase());
    if (!book) return { bids: [], asks: [] };
    return {
      bids: book.bids.slice(0, levels),
      asks: book.asks.slice(0, levels),
    };
  }

  /**
   * Compute spread, spread in bps, and mid-price for an instrument.
   * Returns null when the book is empty (no bids or no asks).
   */
  getSpread(key: string): { spread: number; spreadBps: number; midPrice: number } | null {
    const book = this.books.get(key.toUpperCase());
    if (!book || book.bids.length === 0 || book.asks.length === 0) return null;

    const bestBid = Number(book.bids[0].price);
    const bestAsk = Number(book.asks[0].price);
    const spread = bestAsk - bestBid;
    const midPrice = (bestBid + bestAsk) / 2;
    const spreadBps = midPrice > 0 ? (spread / midPrice) * 10_000 : 0;

    return { spread, spreadBps, midPrice };
  }
}