/**
 * File:        apps/backend/src/modules/execution-intelligence/execution-intelligence.module.ts
 * Module:      execution-intelligence · Module Root
 * Purpose:     Smart Order Routing module — venue scoring, slippage tracking, and SOR orchestration
 *
 * Exports:
 *   - ExecutionIntelligenceModule       — NestJS module (imports ExecutionGatewayModule)
 *
 * Depends on:
 *   - ExecutionGatewayModule           — required for ExecutionGatewayService injection
 *
 * Side-effects:
 *   - Registers SmartOrderRouterService as exportable so other modules (OMS) can inject it
 *   - Venues are registered via SmartOrderRouterService.registerVenues() — call at bootstrap
 *
 * Key invariants:
 *   - ExecutionGatewayModule must be imported (not re-exported) to access ExecutionGatewayService
 *
 * Read order:
 *   1. Module declaration — imports + providers
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Module } from '@nestjs/common';
import { ExecutionGatewayModule } from '../execution-gateway/execution-gateway.module';
import { SmartOrderRouterService } from './services/smart-order-router.service';
import { VenueScorerService } from './services/venue-scorer.service';
import { SlippageTrackerService } from './services/slippage-tracker.service';

@Module({
  imports: [ExecutionGatewayModule],
  providers: [SmartOrderRouterService, VenueScorerService, SlippageTrackerService],
  exports: [SmartOrderRouterService, VenueScorerService, SlippageTrackerService],
})
export class ExecutionIntelligenceModule {}