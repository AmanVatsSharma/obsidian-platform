/**
 * File:        apps/backend/src/modules/realtime/prana-stream/services/realtime-tick-fanout.service.ts
 * Module:      realtime/prana-stream · Services
 * Purpose:     Redis pub/sub fan-out for market ticks across pods.
 *              When any pod receives a tick from Kite, it publishes to
 *              a Redis channel. All pods subscribe and re-emit to their
 *              local Socket.IO rooms. This solves the multi-session-per-user
 *              problem (Web + Mobile on different pods get the tick),
 *              and prepares the system for > 1K concurrent users.
 *
 *              Channel architecture:
 *                prana:tick:${exchange}:${symbol}  → live tick batch
 *              Payloads are JSON-serialized Tick[].
 *
 *              Local pod's only responsibility:
 *                - Subscribe to channels for symbols the local pod has watchers for
 *                - On message: filter for local watchers, hand off to aggregator
 *                - That aggregator path handles per-user throttle + emit
 *
 * Exports:
 *   - RealtimeTickFanoutService — subscribes to channels on start
 *   - publishTick(tick)          → publishes to Redis for cross-pod fan-out
 *   - onSubscriptionsChanged()   → called when local subscription set changes
 *
 * Depends on:
 *   - RedisService             — for pub/sub
 *   - SubscriptionRegistryService — find local watchers
 *   - RealtimeAggregatorService — for throttled per-user emit
 *
 * Side-effects:
 *   - Subscribes to Redis channels on every start
 *   - Re-subscribes when local subscription set changes (debounced)
 *   - Emits received ticks to Socket.IO rooms for local watchers
 *
 * Key invariants:
 *   - Redis must be configured (no-op if not)
 *   - Uses a dedicated subscriber client (can't run normal commands)
 *   - Local watchers are identified via SubscriptionRegistryService
 *     — pods without local watchers for a symbol silently discard the tick
 *   - Re-subscribe is debounced (100ms) to avoid spamming Redis
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RedisService } from '../../../../shared/redis/redis.service';
import { AppLoggerService } from '../../../../shared/logger';
import { SubscriptionRegistryService } from './subscription-registry.service';
import { RealtimeAggregatorService } from './realtime-aggregator.service';
import { Tick } from '../adapters/market-data.provider';

const TICK_CHANNEL_PREFIX = 'prana:tick';
const RESUBSCRIBE_DEBOUNCE_MS = 100;

function makeChannel(exchange: string, symbol: string): string {
  return `${TICK_CHANNEL_PREFIX}:${exchange.toUpperCase()}:${symbol.toUpperCase()}`;
}

function parseChannel(channel: string): { exchange: string; symbol: string } | null {
  const prefix = `${TICK_CHANNEL_PREFIX}:`;
  if (!channel.startsWith(prefix)) return null;
  const [exchange, symbol] = channel.slice(prefix.length).split(':');
  if (!exchange || !symbol) return null;
  return { exchange, symbol };
}

@Injectable()
export class RealtimeTickFanoutService implements OnModuleInit, OnModuleDestroy {
  private readonly destroy$ = new Subject<void>();
  private redisSub?: Redis;
  private activeChannels = new Set<string>();
  private messageHandlerWired = false;
  private resubscribeTimer?: NodeJS.Timeout;

  constructor(
    private readonly logger: AppLoggerService,
    private readonly redis: RedisService,
    private readonly subs: SubscriptionRegistryService,
    private readonly aggregator: RealtimeAggregatorService,
  ) {
    this.logger.setContext(RealtimeTickFanoutService.name);
  }

  async onModuleInit(): Promise<void> {
    if (!this.redis.getClient()) {
      this.logger.warn('REDIS_URL not set; tick fan-out disabled');
      return;
    }
    try {
      await this.subscribeToAllActiveChannels();
      this.logger.log('tick fan-out service initialized');
    } catch (e) {
      this.logger.error('tick fan-out init failed', (e as Error).message);
    }
  }

  onModuleDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.redisSub) {
      this.redisSub.quit().catch(() => undefined);
    }
  }

  /**
   * Subscribe to Redis for all symbols that have local watchers.
   * Reconciles the active channel set against the desired channel set
   * (subscribe to new, unsubscribe from removed).
   */
  private async subscribeToAllActiveChannels(): Promise<void> {
    const symbols = this.subs.getAllWatchedSymbols();

    const desired = new Set<string>();
    for (const sym of symbols) {
      desired.add(makeChannel(sym.exchange, sym.symbol));
    }

    // Channels we need to add and channels we need to remove
    const toAdd: string[] = [];
    const toRemove: string[] = [];
    for (const c of desired) if (!this.activeChannels.has(c)) toAdd.push(c);
    for (const c of this.activeChannels) if (!desired.has(c)) toRemove.push(c);

    if (toAdd.length === 0 && toRemove.length === 0) return;

    const sub = this.redis.getSubscriberClient();
    if (!sub) {
      this.logger.warn('could not get Redis subscriber client');
      return;
    }

    if (toRemove.length > 0) {
      try {
        await sub.unsubscribe(...toRemove);
      } catch (e) {
        this.logger.debug('unsubscribe failed', { error: (e as Error).message });
      }
    }
    if (toAdd.length > 0) {
      try {
        await sub.subscribe(...toAdd);
      } catch (e) {
        this.logger.error('subscribe failed', (e as Error).message);
        return;
      }
    }

    this.activeChannels = desired;
    this.logger.debug('tick channels reconciled', {
      added: toAdd.length,
      removed: toRemove.length,
      active: this.activeChannels.size,
    });

    this.wireMessageHandler(sub);
  }

  private wireMessageHandler(sub: Redis): void {
    if (this.messageHandlerWired) return;
    this.messageHandlerWired = true;

    sub.on('message', (channel: string, message: string) => {
      const parsed = parseChannel(channel);
      if (!parsed) return;

      let ticks: Tick[];
      try {
        ticks = JSON.parse(message) as Tick[];
      } catch {
        this.logger.debug('failed to parse tick message', { channel });
        return;
      }

      // Hand off to aggregator — it does local watcher filter + throttled emit.
      // (The aggregator's getWatchersFor() will return [] for symbols we have no
      // local interest in, so cross-pod ticks are naturally discarded.)
      this.aggregator.ingestExternalTicks(ticks);
    });
  }

  /**
   * Publish a tick to Redis for cross-pod fan-out.
   * Called by the Kite (or any) market data adapter after it receives a tick.
   * The aggregator path remains the same — we just also publish for cross-pod.
   */
  async publishTick(tick: Tick): Promise<void> {
    if (!this.redis.getClient()) return;
    const channel = makeChannel(tick.exchange, tick.symbol);
    const message = JSON.stringify([tick]);
    try {
      await this.redis.publish(channel, message);
    } catch (e) {
      this.logger.debug('tick publish failed', {
        error: (e as Error).message,
        channel,
      });
    }
  }

  /**
   * Called when the local subscription set changes (e.g. a new user subscribes).
   * Schedules a re-subscribe (debounced to avoid spamming Redis).
   */
  onSubscriptionsChanged(): void {
    if (this.resubscribeTimer) clearTimeout(this.resubscribeTimer);
    this.resubscribeTimer = setTimeout(() => {
      this.subscribeToAllActiveChannels().catch((e) =>
        this.logger.error('resubscribe failed', (e as Error).message),
      );
    }, RESUBSCRIBE_DEBOUNCE_MS);
  }
}
