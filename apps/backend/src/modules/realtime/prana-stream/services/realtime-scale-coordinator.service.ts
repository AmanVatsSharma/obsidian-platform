/**
 * File:        apps/backend/src/modules/realtime/prana-stream/services/realtime-scale-coordinator.service.ts
 * Module:      realtime/prana-stream
 * Purpose:     Multi-instance scale coordinator. Uses Redis to:
 *              1. Register each user session to the owning instance (key TTL
 *                 of 5 min, refreshed on heartbeat).
 *              2. Atomically claim a Kite subscription slot (3000-instrument
 *                 Kite limit) using a Lua script registered via defineCommand.
 *              3. Provide `shouldHandleUser` for routing OMS/Accounts outbox
 *                 events to the correct instance.
 *
 * Exports:
 *   - RealtimeScaleCoordinatorService
 *     .registerInstance(userId, sessionId)
 *     .unregisterInstance(userId, sessionId)
 *     .shouldHandleUser(userId)
 *     .tryClaimKiteSlot(symbolKey) → boolean
 *     .releaseKiteSlot(symbolKey)
 *     .getKiteSlotUsage() → number
 *     .getHostname() → string
 *
 * Depends on:
 *   - RedisService     — ioredis client
 *   - AppLoggerService
 *
 * Side-effects:
 *   - Redis SET / DEL / custom commands
 *   - Heartbeat refresh every 60s (via setInterval)
 *
 * Key invariants:
 *   - Without Redis (REDIS_URL unset), falls back to single-instance behavior.
 *   - The Kite slot count is shared across all pods — Lua script is atomic.
 *   - User instance ownership TTLs out after 5 minutes of no heartbeat, so
 *     crashed pods release their users.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { AppLoggerService } from '../../../../shared/logger';
import { RedisService } from '../../../../shared/redis/redis.service';

const KITE_SLOT_KEY = 'prana:kite:slots';
const USER_INSTANCE_KEY = (userId: string) =>
  `prana:user:${userId}:instance`;
const USER_SESSION_KEY = (userId: string, sessionId: string) =>
  `prana:user:${userId}:session:${sessionId}`;
const SESSION_TTL_SECONDS = 300;
const MAX_KITE_INSTRUMENTS = 3000;

@Injectable()
export class RealtimeScaleCoordinatorService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly hostname: string;
  private heartbeatInterval?: NodeJS.Timeout;
  private readonly localSessions: Set<string> = new Set();
  private scriptsRegistered = false;

  constructor(
    private readonly logger: AppLoggerService,
    private readonly redisService: RedisService,
  ) {
    this.logger.setContext(RealtimeScaleCoordinatorService.name);
    this.hostname = process.env['HOSTNAME'] ?? `local-${process.pid}`;
  }

  onModuleInit(): void {
    this.tryRegisterLuaScripts();
    this.heartbeatInterval = setInterval(() => {
      void this.refreshLocalSessions();
    }, 60_000);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    for (const composite of this.localSessions) {
      const sep = composite.indexOf(':');
      if (sep < 0) continue;
      const userId = composite.substring(0, sep);
      const sessionId = composite.substring(sep + 1);
      try {
        await this.unregisterInstance(userId, sessionId);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Register Lua scripts with ioredis via defineCommand. ioredis sends them
   * once on first use and caches the SHA locally — subsequent calls use EVALSHA.
   */
  private tryRegisterLuaScripts(): void {
    const client = this.redisService.getClient();
    if (!client || this.scriptsRegistered) return;
    try {
      client.defineCommand('pranaClaimKiteSlot', {
        numberOfKeys: 1,
        lua: `
          local current = tonumber(redis.call('GET', KEYS[1]) or '0')
          if current < tonumber(ARGV[1]) then
            redis.call('INCR', KEYS[1])
            return 1
          end
          return 0
        `,
      });
      client.defineCommand('pranaReleaseKiteSlot', {
        numberOfKeys: 1,
        lua: `
          local current = tonumber(redis.call('GET', KEYS[1]) or '0')
          if current > 0 then
            redis.call('DECR', KEYS[1])
            return 1
          end
          return 0
        `,
      });
      this.scriptsRegistered = true;
      this.logger.debug('Registered PranaStream Lua scripts');
    } catch (e) {
      this.logger.warn('Lua script registration failed', (e as Error)?.message);
    }
  }

  // -----------------------------------------------------------------------
  // User-instance ownership
  // -----------------------------------------------------------------------

  async registerInstance(userId: string, sessionId: string): Promise<void> {
    const client = this.redisService.getClient();
    if (!client) return;

    try {
      await client.set(
        USER_INSTANCE_KEY(userId),
        this.hostname,
        'EX',
        SESSION_TTL_SECONDS,
      );
      await client.set(
        USER_SESSION_KEY(userId, sessionId),
        this.hostname,
        'EX',
        SESSION_TTL_SECONDS,
      );
      this.localSessions.add(`${userId}:${sessionId}`);
      this.logger.debug('registered user instance', {
        userId,
        sessionId,
        hostname: this.hostname,
      });
    } catch (e) {
      this.logger.warn(
        'registerInstance failed',
        `userId=${userId} err=${(e as Error)?.message}`,
      );
    }
  }

  async unregisterInstance(userId: string, sessionId: string): Promise<void> {
    const client = this.redisService.getClient();
    if (!client) return;

    try {
      await client.del(USER_SESSION_KEY(userId, sessionId));
      this.localSessions.delete(`${userId}:${sessionId}`);
      const stillLocal = Array.from(this.localSessions).some((s) =>
        s.startsWith(`${userId}:`),
      );
      if (!stillLocal) {
        const owner = await client.get(USER_INSTANCE_KEY(userId));
        if (owner === this.hostname) {
          await client.del(USER_INSTANCE_KEY(userId));
        }
      }
      this.logger.debug('unregistered user instance', { userId, sessionId });
    } catch (e) {
      this.logger.warn(
        'unregisterInstance failed',
        `userId=${userId} err=${(e as Error)?.message}`,
      );
    }
  }

  async shouldHandleUser(userId: string): Promise<boolean> {
    const client = this.redisService.getClient();
    if (!client) return true;

    try {
      const owner = await client.get(USER_INSTANCE_KEY(userId));
      if (!owner) {
        await client.set(
          USER_INSTANCE_KEY(userId),
          this.hostname,
          'EX',
          SESSION_TTL_SECONDS,
        );
        return true;
      }
      return owner === this.hostname;
    } catch (e) {
      this.logger.warn(
        'shouldHandleUser failed; defaulting to true',
        `userId=${userId} err=${(e as Error)?.message}`,
      );
      return true;
    }
  }

  private async refreshLocalSessions(): Promise<void> {
    const client = this.redisService.getClient();
    if (!client) return;
    for (const composite of this.localSessions) {
      const sep = composite.indexOf(':');
      if (sep < 0) continue;
      const userId = composite.substring(0, sep);
      const sessionId = composite.substring(sep + 1);
      try {
        await client.expire(USER_INSTANCE_KEY(userId), SESSION_TTL_SECONDS);
        await client.expire(
          USER_SESSION_KEY(userId, sessionId),
          SESSION_TTL_SECONDS,
        );
      } catch (e) {
        this.logger.warn(
          'session refresh failed',
          `userId=${userId} err=${(e as Error)?.message}`,
        );
      }
    }
  }

  // -----------------------------------------------------------------------
  // Kite slot accounting
  // -----------------------------------------------------------------------

  async tryClaimKiteSlot(_symbolKey: string): Promise<boolean> {
    const client = this.redisService.getClient() as
      | (ReturnType<RedisService['getClient']> & {
          pranaClaimKiteSlot?: (
            key: string,
            max: string,
          ) => Promise<unknown>;
        })
      | undefined;
    if (!client) return true;

    try {
      if (!this.scriptsRegistered) this.tryRegisterLuaScripts();
      if (!client.pranaClaimKiteSlot) return true;
      const result = await client.pranaClaimKiteSlot(
        KITE_SLOT_KEY,
        String(MAX_KITE_INSTRUMENTS),
      );
      return Number(result) === 1;
    } catch (e) {
      this.logger.warn(
        'tryClaimKiteSlot failed; defaulting to true',
        `err=${(e as Error)?.message}`,
      );
      return true;
    }
  }

  async releaseKiteSlot(_symbolKey: string): Promise<void> {
    const client = this.redisService.getClient() as
      | (ReturnType<RedisService['getClient']> & {
          pranaReleaseKiteSlot?: (key: string) => Promise<unknown>;
        })
      | undefined;
    if (!client) return;

    try {
      if (!this.scriptsRegistered) this.tryRegisterLuaScripts();
      if (!client.pranaReleaseKiteSlot) return;
      await client.pranaReleaseKiteSlot(KITE_SLOT_KEY);
    } catch (e) {
      this.logger.warn(
        'releaseKiteSlot failed',
        `err=${(e as Error)?.message}`,
      );
    }
  }

  async getKiteSlotUsage(): Promise<number> {
    const client = this.redisService.getClient();
    if (!client) return 0;
    try {
      const v = await client.get(KITE_SLOT_KEY);
      return Number(v ?? '0');
    } catch {
      return 0;
    }
  }

  getHostname(): string {
    return this.hostname;
  }
}
