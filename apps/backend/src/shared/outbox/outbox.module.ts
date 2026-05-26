/**
 * File:        apps/backend/src/shared/outbox/outbox.module.ts
 * Module:      shared/outbox
 * Purpose:     Nest module for outbox entity, service, and worker.
 *              Exports OUTBOX_HANDLERS multi-provider so feature modules
 *              can register local handlers (e.g. SettlementOutboxHandler).
 *
 * Exports:
 *   - OutboxService         — transactional outbox writes
 *   - OUTBOX_HANDLERS       — multi-provider token for local handlers
 *
 * Depends on:
 *   - OutboxEntity          — persistence
 *   - OutboxService         — append/fetchPending/markPublished
 *   - OutboxWorkerSkeleton  — polls and dispatches messages
 *   - MessagingModule       — external broker publish
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - @Global() so OutboxService is available without explicit imports
 *   - NestJS automatically collects all providers with the same token into an array
 *
 * Read order:
 *   1. OUTBOX_HANDLERS token (string constant — used as DI token)
 *   2. OutboxModule providers
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEntity } from './entities/outbox.entity';
import { OutboxService } from './outbox.service';
import { OutboxWorkerSkeleton, OUTBOX_HANDLERS } from './outbox-worker.skeleton';
import { MessagingModule } from '../messaging/messaging.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OutboxEntity]), MessagingModule],
  providers: [
    OutboxService,
    OutboxWorkerSkeleton,
    // Empty array as base — NestJS merges all providers with this token into an array
    { provide: OUTBOX_HANDLERS, useValue: [] },
  ],
  exports: [OutboxService, OUTBOX_HANDLERS],
})
export class OutboxModule {}