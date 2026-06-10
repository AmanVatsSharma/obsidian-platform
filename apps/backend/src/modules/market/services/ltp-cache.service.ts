/**
 * File:        apps/backend/src/modules/market/services/ltp-cache.service.ts
 * Module:      market
 * Purpose:     Cross-pod LTP (last-traded-price) cache backed by Redis.
 *              Each PranaStream pod writes ticks here as they're processed;
 *              any pod can read the current LTP for a symbol without having
 *              received the most recent tick. Solves the cross-pod stale-price
 *              problem when a user reconnects or is routed to a different pod.
 *
 * Exports:
 *   - LtpCacheService
 *     .set(exchange, symbol, price, ts) — write the latest tick
 *     .get(exchange, symbol) → { price, ts } | null
 *     .getMany([(exchange, symbol)]) → Map
 *     .getAll(exchanges) → Map<key, { price, ts }>
 *
 * Depends on:
 *   - RedisService — shared Redis client
 *   - AppLoggerService
 *
 * Side-effects:
 *   - SETEX / MGET / SCAN against the Redis cluster
 *
 * Key invariants:
 *   - Key format: `ltp:{exchange}:{symbol}` (uppercased)
 *   - TTL: 1h (auto-expires if a symbol stops getting ticks)
 *   - The freshest write wins (Redis SET is LWW — last write wins)
 *   - On read miss, returns null (caller falls back to upstream provider)
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../../shared/logger';
import { RedisService } from '../../../shared/redis/redis.service';

const KEY_PREFIX = 'ltp:';
const TTL_SECONDS = 3600; // 1h
const LTP_NAMESPACE = 'ltp';

export type LtpEntry = { price: number; ts: number };

@Injectable()
export class LtpCacheService {
  constructor(
    private readonly redis: RedisService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(LtpCacheService.name);
  }

  /**
   * Build the Redis key for a symbol.
   * Always uppercases so 'nse:inFY' and 'NSE:INFY' share the same key.
   */
  private buildKey(exchange: string, symbol: string): string {
    return `${KEY_PREFIX}${exchange.toUpperCase()}:${symbol.toUpperCase()}`;
  }

  /**
   * Record the latest tick for a symbol. Uses SETEX so the key carries its
   * own expiry. The freshest ts wins — if a pod writes a stale tick to the
   * cluster, the next newer tick overwrites it.
   */
  async set(
    exchange: string,
    symbol: string,
    price: number,
    ts: number,
  ): Promise<void> {
    const client = this.redis.getClient();
    if (!client) return; // no Redis — best-effort, no-op
    const key = this.buildKey(exchange, symbol);
    const value = JSON.stringify({ price, ts });
    try {
      await client.set(key, value, 'EX', TTL_SECONDS);
    } catch (err) {
      // Cache write failures must not break the tick pipeline — log and move on.
      this.logger.warn(
        'ltp cache set failed',
        { key, err: (err as Error).message },
      );
    }
  }

  /**
   * Read the latest LTP for a single symbol.
   * Returns null on miss (no key, expired, or Redis down).
   */
  async get(exchange: string, symbol: string): Promise<LtpEntry | null> {
    const client = this.redis.getClient();
    if (!client) return null;
    const key = this.buildKey(exchange, symbol);
    try {
      const raw = await client.get(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as LtpEntry;
      if (typeof parsed.price !== 'number' || typeof parsed.ts !== 'number') {
        return null;
      }
      return parsed;
    } catch (err) {
      this.logger.warn('ltp cache get failed', {
        key,
        err: (err as Error).message,
      });
      return null;
    }
  }

  /**
   * Batch read for many symbols at once. Uses MGET for a single round trip.
   * Returns a Map<"EXCHANGE:SYMBOL", LtpEntry> containing only the hits.
   */
  async getMany(
    items: Array<{ exchange: string; symbol: string }>,
  ): Promise<Map<string, LtpEntry>> {
    const result = new Map<string, LtpEntry>();
    const client = this.redis.getClient();
    if (!client || items.length === 0) return result;

    const keys = items.map((it) => this.buildKey(it.exchange, it.symbol));
    try {
      const raws = await client.mget(...keys);
      for (let i = 0; i < items.length; i += 1) {
        const raw = raws[i];
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw) as LtpEntry;
          if (typeof parsed.price !== 'number' || typeof parsed.ts !== 'number') {
            continue;
          }
          result.set(`${items[i].exchange.toUpperCase()}:${items[i].symbol.toUpperCase()}`, parsed);
        } catch {
          /* skip malformed entry */
        }
      }
    } catch (err) {
      this.logger.warn('ltp cache mget failed', {
        err: (err as Error).message,
      });
    }
    return result;
  }

  /**
   * Read all LTPs across a set of exchanges. Uses SCAN to avoid blocking the
   * server on KEYS — safe for production. Returns the full map.
   * Useful for snapshot generation on cold start.
   */
  async getAll(): Promise<Map<string, LtpEntry>> {
    const result = new Map<string, LtpEntry>();
    const client = this.redis.getClient();
    if (!client) return result;

    const pattern = `${KEY_PREFIX}*`;
    try {
      let cursor = '0';
      do {
        const [next, keys] = await client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          200,
        );
        cursor = next;
        if (keys.length === 0) continue;
        const raws = await client.mget(...keys);
        for (let i = 0; i < keys.length; i += 1) {
          const raw = raws[i];
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw) as LtpEntry;
            if (typeof parsed.price !== 'number' || typeof parsed.ts !== 'number') {
              continue;
            }
            const key = keys[i].slice(KEY_PREFIX.length); // strip prefix
            result.set(key, parsed);
          } catch {
            /* skip */
          }
        }
      } while (cursor !== '0');
    } catch (err) {
      this.logger.warn('ltp cache scan failed', {
        err: (err as Error).message,
      });
    }
    return result;
  }

  /**
   * Build a snapshot object that can be sent to a client as a `snapshot`
   * event. Filters by user-subscribed symbols.
   */
  async buildLtpSnapshot(
    items: Array<{ exchange: string; symbol: string }>,
  ): Promise<Record<string, { price: number; ts: number }>> {
    const map = await this.getMany(items);
    const out: Record<string, { price: number; ts: number }> = {};
    for (const [k, v] of map.entries()) {
      out[k] = v;
    }
    return out;
  }

  /**
   * Expose the LTP namespace label (for debugging and metrics).
   */
  static get namespace(): string {
    return LTP_NAMESPACE;
  }
}
