/**
 * @file src/modules/realtime/prana-stream/adapters/composite-market-data.adapter.ts
 * @module realtime/prana-stream
 * @description Composite adapter: picks the primary provider by env (MARKET_DATA_PROVIDER),
 *              with main → vortex → kite as the default fallback chain. Mock is always
 *              wired for tests/dev. Setting MARKET_DATA_PROVIDER=kite makes Kite the
 *              primary, e.g. for Indian markets (NSE/BSE/MCX).
 * @author BharatERP
 * @created 2025-09-24
 * @last-updated 2026-06-10
 */

import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../../../shared/logger';
import { MarketDataProvider, Tick } from './market-data.provider';
import { MainMarketDataAdapter } from './main-market-data.adapter';
import { VortexMarketDataAdapter } from './vortex-market-data.adapter';
import { MockMarketDataAdapter } from './mock-market-data.adapter';
import { KiteMarketDataAdapter } from './kite-market-data.adapter';

@Injectable()
export class CompositeMarketDataAdapter implements MarketDataProvider {
  readonly name = 'composite';
  private current: MarketDataProvider;
  private cb?: (ticks: Tick[]) => void;

  constructor(
    private readonly logger: AppLoggerService,
    private readonly main: MainMarketDataAdapter,
    private readonly vortex: VortexMarketDataAdapter,
    private readonly mock: MockMarketDataAdapter,
    private readonly kite: KiteMarketDataAdapter,
  ) {
    this.logger.setContext(CompositeMarketDataAdapter.name);
    // Pick the configured primary; default to main if env is unset/unknown
    this.current = this.selectPrimary();
    this.logger.log('composite adapter initialised', { primary: this.current.name });
    this.main.onTicks((t) => this.forward(t, 'main'));
    this.vortex.onTicks((t) => this.forward(t, 'vortex'));
    this.mock.onTicks((t) => this.forward(t, 'mock'));
    this.kite.onTicks((t) => this.forward(t, 'kite'));
  }

  private selectPrimary(): MarketDataProvider {
    const preferred = (process.env.MARKET_DATA_PROVIDER ?? 'main').toLowerCase();
    switch (preferred) {
      case 'kite':
        return this.kite;
      case 'vortex':
        return this.vortex;
      case 'mock':
        return this.mock;
      case 'main':
      default:
        return this.main;
    }
  }

  private forward(ticks: Tick[], source: string) {
    if (this.cb) this.cb(ticks);
  }

  async connect(): Promise<void> {
    try {
      await this.current.connect();
      this.logger.debug(`connected to ${this.current.name} provider`);
    } catch (e) {
      this.logger.warn(`${this.current.name} connect failed; falling back to vortex`);
      await this.vortex.connect();
      this.current = this.vortex;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.current.disconnect();
    } catch (err) {
      this.logger.warn('CompositeMarketDataAdapter: upstream adapter error', {
        error: err instanceof Error ? err.message : String(err),
        adapter: this.current.name,
      });
      throw err;
    }
  }

  async subscribeTicks(
    subscriberId: string,
    symbols: Array<{ exchange: string; symbol: string }>,
  ): Promise<void> {
    if (!this.current.isHealthy()) await this.connect();
    await this.current.subscribeTicks(subscriberId, symbols);
    // Also feed mock in dev for demos
    if (process.env.NODE_ENV !== 'production') {
      await this.mock.subscribeTicks(subscriberId, symbols);
    }
  }

  async unsubscribeTicks(
    subscriberId: string,
    symbols?: Array<{ exchange: string; symbol: string }>,
  ): Promise<void> {
    await this.current.unsubscribeTicks(subscriberId, symbols);
    if (process.env.NODE_ENV !== 'production') {
      await this.mock.unsubscribeTicks(subscriberId, symbols);
    }
  }

  async getSnapshot(symbols: Array<{ exchange: string; symbol: string }>): Promise<Tick[]> {
    if (!this.current.isHealthy()) await this.connect();
    return this.current.getSnapshot(symbols);
  }

  onTicks(cb: (ticks: Tick[]) => void): void {
    this.cb = cb;
  }

  isHealthy(): boolean {
    return this.current.isHealthy();
  }
}


