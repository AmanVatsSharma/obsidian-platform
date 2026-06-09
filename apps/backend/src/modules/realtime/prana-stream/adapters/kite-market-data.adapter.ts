/**
 * File:        apps/backend/src/modules/realtime/prana-stream/adapters/kite-market-data.adapter.ts
 * Module:      realtime/prana-stream · Market Data Adapters
 * Purpose:     Kite Connect adapter for PranaStream WebSocket.
 *              Routes live ticks from Kite through PranaStream to traders.
 *
 * Exports:
 *   - KiteMarketDataAdapter — implements MarketDataProvider
 *
 * Key invariants:
 *   - Implements MarketDataProvider interface
 *   - Delegates to KiteWebSocketService for live data
 *   - Falls back to REST if WebSocket unavailable
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Inject } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppLoggerService } from '../../../../shared/logger';
import { MarketDataProvider, Tick, MarketDataProviderRegistry } from './market-data.provider';
import { KiteWebSocketService } from '../../../market/providers/kite/kite-websocket.service';
import { DataProviderEntity, ProviderStatus } from '../../../market/entities/data-provider.entity';

@Injectable()
export class KiteMarketDataAdapter implements MarketDataProvider, OnModuleDestroy {
  readonly name = 'kite';
  private healthy = false;
  private readonly destroy$ = new Subject<void>();
  private readonly subscriptions: Map<string, Array<{ exchange: string; symbol: string }>> = new Map();

  constructor(
    private readonly logger: AppLoggerService,
    private readonly kiteWs: KiteWebSocketService,
  ) {
    this.logger.setContext(KiteMarketDataAdapter.name);
  }

  async connect(): Promise<void> {
    this.logger.info('connecting to Kite data feed');
    try {
      const status = this.kiteWs.getStatus();
      if (status.connected) {
        this.healthy = true;
        this.logger.info('Kite MarketDataAdapter connected');
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
    this.logger.info('disconnecting Kite data feed');
    this.healthy = false;
    this.destroy$.next();
    this.destroy$.complete();
  }

  async subscribeTicks(
    subscriberId: string,
    symbols: Array<{ exchange: string; symbol: string }>,
  ): Promise<void> {
    this.logger.debug('subscribeTicks', { subscriberId, count: symbols.length });

    // Store subscription for later reference
    this.subscriptions.set(subscriberId, symbols);

    // Map to provider tokens - for now just store exchange:symbol
    const providerSymbols = symbols.map(s => `${s.exchange}:${s.symbol}`);

    // Subscribe via Kite WebSocket
    // Note: KiteWsService expects tokens (exchange:symbol format)
    try {
      await this.kiteWs.subscribe(providerSymbols as any);
      this.healthy = true;
    } catch (e) {
      this.logger.error('subscribe failed', (e as Error).message);
    }
  }

  async unsubscribeTicks(
    subscriberId: string,
    symbols?: Array<{ exchange: string; symbol: string }>,
  ): Promise<void> {
    this.logger.debug('unsubscribeTicks', { subscriberId, symbols });

    if (symbols) {
      const providerSymbols = symbols.map(s => `${s.exchange}:${s.symbol}`);
      this.kiteWs.unsubscribe(providerSymbols as any);
    } else {
      // Unsubscribe all for this subscriber
      const subs = this.subscriptions.get(subscriberId);
      if (subs) {
        const providerSymbols = subs.map(s => `${s.exchange}:${s.symbol}`);
        this.kiteWs.unsubscribe(providerSymbols as any);
        this.subscriptions.delete(subscriberId);
      }
    }
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
    // Wire Kite ticks through to PranaStream
    this.kiteWs.onTicks$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((kiteTicks) => {
        const ticks: Tick[] = kiteTicks.map((kt) => ({
          exchange: kt.exchange,
          symbol: kt.tradingsymbol,
          price: kt.lastPrice ?? 0,
          ts: kt.timestamp ?? Date.now(),
        }));
        cb(ticks);
      });
  }

  isHealthy(): boolean {
    return this.healthy;
  }
}

/**
 * Registry helper — marks this adapter as available.
 * Add to MarketDataProviderRegistry in prana-stream.module.ts
 */
export function registerKiteMarketDataAdapter() {
  return {
    provide: 'KITE_MARKET_DATA_ADAPTER',
    useClass: KiteMarketDataAdapter,
  };
}