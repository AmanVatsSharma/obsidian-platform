/**
 * @file src/modules/risk-policy/risk-policy.module.ts
 * @module risk-policy
 * @description Risk policy module for jurisdiction constraints and tenant assignment controls
 * @author BharatERP
 * @created 2026-02-17
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { RiskPolicyController } from './controllers/risk-policy.controller';
import { RiskPolicyEntity } from './entities/risk-policy.entity';
import { TenantRiskPolicyEntity } from './entities/tenant-risk-policy.entity';
import { RiskPolicyService } from './services/risk-policy.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([RiskPolicyEntity, TenantRiskPolicyEntity])],
  controllers: [RiskPolicyController],
  providers: [RiskPolicyService],
  exports: [RiskPolicyService],
})
export class RiskPolicyModule {}
