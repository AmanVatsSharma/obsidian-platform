/**
 * File:        apps/backend/src/modules/order-book/order-book.module.ts
 * Module:      order-book
 * Purpose:     NestJS module for order-book management.
 *              Exposes REST endpoints and integrates with realtime via RealtimeAggregatorService.
 *
 * Exports:
 *   - OrderBookService     — the order-book store
 *   - OrderBookController — REST API surface
 *
 * Depends on:
 *   - SharedModule         — AppLoggerService
 *   - MarketModule        — (reserved for future market-data integration)
 *   - RealtimeModule       — RealtimeAggregatorService for WS broadcast
 *   - JwtModule           — for JwtAuthGuard wiring
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - OrderBookService is scoped per request via standard DI
 *
 * Read order:
 *   1. @Module declaration — see the wiring
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Module } from '@nestjs/common';
import { OrderBookService } from './services/order-book.service';
import { OrderBookController } from './controllers/order-book.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  controllers: [OrderBookController],
  providers: [OrderBookService],
  exports: [OrderBookService],
})
export class OrderBookModule {}