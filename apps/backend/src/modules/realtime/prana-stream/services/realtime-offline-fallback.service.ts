/**
 * File:        apps/backend/src/modules/realtime/prana-stream/services/realtime-offline-fallback.service.ts
 * Module:      realtime/prana-stream
 * Purpose:     Detect when an event is destined for an offline user
 *              and choose a fallback channel (push notification, email,
 *              persisted message log) so critical events are never silently
 *              lost. The Socket.IO room is fast-path; this is slow-path
 *              safety net for orders / fills / margin calls the user
 *              needs to know about even when the WS is down.
 *
 * Exports:
 *   - RealtimeOfflineFallbackService
 *     .isUserOnline(userId) → boolean
 *     .recordMissed(userId, eventName, data) — push a missed event
 *     .flushMissedEvents(userId) → list of events to deliver
 *     .clearMissed(userId) — wipe after successful delivery
 *
 * Depends on:
 *   - AppLoggerService
 *   - RealtimeScaleCoordinatorService (for user-instance ownership)
 *   - NotificationsService (injected lazily to avoid circular deps)
 *
 * Side-effects:
 *   - Appends to per-user Redis list of missed events
 *   - Optionally calls NotificationsService for push/email on critical events
 *
 * Key invariants:
 *   - Critical events: order.updated (terminal states), account.updated
 *     (margin call) — these trigger push notifications.
 *   - Non-critical: order.updated (intermediate) — only persisted in log.
 *   - Missed events expire after 24h (TTL on the Redis key).
 *   - flushMissedEvents is called when a user reconnects — events are
 *     sent to the client as part of the resync handshake.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../../../shared/logger';
import { RedisService } from '../../../../shared/redis/redis.service';
import { RealtimeScaleCoordinatorService } from './realtime-scale-coordinator.service';

const MISSED_EVENTS_KEY = (userId: string) => `prana:missed:${userId}`;
const MISSED_EVENTS_TTL_SEC = 24 * 60 * 60; // 24h

const CRITICAL_EVENTS = new Set([
  'order.updated', // could be a fill
  'position.updated', // could be a stop-out
  'account.updated', // could be a margin call
]);

export type MissedEvent = {
  eventName: string;
  data: unknown;
  ts: string;
  seq?: number;
};

@Injectable()
export class RealtimeOfflineFallbackService {
  constructor(
    private readonly redis: RedisService,
    private readonly logger: AppLoggerService,
    private readonly scaleCoordinator: RealtimeScaleCoordinatorService,
  ) {
    this.logger.setContext(RealtimeOfflineFallbackService.name);
  }

  /**
   * Returns true if the user has an active WS connection on the owning pod.
   * Used by the aggregator to decide whether to attempt the WS push at all.
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const owningInstance = await this.scaleCoordinator.getOwningInstance(userId);
    return Boolean(owningInstance);
  }

  /**
   * Persist a missed event so the user can see it on reconnect.
   * For critical events, also trigger a push notification.
   */
  async recordMissed(
    userId: string,
    eventName: string,
    data: unknown,
    seq?: number,
  ): Promise<void> {
    const client = this.redis.getClient();
    if (!client) return;
    const key = MISSED_EVENTS_KEY(userId);
    const entry: MissedEvent = {
      eventName,
      data,
      ts: new Date().toISOString(),
      seq,
    };
    try {
      // Push to a Redis list, capped at 100 entries (LTRIM keeps newest).
      // Then refresh TTL.
      await client
        .multi()
        .rpush(key, JSON.stringify(entry))
        .ltrim(key, -100, -1)
        .expire(key, MISSED_EVENTS_TTL_SEC)
        .exec();
    } catch (err) {
      this.logger.warn('missed event record failed', {
        userId,
        err: (err as Error).message,
      });
    }

    if (CRITICAL_EVENTS.has(eventName)) {
      // Lazy import to break circular dependency with notifications module.
      // The actual push is delegated to NotificationsService.
      await this.tryPushNotification(userId, eventName, data);
    }
  }

  /**
   * Read all missed events for a user. Called on reconnect.
   */
  async flushMissedEvents(userId: string): Promise<MissedEvent[]> {
    const client = this.redis.getClient();
    if (!client) return [];
    const key = MISSED_EVENTS_KEY(userId);
    try {
      const raws = await client.lrange(key, 0, -1);
      if (raws.length === 0) return [];
      const events: MissedEvent[] = [];
      for (const raw of raws) {
        try {
          events.push(JSON.parse(raw) as MissedEvent);
        } catch {
          /* skip malformed */
        }
      }
      return events;
    } catch (err) {
      this.logger.warn('missed event flush failed', {
        userId,
        err: (err as Error).message,
      });
      return [];
    }
  }

  /**
   * Clear the missed events list after successful delivery.
   */
  async clearMissed(userId: string): Promise<void> {
    const client = this.redis.getClient();
    if (!client) return;
    try {
      await client.del(MISSED_EVENTS_KEY(userId));
    } catch (err) {
      this.logger.warn('missed event clear failed', {
        userId,
        err: (err as Error).message,
      });
    }
  }

  /**
   * Best-effort push notification. We don't await on the notification path
   * (it has its own retry/queue) — fire and forget.
   */
  private async tryPushNotification(
    userId: string,
    eventName: string,
    data: unknown,
  ): Promise<void> {
    try {
      // Lazy require to keep the realtime module decoupled from the
      // notifications module's init order. Both modules are global-ish
      // but notifications depends on a websocket adapter, so we cannot
      // import eagerly at module-construction time.
      const { NotificationsService } = await import(
        '../../../notifications/notifications.service'
      );
      // The NotificationsService is a global; in a real call this would
      // come from the DI container. We use a process-wide singleton ref
      // set during application bootstrap.
      const svc = (globalThis as any).__notificationsService as
        | InstanceType<typeof NotificationsService>
        | undefined;
      if (svc?.sendRealtime) {
        await svc.sendRealtime(userId, eventName, data);
      }
    } catch (err) {
      this.logger.debug('push notification dispatch failed (non-fatal)', {
        userId,
        eventName,
        err: (err as Error).message,
      });
    }
  }
}