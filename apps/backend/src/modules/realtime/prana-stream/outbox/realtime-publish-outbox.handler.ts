/**
 * File:        apps/backend/src/modules/realtime/prana-stream/outbox/realtime-publish-outbox.handler.ts
 * Module:      realtime/prana-stream
 * Purpose:     Local outbox handler that translates transactional outbox events
 *              (oms.order.updated, oms.execution.added, oms.bbook.filled,
 *               accounts.cash.posted, accounts.position.posted) into PranaStream
 *              realtime pushes. This is the bridge between the OMS/Accounts
 *              transactional outbox writes and the Socket.IO gateway.
 *
 * Exports:
 *   - RealtimePublishOutboxHandler   — implements IOutboxHandler
 *
 * Depends on:
 *   - RealtimeAggregatorService  — publishOrderUpdate / publishPositionUpdate / publishAccountUpdate
 *   - AppLoggerService
 *
 * Side-effects:
 *   - Emits Socket.IO frames to user rooms (via the aggregator)
 *
 * Key invariants:
 *   - canHandle returns true ONLY for OMS/Accounts realtime topics
 *   - handle() is idempotent — duplicate outbox rows (rare, after retry) will
 *     push the same frame again, but the client is supposed to handle that via
 *     the `seq` field in the envelope.
 *   - The userId MUST be present in payload; if missing, log a warning and skip.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../../../shared/logger';
import { OutboxEntity } from '../../../../shared/outbox/entities/outbox.entity';
import { IOutboxHandler } from '../../../../shared/outbox/outbox-worker.skeleton';
import { RealtimeAggregatorService } from '../services/realtime-aggregator.service';
import { RealtimeScaleCoordinatorService } from '../services/realtime-scale-coordinator.service';

export const OMS_REALTIME_TOPICS = [
  'oms.order.updated',
  'oms.execution.added',
  'oms.bbook.filled',
  'accounts.cash.posted',
  'accounts.position.posted',
] as const;

@Injectable()
export class RealtimePublishOutboxHandler implements IOutboxHandler {
  constructor(
    private readonly aggregator: RealtimeAggregatorService,
    private readonly scaleCoordinator: RealtimeScaleCoordinatorService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(RealtimePublishOutboxHandler.name);
  }

  canHandle(topic: string): boolean {
    return (OMS_REALTIME_TOPICS as readonly string[]).includes(topic);
  }

  async handle(msg: OutboxEntity): Promise<void> {
    const payload = msg.payload ?? {};
    const userId =
      typeof payload['userId'] === 'string'
        ? (payload['userId'] as string)
        : null;

    if (!userId) {
      this.logger.warn('RealtimePublishOutboxHandler: payload missing userId', {
        topic: msg.topic,
        id: msg.id,
      });
      return;
    }

    // Multi-instance routing: if this pod does not own the user's sessions,
    // skip — the owning pod will receive the same row from its outbox worker.
    if (!(await this.scaleCoordinator.shouldHandleUser(userId))) {
      return;
    }

    switch (msg.topic) {
      case 'oms.order.updated':
      case 'oms.execution.added':
      case 'oms.bbook.filled':
        this.aggregator.publishOrderUpdate(userId, payload);
        break;
      case 'accounts.cash.posted':
        this.aggregator.publishAccountUpdate(userId, payload);
        break;
      case 'accounts.position.posted':
        this.aggregator.publishPositionUpdate(userId, payload);
        break;
      default:
        this.logger.warn(
          'RealtimePublishOutboxHandler: unhandled topic in canHandle/set path',
          { topic: msg.topic },
        );
    }
  }
}