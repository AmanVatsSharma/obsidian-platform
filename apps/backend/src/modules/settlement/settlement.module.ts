/**
 * @file src/modules/settlement/settlement.module.ts
 * @module settlement
 * @description Settlement module scaffold for post-trade operations
 * @author BharatERP
 * @created 2026-02-17
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { SettlementController } from './controllers/settlement.controller';
import { SettlementJobEntity } from './entities/settlement-job.entity';
import { SettlementService } from './services/settlement.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([SettlementJobEntity])],
  controllers: [SettlementController],
  providers: [SettlementService],
  exports: [SettlementService],
})
export class SettlementModule {}
