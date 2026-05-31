/**
 * File:        apps/backend/src/shared/resilience/resilience.module.ts
 * Module:      shared/resilience
 * Purpose:     @Global() module exporting ResilienceService for all backend modules.
 *              All external HTTP calls should go through ResilienceService.
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-31
 */

import { Global, Module } from '@nestjs/common';
import { ResilienceService } from './resilience.service';

@Global()
@Module({
  providers: [ResilienceService],
  exports: [ResilienceService],
})
export class ResilienceModule {}
