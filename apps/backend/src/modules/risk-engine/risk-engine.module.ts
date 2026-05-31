/**
 * File:        apps/backend/src/modules/risk-engine/risk-engine.module.ts
 * Module:      risk-engine
 * Purpose:     Risk engine module wiring all services for real-time risk validation,
 *              exposure tracking, Greeks calculation, circuit breakers, and
 *              auto-liquidation. Consumed by OmsModule (pre-trade) and AccountsModule.
 *
 * Exports:
 *   - RiskEngineModule       — standalone module
 *   - RiskEngineService      — pre-trade validation + admin CRUD
 *   - RealTimeExposureService — in-memory exposure tracking
 *   - GreeksCalculatorService — delta/gamma computation
 *   - CircuitBreakerService  — price-limit circuit breakers
 *   - AutoLiquidationWorker  — margin-triggered position liquidation
 *
 * Depends on:
 *   - SharedModule (global — AppLoggerService, OutboxModule, etc.)
 *   - AccountsModule (AccountsService, BalancesService, StrategyPositionService)
 *   - MarketModule (PriceFeedService, InstrumentsService)
 *   - NotificationsModule (NotificationService)
 *   - RiskPolicyModule (RiskPolicyService) — for pre-trade composition
 *
 * Side-effects:
 *   - AutoLiquidationWorker starts a 30-second interval on module init
 *   - RealTimeExposureService subscribes to execution.added events on init
 *
 * Key invariants:
 *   - All external service calls go through injected services (no raw HTTP/DB in services)
 *   - RiskEngineService uses OrderEventsService (in-memory pub/sub) for LIQUIDATE_ALL/LIQUIDATE_BIGGEST
 *     instead of direct OrderService — breaking the circular dep that previously required forwardRef
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-31
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { AccountsModule } from '../accounts/accounts.module';
import { MarketModule } from '../market/market.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RiskPolicyModule } from '../risk-policy/risk-policy.module';
import { RiskThresholdEntity } from './entities/risk-threshold.entity';
import { RiskEngineService } from './services/risk-engine.service';
import { RealTimeExposureService } from './services/real-time-exposure.service';
import { GreeksCalculatorService } from './services/greeks-calculator.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { AutoLiquidationWorker } from './services/auto-liquidation.worker';
import { OrderEventsService } from '../oms/services/order-events.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([RiskThresholdEntity]),
    AccountsModule,
    MarketModule,
    NotificationsModule,
    RiskPolicyModule,
  ],
  providers: [
    RiskEngineService,
    RealTimeExposureService,
    GreeksCalculatorService,
    CircuitBreakerService,
    AutoLiquidationWorker,
  ],
  exports: [
    RiskEngineService,
    RealTimeExposureService,
    GreeksCalculatorService,
    CircuitBreakerService,
    AutoLiquidationWorker,
    TypeOrmModule,
  ],
})
export class RiskEngineModule {}