/**
 * File:        apps/backend/src/shared/outbox/outbox-worker.skeleton.ts
 * Module:      shared/outbox
 * Purpose:     Outbox worker — polls PENDING messages, dispatches to local handlers
 *              (e.g. SettlementOutboxHandler) or publishes to external broker.
 *              Runs on a 5-second interval. Each tick processes up to 10 messages.
 *
 * Exports:
 *   - OutboxWorkerSkeleton   — @Injectable, OnModuleInit/OnModuleDestroy
 *
 * Depends on:
 *   - OutboxService          — fetchPending, markPublished, markFailed
 *   - IMessagePublisher      — external broker publish (fallback)
 *   - AppLoggerService       — structured logging
 *   - IOutboxHandler[]       — injected local handlers
 *
 * Side-effects:
 *   - DB writes (markPublished / markFailed)
 *   - External broker publish (fallback path)
 *
 * Key invariants:
 *   - Local handler wins: if a handler canHandle(msg.topic), it is called
 *     instead of publishing to the external broker
 *   - Published → status = PUBLISHED; failed → status = FAILED
 *   - Worker interval cleared on destroy
 *
 * Read order:
 *   1. OutboxWorkerSkeleton (constructor + lifecycle)
 *   2. tick() — dispatch loop
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import {
  Inject,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { AppLoggerService } from '../logger';
import { OutboxService } from './outbox.service';
import { OutboxEntity } from './entities/outbox.entity';
import { IMessagePublisher } from '../messaging/publisher.interface';
import { MESSAGE_PUBLISHER } from '../messaging/messaging.module';

/** Token for multi-provider registration of local outbox handlers. */
export const OUTBOX_HANDLERS = 'OUTBOX_HANDLERS';

/** Interface for local outbox message handlers. */
export interface IOutboxHandler {
  canHandle(topic: string): boolean;
  handle(msg: OutboxEntity): Promise<void>;
}

@Injectable()
export class OutboxWorkerSkeleton implements OnModuleInit, OnModuleDestroy {
  private intervalId?: NodeJS.Timeout;

  constructor(
    private readonly outbox: OutboxService,
    @Inject(MESSAGE_PUBLISHER) private readonly publisher: IMessagePublisher,
    private readonly logger: AppLoggerService,
    @Inject(OUTBOX_HANDLERS) private readonly handlers: IOutboxHandler[],
  ) {
    this.logger.setContext(OutboxWorkerSkeleton.name);
  }

  async onModuleInit(): Promise<void> {
    this.logger.debug('Outbox worker started', {
      handlerCount: this.handlers.length,
      topics: this.handlers.flatMap((h) => '<handler>').slice(0, 5),
    });
    this.intervalId = setInterval(() => void this.tick(), 5000);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.logger.debug('Outbox worker stopped');
  }

  private async tick(): Promise<void> {
    try {
      const pending = await this.outbox.fetchPending(10);
      for (const msg of pending) {
        // Try local handlers first
        const handler = this.handlers.find((h) => h.canHandle(msg.topic));
        if (handler) {
          try {
            await handler.handle(msg);
            await this.outbox.markPublished(msg.id);
            this.logger.debug('Outbox handled locally', {
              id: msg.id,
              topic: msg.topic,
            });
          } catch (handlerErr) {
            await this.outbox.markFailed(msg.id, (handlerErr as Error)?.message ?? 'unknown');
            this.logger.error(
              'Outbox local handler failed',
              `id=${msg.id} topic=${msg.topic} error=${(handlerErr as Error)?.stack ?? ''}`,
            );
          }
          continue;
        }

        // Fallback: publish to external broker
        try {
          await this.publisher.publish(msg.topic, {
            timestamp: new Date().toISOString(),
            tenantId: msg.tenantId ?? undefined,
            payload: msg.payload,
          });
          await this.outbox.markPublished(msg.id);
          this.logger.debug('Outbox published', { id: msg.id, topic: msg.topic });
        } catch (publishErr) {
          await this.outbox.markFailed(msg.id, (publishErr as Error)?.message ?? 'unknown');
          this.logger.error(
            'Outbox publish failed',
            `id=${msg.id} ${(publishErr as Error)?.stack ?? ''}`,
          );
        }
      }
    } catch (err) {
      this.logger.error('Outbox tick error', (err as Error)?.stack);
    }
  }
}