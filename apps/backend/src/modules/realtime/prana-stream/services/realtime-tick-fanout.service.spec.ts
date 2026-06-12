/**
 * @file src/modules/realtime/prana-stream/services/realtime-tick-fanout.service.spec.ts
 * @module realtime/prana-stream
 * @description Unit tests for the Redis pub/sub tick fan-out service.
 * @author BharatERP
 * @created 2026-06-10
 * @last-updated 2026-06-10
 */

import { RealtimeTickFanoutService } from './realtime-tick-fanout.service';
import { SubscriptionRegistryService } from './subscription-registry.service';
import { RedisService } from '../../../../shared/redis/redis.service';
import { AppLoggerService } from '../../../../shared/logger';
import type { Tick } from '../adapters/market-data.provider';

class FakeRedis {
  published: Array<{ channel: string; message: string }> = [];
  subscribed: Set<string> = new Set();
  listeners: Map<string, Array<(channel: string, message: string) => void>> = new Map();
  client: FakeRedis = this;
  subscriberClient: FakeRedis;

  constructor() {
    this.subscriberClient = this;
  }

  async publish(channel: string, message: string): Promise<number> {
    this.published.push({ channel, message });
    return this.subscribed.size;
  }

  async subscribe(...channels: string[]): Promise<number> {
    for (const c of channels) this.subscribed.add(c);
    return channels.length;
  }

  async unsubscribe(...channels: string[]): Promise<number> {
    for (const c of channels) this.subscribed.delete(c);
    return channels.length;
  }

  on(event: string, listener: (channel: string, message: string) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(listener);
  }

  // Test helper: simulate a cross-pod message
  __emitMessage(channel: string, message: string) {
    for (const fn of this.listeners.get('message') ?? []) fn(channel, message);
  }

  quit = jest.fn().mockResolvedValue(undefined);
}

class FakeAggregator {
  ingested: Tick[][] = [];
  ingestExternalTicks = (ticks: Tick[]) => {
    this.ingested.push(ticks);
  };
}

class FakeLogger {
  setContext() {}
  log() {}
  warn() {}
  error() {}
  debug() {}
  info() {}
}

describe('RealtimeTickFanoutService', () => {
  let fakeRedis: FakeRedis;
  let fakeSub: SubscriptionRegistryService;
  let fakeAgg: FakeAggregator;
  let service: RealtimeTickFanoutService;

  beforeEach(() => {
    fakeRedis = new FakeRedis();
    fakeSub = new SubscriptionRegistryService(new FakeLogger() as any);
    fakeAgg = new FakeAggregator();
    const redisSvc = {
      getClient: () => fakeRedis as any,
      getSubscriberClient: () => fakeRedis as any,
      publish: (channel: string, message: string) => fakeRedis.publish(channel, message),
    } as unknown as RedisService;
    service = new RealtimeTickFanoutService(
      new FakeLogger() as any,
      redisSvc,
      fakeSub,
      fakeAgg as any,
    );
  });

  it('publishTick emits to a stable channel key', async () => {
    await service.publishTick({ exchange: 'NSE', symbol: 'INFY', price: 1500, ts: 1 });
    expect(fakeRedis.published).toHaveLength(1);
    expect(fakeRedis.published[0].channel).toBe('prana:tick:NSE:INFY');
    expect(JSON.parse(fakeRedis.published[0].message)).toEqual([
      { exchange: 'NSE', symbol: 'INFY', price: 1500, ts: 1 },
    ]);
  });

  it('publishTick normalizes exchange + symbol to upper case', async () => {
    await service.publishTick({ exchange: 'nse', symbol: 'infy', price: 1, ts: 1 });
    expect(fakeRedis.published[0].channel).toBe('prana:tick:NSE:INFY');
  });

  it('publishTick is a no-op when Redis is not configured', async () => {
    const noRedis = {
      getClient: () => undefined,
      getSubscriberClient: () => undefined,
    } as unknown as RedisService;
    const svc = new RealtimeTickFanoutService(
      new FakeLogger() as any,
      noRedis,
      fakeSub,
      fakeAgg as any,
    );
    await svc.publishTick({ exchange: 'NSE', symbol: 'X', price: 1, ts: 1 });
    expect(fakeRedis.published).toHaveLength(0);
  });

  it('onSubscriptionsChanged triggers a resubscribe to active channels', async () => {
    jest.useFakeTimers();
    // Stage 1: no watchers → no subscribe
    await fakeSub.apply('c1', 'u1', { watchlist: [{ exchange: 'NSE', symbol: 'INFY' }] });
    service.onSubscriptionsChanged();
    // Resubscribe is debounced 100ms
    await Promise.resolve();
    jest.advanceTimersByTime(110);
    // Allow microtask queue
    await Promise.resolve();
    await Promise.resolve();
    expect(fakeRedis.subscribed.has('prana:tick:NSE:INFY')).toBe(true);
    jest.useRealTimers();
  });

  it('messages received from Redis are handed to the aggregator', async () => {
    await fakeSub.apply('c1', 'u1', { watchlist: [{ exchange: 'NSE', symbol: 'INFY' }] });
    // Trigger reconcile synchronously (skip the debounce timer)
    await (service as any).subscribeToAllActiveChannels();
    expect(fakeRedis.subscribed.has('prana:tick:NSE:INFY')).toBe(true);
    expect((service as any).messageHandlerWired).toBe(true);

    const ticks: Tick[] = [
      { exchange: 'NSE', symbol: 'INFY', price: 1700, ts: 12345 },
    ];
    fakeRedis.__emitMessage('prana:tick:NSE:INFY', JSON.stringify(ticks));
    expect(fakeAgg.ingested).toEqual([ticks]);
  });
});
