/**
 * @file src/modules/saas-control-plane/controllers/saas-control-plane.controller.ts
 * @module saas-control-plane
 * @description Platform-owner control-plane APIs for governance and monetization scaffolds
 * @author BharatERP
 * @created 2026-02-17
 */

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  CreateBillingInvoicePlaceholderDto,
  CreateSupportImpersonationAuditDto,
  CreateTenantProvisioningDto,
  UpsertEntitlementPlanDto,
} from '../dtos/create-tenant-provisioning.dto';
import { BillingInvoicePlaceholderEntity } from '../entities/billing-invoice-placeholder.entity';
import { EntitlementPlanEntity } from '../entities/entitlement-plan.entity';
import { SupportImpersonationAuditEntity } from '../entities/support-impersonation-audit.entity';
import { TenantProvisioningEntity } from '../entities/tenant-provisioning.entity';
import { SaasControlPlaneService } from '../services/saas-control-plane.service';

@Controller('saas-control-plane')
export class SaasControlPlaneController {
  constructor(private readonly saasControlPlaneService: SaasControlPlaneService) {}

  @Post('provisioning')
  async createProvisioning(@Body() dto: CreateTenantProvisioningDto): Promise<TenantProvisioningEntity> {
    return this.saasControlPlaneService.createProvisioning(dto);
  }

  @Get('provisioning')
  async listProvisioning(@Query('tenantId') tenantId: string): Promise<TenantProvisioningEntity[]> {
    return this.saasControlPlaneService.listProvisioning(tenantId);
  }

  @Post('entitlements')
  async upsertEntitlements(@Body() dto: UpsertEntitlementPlanDto): Promise<EntitlementPlanEntity> {
    return this.saasControlPlaneService.upsertEntitlements(dto);
  }

  @Get('entitlements')
  async listEntitlements(@Query('tenantId') tenantId: string): Promise<EntitlementPlanEntity[]> {
    return this.saasControlPlaneService.listEntitlements(tenantId);
  }

  @Post('billing/invoices')
  async createBilling(@Body() dto: CreateBillingInvoicePlaceholderDto): Promise<BillingInvoicePlaceholderEntity> {
    return this.saasControlPlaneService.createBillingPlaceholder(dto);
  }

  @Get('billing/invoices')
  async listBilling(@Query('tenantId') tenantId: string): Promise<BillingInvoicePlaceholderEntity[]> {
    return this.saasControlPlaneService.listBilling(tenantId);
  }

  @Post('audit/impersonations')
  async auditImpersonation(@Body() dto: CreateSupportImpersonationAuditDto): Promise<SupportImpersonationAuditEntity> {
    return this.saasControlPlaneService.auditImpersonation(dto);
  }

  @Get('audit/impersonations')
  async listAudit(@Query('tenantId') tenantId: string): Promise<SupportImpersonationAuditEntity[]> {
    return this.saasControlPlaneService.listAudit(tenantId);
  }
}
