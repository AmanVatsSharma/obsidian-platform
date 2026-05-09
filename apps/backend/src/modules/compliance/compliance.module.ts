/**
 * @file src/modules/compliance/compliance.module.ts
 * @module compliance
 * @description Compliance module for jurisdiction profile controls and policy APIs
 * @author BharatERP
 * @created 2026-02-17
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { ComplianceController } from './controllers/compliance.controller';
import { CompliancePolicyEntity } from './entities/compliance-policy.entity';
import { ComplianceService } from './services/compliance.service';
import { DfsaAdapter } from './adapters/dfsa.adapter';
import { FcaAdapter } from './adapters/fca.adapter';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([CompliancePolicyEntity])],
  controllers: [ComplianceController],
  providers: [ComplianceService, DfsaAdapter, FcaAdapter],
  exports: [ComplianceService],
})
export class ComplianceModule {}
