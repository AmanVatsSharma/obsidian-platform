/**
 * File:        apps/backend/src/modules/realtime/prana-stream/prana-stream.module.ts
 * Module:      realtime/prana-stream
 * Purpose:     Nest module bundling gateway, services, adapters, and the
 *              transactional-outbox → realtime bridge for the unified
 *              PranaStream WebSocket gateway.
 *
 * Exports:
 *   - RealtimeAggregatorService, RealtimePublisherService  (legacy direct-publish facade)
 *
 * Depends on:
 *   - SharedModule, RbacModule, MarketModule
 *   - OutboxModule            — provides OUTBOX_HANDLERS multi-provider
 *   - RealtimePublishOutboxHandler — registered as a local outbox handler
 *
 * Side-effects:
 *   - Registers RealtimePublishOutboxHandler under OUTBOX_HANDLERS so the
 *     OutboxWorkerSkeleton dispatches OMS/Accounts outbox rows to the
 *     aggregator instead of an external broker.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../../shared/shared.module';
import { RbacModule } from '../../rbac/rbac.module';
import { MarketModule } from '../../market/market.module';
import { PranaStreamGateway } from './gateway/prana-stream.gateway';
import { SubscriptionRegistryService } from './services/subscription-registry.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeAggregatorService } from './services/realtime-aggregator.service';
import { CompositeMarketDataAdapter } from './adapters/composite-market-data.adapter';
import { MainMarketDataAdapter } from './adapters/main-market-data.adapter';
import { VortexMarketDataAdapter } from './adapters/vortex-market-data.adapter';
import { MockMarketDataAdapter } from './adapters/mock-market-data.adapter';
import { KiteMarketDataAdapter } from './adapters/kite-market-data.adapter';
import { RealtimePublisherService } from './services/realtime-publisher.service';
import { RealtimeScaleCoordinatorService } from './services/realtime-scale-coordinator.service';
import { AdminPranaController } from './controllers/admin-prana.controller';
import { AccountEntity } from '../../accounts/entities/account.entity';
import { OrderEntity } from '../../oms/entities/order.entity';
import { PositionLedgerEntryEntity } from '../../accounts/entities/position-ledger-entry.entity';
import { CashLedgerEntryEntity } from '../../accounts/entities/cash-ledger-entry.entity';
import { HoldEntity } from '../../accounts/entities/hold.entity';
import { InstrumentEntity } from '../../market/entities/instrument.entity';
import { DataProviderEntity } from '../../market/entities/data-provider.entity';
import { RealtimeResolver } from './realtime.resolver';
import { RealtimePublishOutboxHandler } from './outbox/realtime-publish-outbox.handler';
import { OUTBOX_HANDLERS } from '../../../shared/outbox/outbox-worker.skeleton';
import { RealtimeBackpressureService } from './services/realtime-backpressure.service';
import { RealtimeEventBufferService } from './services/realtime-event-buffer.service';
import { RealtimeOfflineFallbackService } from './services/realtime-offline-fallback.service';
import { RealtimeTickFanoutService } from './services/realtime-tick-fanout.service';

@Module({
  imports: [
    SharedModule,
    RbacModule,
    MarketModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      AccountEntity,
      OrderEntity,
      PositionLedgerEntryEntity,
      CashLedgerEntryEntity,
      HoldEntity,
      InstrumentEntity,
      DataProviderEntity,
    ]),
  ],
  providers: [
    PranaStreamGateway,
    RealtimeAggregatorService,
    RealtimePublisherService,
    RealtimeScaleCoordinatorService,
    SubscriptionRegistryService,
    CompositeMarketDataAdapter,
    MainMarketDataAdapter,
    VortexMarketDataAdapter,
    MockMarketDataAdapter,
    KiteMarketDataAdapter,
    WsJwtGuard,
    RealtimeResolver,
    RealtimeBackpressureService,
    RealtimeEventBufferService,
    RealtimeOfflineFallbackService,
    // Register the OMS/Accounts outbox → realtime bridge.
    // NestJS merges all providers with the OUTBOX_HANDLERS token into an array.
    RealtimePublishOutboxHandler,
    {
      provide: OUTBOX_HANDLERS,
      useExisting: RealtimePublishOutboxHandler,
    },
  ],
  exports: [
    RealtimeAggregatorService,
    RealtimePublisherService,
    RealtimePublishOutboxHandler,
    RealtimeBackpressureService,
    RealtimeEventBufferService,
    RealtimeOfflineFallbackService,
    RealtimeTickFanoutService,
  ],
  controllers: [AdminPranaController],
})
export class PranaStreamModule {}


