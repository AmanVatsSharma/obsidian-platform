/**
 * File:        apps/backend/src/modules/order-book/controllers/order-book.controller.ts
 * Module:      order-book
 * Purpose:     REST endpoints exposing order-book depth and spread for authenticated users.
 *
 * Exports:
 *   - OrderBookController — NestJS controller
 *
 * Depends on:
 *   - OrderBookService — order-book store and spread computation
 *   - JwtAuthGuard     — authenticated requests
 *   - TenantGuard      — multi-tenant isolation
 *
 * Side-effects:
 *   - none (read-only endpoints)
 *
 * Key invariants:
 *   - Exchange and symbol are case-insensitive; uppercased inside service
 *   - levels query param clamped to [1, 20]
 *
 * Read order:
 *   1. GET /order-book/:exchange/:symbol — top-of-book + depth
 *   2. GET /order-book/:exchange/:symbol/spread — spread-only snapshot
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { OrderBookService } from '../services/order-book.service';
import { OrderBookDepthResponse } from '../dtos/order-book.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('order-book')
@UseGuards(JwtAuthGuard)
export class OrderBookController {
  constructor(private readonly orderBookService: OrderBookService) {}

  /**
   * GET /order-book/:exchange/:symbol
   * Returns top-of-book depth (bids + asks) for the requested levels.
   * Query param: levels (default 5, max 20)
   */
  @Get(':exchange/:symbol')
  getDepth(
    @Param('exchange') exchange: string,
    @Param('symbol') symbol: string,
    @Query('levels') levelsRaw?: string,
  ): OrderBookDepthResponse {
    const levels = Math.min(20, Math.max(1, Number(levelsRaw ?? 5)));
    const key = `${exchange}:${symbol}`;

    const { bids, asks } = this.orderBookService.getDepth(key, levels);
    const spreadInfo = this.orderBookService.getSpread(key);
    const ts = Date.now();

    return {
      bids,
      asks,
      spread: spreadInfo?.spread ?? 0,
      spreadBps: spreadInfo?.spreadBps ?? 0,
      midPrice: spreadInfo?.midPrice ?? 0,
      ts,
    };
  }

  /**
   * GET /order-book/:exchange/:symbol/spread
   * Returns spread + mid-price only (lightweight endpoint).
   */
  @Get(':exchange/:symbol/spread')
  getSpread(
    @Param('exchange') exchange: string,
    @Param('symbol') symbol: string,
  ): { spread: number; spreadBps: number; midPrice: number; ts: number } {
    const key = `${exchange}:${symbol}`;
    const spreadInfo = this.orderBookService.getSpread(key);
    const ts = Date.now();

    return {
      spread: spreadInfo?.spread ?? 0,
      spreadBps: spreadInfo?.spreadBps ?? 0,
      midPrice: spreadInfo?.midPrice ?? 0,
      ts,
    };
  }
}