/**
 * @file src/modules/saas-control-plane/saas-control-plane.module.ts
 * @module saas-control-plane
 * @description SaaS control-plane module for platform-owner provisioning and governance
 * @author BharatERP
 * @created 2026-02-17
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { SaasControlPlaneController } from './controllers/saas-control-plane.controller';
import { BillingInvoicePlaceholderEntity } from './entities/billing-invoice-placeholder.entity';
import { EntitlementPlanEntity } from './entities/entitlement-plan.entity';
import { SupportImpersonationAuditEntity } from './entities/support-impersonation-audit.entity';
import { TenantProvisioningEntity } from './entities/tenant-provisioning.entity';
import { SaasControlPlaneService } from './services/saas-control-plane.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([
      TenantProvisioningEntity,
      EntitlementPlanEntity,
      BillingInvoicePlaceholderEntity,
      SupportImpersonationAuditEntity,
    ]),
  ],
  controllers: [SaasControlPlaneController],
  providers: [SaasControlPlaneService],
  exports: [SaasControlPlaneService],
})
export class SaasControlPlaneModule {}
