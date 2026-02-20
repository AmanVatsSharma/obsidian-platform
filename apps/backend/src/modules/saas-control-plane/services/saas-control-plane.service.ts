/**
 * @file src/modules/saas-control-plane/services/saas-control-plane.service.ts
 * @module saas-control-plane
 * @description Service scaffold for platform-owner governance operations
 * @author BharatERP
 * @created 2026-02-17
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from '../../../shared/logger';
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

@Injectable()
export class SaasControlPlaneService {
  constructor(
    @InjectRepository(TenantProvisioningEntity)
    private readonly provisioningRepo: Repository<TenantProvisioningEntity>,
    @InjectRepository(EntitlementPlanEntity)
    private readonly entitlementRepo: Repository<EntitlementPlanEntity>,
    @InjectRepository(BillingInvoicePlaceholderEntity)
    private readonly billingRepo: Repository<BillingInvoicePlaceholderEntity>,
    @InjectRepository(SupportImpersonationAuditEntity)
    private readonly auditRepo: Repository<SupportImpersonationAuditEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(SaasControlPlaneService.name);
  }

  async createProvisioning(dto: CreateTenantProvisioningDto): Promise<TenantProvisioningEntity> {
    this.logger.debug('createProvisioning:start', dto);
    const saved = await this.provisioningRepo.save(this.provisioningRepo.create(dto));
    this.logger.debug('createProvisioning:end', { provisioningId: saved.id });
    return saved;
  }

  async upsertEntitlements(dto: UpsertEntitlementPlanDto): Promise<EntitlementPlanEntity> {
    this.logger.debug('upsertEntitlements:start', dto);
    const existing = await this.entitlementRepo.findOne({ where: { tenantId: dto.tenantId } });
    const saved = await this.entitlementRepo.save(this.entitlementRepo.create({ ...(existing ?? {}), ...dto }));
    this.logger.debug('upsertEntitlements:end', { entitlementId: saved.id });
    return saved;
  }

  async createBillingPlaceholder(
    dto: CreateBillingInvoicePlaceholderDto,
  ): Promise<BillingInvoicePlaceholderEntity> {
    this.logger.debug('createBillingPlaceholder:start', dto);
    const saved = await this.billingRepo.save(this.billingRepo.create(dto));
    this.logger.debug('createBillingPlaceholder:end', { invoicePlaceholderId: saved.id });
    return saved;
  }

  async auditImpersonation(
    dto: CreateSupportImpersonationAuditDto,
  ): Promise<SupportImpersonationAuditEntity> {
    this.logger.debug('auditImpersonation:start', dto);
    const saved = await this.auditRepo.save(this.auditRepo.create(dto));
    this.logger.debug('auditImpersonation:end', { auditId: saved.id });
    return saved;
  }

  async listProvisioning(tenantId: string): Promise<TenantProvisioningEntity[]> {
    return this.provisioningRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async listEntitlements(tenantId: string): Promise<EntitlementPlanEntity[]> {
    return this.entitlementRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async listBilling(tenantId: string): Promise<BillingInvoicePlaceholderEntity[]> {
    return this.billingRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async listAudit(tenantId: string): Promise<SupportImpersonationAuditEntity[]> {
    return this.auditRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }
}
