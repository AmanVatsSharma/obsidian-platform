/**
 * File:        apps/backend/src/shared/cache/redis-cache.service.ts
 * Module:      shared/cache
 * Purpose:     Redis-backed ICacheService implementation using the shared Redis client.
 *              Provides get/set/del/invalidatePattern for read-heavy paths
 *              (instruments, market data, account balance).
 *
 * Exports:
 *   - RedisCacheService — injectable, implements ICacheService
 *
 * Depends on:
 *   - RedisService — shared Redis client (ioredis)
 *   - AppLoggerService              — structured logging
 *
 * Side-effects:
 *   - Redis GET/SET/DEL/SCAN commands
 *
 * Key invariants:
 *   - All values serialized as JSON strings
 *   - TTL defaults to 60 seconds; callers override per use case
 *   - invalidatePattern uses SCAN (not KEYS) to avoid blocking Redis on large keyspaces
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-31
 */

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { AppLoggerService } from '../logger';
import { ICacheService } from './cache-service.contract';

const DEFAULT_TTL_SECONDS = 60;

@Injectable()
export class RedisCacheService implements ICacheService, OnModuleDestroy {
  constructor(
    private readonly redis: RedisService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(RedisCacheService.name);
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (raw === null) {
      this.debug('cache miss', { key });
      return null;
    }
    try {
      const value = JSON.parse(raw) as T;
      this.debug('cache hit', { key });
      return value;
    } catch {
      this.logger.warn('Cache deserialization failed, returning null', { key, raw });
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.redis.setWithTtl(key, serialized, ttlSeconds);
    this.debug('cache set', { key, ttlSeconds });
  }

  async del(key: string): Promise<void> {
    const client = this.redis.getClient();
    if (!client) return;
    await client.del(key);
    this.debug('cache del', { key });
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const client = this.redis.getClient();
    if (!client) return;

    let cursor = '0';
    let totalDeleted = 0;

    do {
      // SCAN is non-blocking unlike KEYS — safe for large keyspaces
      const [nextCursor, keys] = await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        await client.del(...keys);
        totalDeleted += keys.length;
      }
    } while (cursor !== '0');

    this.debug('cache invalidatePattern', { pattern, totalDeleted });
  }

  async onModuleDestroy(): Promise<void> {
    // RedisService.onModuleDestroy handles the underlying quit — no additional work needed
  }

  private debug(message: string, meta: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }
}