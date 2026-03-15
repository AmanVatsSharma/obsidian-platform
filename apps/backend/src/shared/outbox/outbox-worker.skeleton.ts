/**
 * @file src/shared/outbox/outbox-worker.skeleton.ts
 * @module shared/outbox
 * @description Outbox worker skeleton for polling and publishing pending messages
 * @author BharatERP
 * @created 2026-02-19
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { AppLoggerService } from '../logger';
import { OutboxService } from './outbox.service';

@Injectable()
export class OutboxWorkerSkeleton implements OnModuleInit, OnModuleDestroy {
  private intervalId?: NodeJS.Timeout;

  constructor(
    private readonly outbox: OutboxService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(OutboxWorkerSkeleton.name);
  }

  async onModuleInit(): Promise<void> {
    this.logger.debug('Outbox worker skeleton started');
    // [SonuRamTODO] Wire to actual publisher; poll interval configurable
    this.intervalId = setInterval(() => this.tick(), 5000);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.logger.debug('Outbox worker skeleton stopped');
  }

  private async tick(): Promise<void> {
    try {
      const pending = await this.outbox.fetchPending(10);
      for (const msg of pending) {
        // [SonuRamTODO] Publish via IMessagePublisher; then markPublished or markFailed
        this.logger.debug('Outbox tick (stub)', { id: msg.id, topic: msg.topic });
      }
    } catch (err) {
      this.logger.error('Outbox tick error', (err as Error)?.stack);
    }
  }
}
