/**
 * File:        apps/backend/src/modules/settlement/settlement.module.ts
 * Module:      settlement
 * Purpose:     Settlement module — post-trade lifecycle, T+N cycles, outbox handler.
 *
 * Exports:
 *   - SettlementService              — job creation, settlement cycle, processing
 *   - SettlementOutboxHandler        — handles 'settlement.job.create' outbox messages
 *   - TypeOrmModule.forFeature       — SettlementJobEntity for cross-module repos
 *
 * Depends on:
 *   - SharedModule        — AppLoggerService, OutboxModule
 *   - RbacModule          — permission enforcement
 *   - SettlementJobEntity — persistence
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - SettlementOutboxHandler registered under OUTBOX_HANDLERS multi-provider
 *   - SettlementService is a @Global() export (cross-module usage)
 *
 * Read order:
 *   1. SettlementModule (providers + imports)
 *   2. SettlementOutboxHandler (canHandle + handle)
 *   3. SettlementService (T+N cycles)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { RbacModule } from '../rbac/rbac.module';
import { OUTBOX_HANDLERS } from '../../shared/outbox/outbox-worker.skeleton';
import { SettlementController } from './controllers/settlement.controller';
import { SettlementJobEntity } from './entities/settlement-job.entity';
import { SettlementService } from './services/settlement.service';
import { SettlementOutboxHandler } from './services/settlement-outbox-handler';
import { SettlementResolver } from './settlement.resolver';

@Module({
  imports: [SharedModule, RbacModule, TypeOrmModule.forFeature([SettlementJobEntity])],
  controllers: [SettlementController],
  providers: [
    SettlementService,
    SettlementOutboxHandler,
    // Register SettlementOutboxHandler as a multi-provider under OUTBOX_HANDLERS
    // so OutboxWorkerSkeleton (which @Injects OUTBOX_HANDLERS) discovers it.
    { provide: OUTBOX_HANDLERS, useClass: SettlementOutboxHandler, multi: true } as any,
  ],
  exports: [SettlementService, TypeOrmModule],
})
export class SettlementModule {}
