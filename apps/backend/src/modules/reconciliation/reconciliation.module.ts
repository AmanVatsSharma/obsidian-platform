/**
 * @file src/modules/reconciliation/reconciliation.module.ts
 * @module reconciliation
 * @description Reconciliation module for breaks and exception queues
 * @author BharatERP
 * @created 2026-02-17
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { ReconciliationController } from './controllers/reconciliation.controller';
import { ReconciliationBreakEntity } from './entities/reconciliation-break.entity';
import { ReconciliationService } from './services/reconciliation.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([ReconciliationBreakEntity])],
  controllers: [ReconciliationController],
  providers: [ReconciliationService],
  exports: [ReconciliationService],
})
export class ReconciliationModule {}
