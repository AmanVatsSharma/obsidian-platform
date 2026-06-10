/**
 * File:        apps/backend/src/modules/realtime/prana-stream/adapters/kite-market-data.adapter.ts
 * Module:      realtime/prana-stream · Market Data Adapters
 * Purpose:     Kite Connect adapter for PranaStream WebSocket.
 *              Routes live ticks from Kite through PranaStream to traders.
 *
 * Exports:
 *   - KiteMarketDataAdapter — implements MarketDataProvider
 *
 * Depends on:
 *   - KiteWebSocketService — primary live data feed (push-based)
 *   - InstrumentEntity     — providerToken lookup (numeric Kite token)
 *
 * Side-effects:
 *   - Subscribes to Kite WebSocket for instrument tokens
 *   - Forwards live ticks to PranaStream RealtimeAggregatorService
 *
 * Key invariants:
 *   - Implements MarketDataProvider interface
 *   - Maps (exchange, symbol) → numeric Kite providerToken via InstrumentEntity
 *   - One healthy provider per composite chain (picked by CompositeMarketDataAdapter)
 *
 * Read order:
 *   1. connect()      — readiness check against KiteWebSocketService
 *   2. subscribeTicks  — token resolution + WS subscribe
 *   3. onTicks        — Kite tick stream → Tick[]
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppLoggerService } from '../../../../shared/logger';
import { MarketDataProvider, Tick } from './market-data.provider';
import { KiteWebSocketService } from '../../../market/providers/kite/kite-websocket.service';
import { InstrumentEntity } from '../../../market/entities/instrument.entity';

@Injectable()
export class KiteMarketDataAdapter implements MarketDataProvider, OnModuleDestroy {
  readonly name = 'kite';
  private healthy = false;
  private readonly destroy$ = new Subject<void>();
  private readonly subscriptions: Map<string, Array<{ exchange: string; symbol: string }>> = new Map();

  constructor(
    private readonly logger: AppLoggerService,
    private readonly kiteWs: KiteWebSocketService,
    @InjectRepository(InstrumentEntity)
    private readonly instruments: Repository<InstrumentEntity>,
  ) {
    this.logger.setContext(KiteMarketDataAdapter.name);
  }

  async connect(): Promise<void> {
    this.logger.log('connecting to Kite data feed');
    try {
      const status = this.kiteWs.getStatus();
      if (status.connected) {
        this.healthy = true;
        this.logger.log('Kite MarketDataAdapter connected');
      } else {
        this.logger.warn('Kite WebSocket not connected - will retry on first subscribe');
        this.healthy = false;
      }
    } catch (e) {
      this.logger.error('failed to connect to Kite', (e as Error).message);
      this.healthy = false;
    }
  }

  async disconnect(): Promise<void> {
    this.logger.log('disconnecting Kite data feed');
    this.healthy = false;
  }

  onModuleDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async subscribeTicks(
    subscriberId: string,
    symbols: Array<{ exchange: string; symbol: string }>,
  ): Promise<void> {
    this.logger.debug('subscribeTicks', { subscriberId, count: symbols.length });

    // Track the subscription so we can resolve on unsubscribe
    this.subscriptions.set(subscriberId, symbols);

    if (symbols.length === 0) return;

    // Resolve (exchange, symbol) → numeric Kite providerToken via the instruments table
    const tokens = await this.resolveTokens(symbols);

    if (tokens.length === 0) {
      this.logger.warn(
        'no Kite providerTokens found for requested symbols — instruments must be synced first',
        { count: symbols.length },
      );
      return;
    }

    try {
      await this.kiteWs.subscribe(tokens);
      this.healthy = this.kiteWs.getStatus().connected || this.healthy;
    } catch (e) {
      this.logger.error('subscribe failed', (e as Error).message);
    }
  }

  async unsubscribeTicks(
    subscriberId: string,
    symbols?: Array<{ exchange: string; symbol: string }>,
  ): Promise<void> {
    this.logger.debug('unsubscribeTicks', { subscriberId, count: symbols?.length ?? 'all' });

    if (!symbols) {
      // Drop the subscriber record; keep WS subscriptions intact so other watchers still receive ticks
      this.subscriptions.delete(subscriberId);
      return;
    }

    // For partial unsubscribe, resolve tokens and ask KiteWs to unsubscribe
    const tokens = await this.resolveTokens(symbols);
    if (tokens.length > 0) {
      this.kiteWs.unsubscribe(tokens);
    }
  }

  /**
   * Resolve (exchange, symbol) pairs to numeric Kite providerTokens via the instruments table.
   * Symbols with no providerToken (e.g. not yet synced from Kite) are silently skipped.
   */
  private async resolveTokens(
    symbols: Array<{ exchange: string; symbol: string }>,
  ): Promise<number[]> {
    if (symbols.length === 0) return [];
    const exchanges = Array.from(new Set(symbols.map((s) => s.exchange)));
    const symList = Array.from(new Set(symbols.map((s) => s.symbol)));

    const rows = await this.instruments.find({
      where: {
        providerCode: 'KITE',
        exchangeCode: In(exchanges),
        symbol: In(symList),
      },
    });

    return rows
      .map((r) => (r.providerToken ? parseInt(r.providerToken, 10) : NaN))
      .filter((t) => Number.isFinite(t) && t > 0);
  }

  async getSnapshot(
    symbols: Array<{ exchange: string; symbol: string }>,
  ): Promise<Tick[]> {
    const ticks: Tick[] = [];
    for (const sym of symbols) {
      const ltp = this.kiteWs.getLtp(sym.symbol, sym.exchange);
      if (ltp !== null) {
        ticks.push({
          exchange: sym.exchange,
          symbol: sym.symbol,
          price: ltp,
          ts: Date.now(),
        });
      }
    }
    return ticks;
  }

  onTicks(cb: (ticks: Tick[]) => void): void {
    // Wire Kite ticks through to PranaStream. Each KiteTick[] becomes a Tick[] batch.
    this.kiteWs
      .onTicks$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((kiteTicks) => {
        const ticks: Tick[] = kiteTicks.map((kt) => ({
          exchange: kt.exchange,
          symbol: kt.tradingsymbol,
          price: kt.lastPrice ?? 0,
          ts: kt.timestamp ?? Date.now(),
        }));
        if (ticks.length > 0) cb(ticks);
      });
  }

  isHealthy(): boolean {
    return this.healthy;
  }
}
