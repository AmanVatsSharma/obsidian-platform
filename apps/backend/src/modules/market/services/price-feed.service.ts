/**
 * @file src/modules/market/services/price-feed.service.ts
 * @module market
 * @description Batching price feed to external aggregator (1 req/sec, 1000 symbols per call)
 * @author BharatERP
 * @created 2025-09-19
 */

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AppLoggerService } from '../../../shared/logger';
import { Observable, Subject } from 'rxjs';

type Quote = {
  symbol: string;
  exchange: string;
  price: number;
  ts: number;
};

@Injectable()
export class PriceFeedService implements OnModuleInit, OnModuleDestroy {
  private readonly subscribers: Map<string, Set<string>> = new Map(); // key: "exchange:symbol" -> set of subscriber ids
  private readonly latestQuotes: Map<string, Quote> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private readonly quotesSubject: Subject<Quote[]> = new Subject<Quote[]>();

  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext(PriceFeedService.name);
  }

  onModuleInit(): void {
    this.logger.debug('Starting price feed polling loop');
    this.timer = setInterval(
      () =>
        this.pollOnce().catch((e) =>
          this.logger.error('pollOnce failed', (e as Error).stack),
        ),
      1000,
    );
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  subscribe(
    subscriberId: string,
    instruments: Array<{ exchange: string; symbol: string }>,
  ): void {
    this.logger.debug('subscribe', { subscriberId, count: instruments.length });
    for (const { exchange, symbol } of instruments) {
      const key = `${exchange}:${symbol}`;
      if (!this.subscribers.has(key)) this.subscribers.set(key, new Set());
      this.subscribers.get(key)!.add(subscriberId);
    }
  }

  unsubscribe(
    subscriberId: string,
    instruments?: Array<{ exchange: string; symbol: string }>,
  ): void {
    this.logger.debug('unsubscribe', {
      subscriberId,
      count: instruments?.length ?? 'all',
    });
    if (!instruments) {
      for (const set of this.subscribers.values()) set.delete(subscriberId);
      return;
    }
    for (const { exchange, symbol } of instruments) {
      const key = `${exchange}:${symbol}`;
      const set = this.subscribers.get(key);
      if (set) set.delete(subscriberId);
    }
  }

  getSnapshot(symbols: Array<{ exchange: string; symbol: string }>): Quote[] {
    return symbols
      .map(({ exchange, symbol }) =>
        this.latestQuotes.get(`${exchange}:${symbol}`),
      )
      .filter((q): q is Quote => !!q);
  }

  onQuotes$(): Observable<Quote[]> {
    return this.quotesSubject.asObservable();
  }

  private async pollOnce(): Promise<void> {
    // Deduplicate up to 1000 symbols per request; more than 1000 -> batch across seconds naturally
    const allKeys = Array.from(this.subscribers.keys());
    if (allKeys.length === 0) return;
    const keysToFetch = allKeys.slice(0, 1000);
    const payload = keysToFetch.map((k) => {
      const [exchange, symbol] = k.split(':');
      return { exchange, symbol };
    });

    this.logger.debug('Polling aggregator', { count: payload.length });
    const url = process.env.MARKET_DATA_URL as string;
    if (!url) {
      this.logger.warn('MARKET_DATA_URL not configured; skipping poll');
      return;
    }
    try {
      const res = await fetch(`${url}/quotes:batch`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ symbols: payload }),
      });
      if (!res.ok) {
        this.logger.warn('Aggregator returned non-200', res.statusText);
        return;
      }
      const data = (await res.json()) as Quote[];
      const ts = Date.now();
      for (const q of data) {
        const key = `${q.exchange}:${q.symbol}`;
        this.latestQuotes.set(key, { ...q, ts });
      }
      if (data.length > 0) {
        this.quotesSubject.next(data);
      }
    } catch (e) {
      this.logger.error('Aggregator request failed', (e as Error).stack);
    }
  }
}
