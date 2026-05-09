/**
 * @file src/modules/limits-and-controls/limits-and-controls.module.ts
 * @module limits-and-controls
 * @description Limits-and-controls module for operational risk guardrails
 * @author BharatERP
 * @created 2026-02-17
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { LimitsAndControlsController } from './controllers/limits-and-controls.controller';
import { LimitControlEntity } from './entities/limit-control.entity';
import { LimitExceptionEntity } from './entities/limit-exception.entity';
import { TenantEntity } from '../tenancy/entities/tenant.entity';
import { LimitsAndControlsService } from './services/limits-and-controls.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([LimitControlEntity, LimitExceptionEntity, TenantEntity])],
  controllers: [LimitsAndControlsController],
  providers: [LimitsAndControlsService],
  exports: [LimitsAndControlsService],
})
export class LimitsAndControlsModule {}
