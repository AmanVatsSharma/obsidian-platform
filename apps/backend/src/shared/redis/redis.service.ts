/**
 * @file src/shared/redis/redis.service.ts
 * @module shared
 * @description Redis wrapper service using ioredis.
 *              Exposes a single command client + an optional dedicated
 *              subscriber client for pub/sub (ioredis requires a separate
 *              connection for SUBSCRIBE-mode because the connection enters
 *              a different protocol state once subscribed).
 * @author BharatERP
 * @created 2025-09-19
 * @last-updated 2026-06-10
 */

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AppLoggerService } from '../logger';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client?: Redis;
  private subscriberClient?: Redis;

  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext(RedisService.name);
    const url = process.env.REDIS_URL;
    if (url) {
      this.client = new Redis(url, { lazyConnect: true });
      this.client.on('error', (err) =>
        this.logger.error('Redis error', err?.stack),
      );
      this.client
        .connect()
        .catch((e) => this.logger.error('Redis connect failed', e?.stack));
    } else {
      this.logger.warn('REDIS_URL not set; OTP throttling disabled');
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriberClient) await this.subscriberClient.quit();
    if (this.client) await this.client.quit();
  }

  getClient(): Redis | undefined {
    return this.client;
  }

  /**
   * Lazily build (and cache) a dedicated subscriber client.
   * Callers must not run normal commands on the returned client —
   * once you SUBSCRIBE, the connection is locked into pub/sub mode.
   */
  getSubscriberClient(): Redis | undefined {
    if (this.subscriberClient) return this.subscriberClient;
    const url = process.env.REDIS_URL;
    if (!url) return undefined;
    const sub = new Redis(url, { lazyConnect: true });
    sub.on('error', (err) => this.logger.error('Redis sub error', err?.stack));
    sub.connect().catch((e) => this.logger.error('Redis sub connect failed', e?.stack));
    this.subscriberClient = sub;
    return sub;
  }

  async setWithTtl(key: string, value: string, seconds: number): Promise<void> {
    if (!this.client) return;
    await this.client.set(key, value, 'EX', seconds);
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async incrWithTtl(key: string, seconds: number): Promise<number> {
    if (!this.client) return 1;
    const multi = this.client.multi();
    multi.incr(key);
    multi.expire(key, seconds, 'NX');
    const res = await multi.exec();
    const incrVal = (res?.[0]?.[1] as number) || 1;
    return incrVal;
  }

  /**
   * Publish to a Redis channel. Returns the number of subscribers that
   * received the message (0 if nobody is listening). No-op when Redis
   * is not configured.
   */
  async publish(channel: string, message: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.publish(channel, message);
  }
}
