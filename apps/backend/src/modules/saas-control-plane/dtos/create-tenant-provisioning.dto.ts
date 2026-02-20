/**
 * @file src/modules/saas-control-plane/dtos/create-tenant-provisioning.dto.ts
 * @module saas-control-plane
 * @description DTOs for control-plane provisioning, entitlement, billing, and audit APIs
 * @author BharatERP
 * @created 2026-02-17
 */

import { IsNotEmpty, IsObject, IsString, IsUUID, Matches } from 'class-validator';

export class CreateTenantProvisioningDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  requestedBy!: string;

  @IsObject()
  resources!: Record<string, unknown>;
}

export class UpsertEntitlementPlanDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  planCode!: string;

  @IsObject()
  entitlements!: Record<string, unknown>;

  @IsObject()
  featureFlags!: Record<string, boolean>;
}

export class CreateBillingInvoicePlaceholderDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  invoiceNumber!: string;

  @Matches(/^\d+(\.\d+)?$/)
  amount!: string;

  @IsString()
  @IsNotEmpty()
  currency!: string;
}

export class CreateSupportImpersonationAuditDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  actorUserId!: string;

  @IsString()
  @IsNotEmpty()
  targetUserId!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsString()
  @IsNotEmpty()
  action!: string;
}
