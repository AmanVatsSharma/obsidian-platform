/**
 * @file src/modules/compliance/dtos/upsert-compliance-policy.dto.ts
 * @module compliance
 * @description DTO for tenant compliance policy upsert requests
 * @author BharatERP
 * @created 2026-02-17
 */

import { IsIn, IsInt, IsNotEmpty, IsObject, IsString, IsUUID, Min } from 'class-validator';

export class UpsertCompliancePolicyDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  jurisdictionCode!: string;

  @IsString()
  @IsIn(['BASIC', 'ENHANCED', 'INSTITUTIONAL'])
  kycTier!: 'BASIC' | 'ENHANCED' | 'INSTITUTIONAL';

  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  amlRiskLevel!: 'LOW' | 'MEDIUM' | 'HIGH';

  @IsString()
  @IsNotEmpty()
  sanctionsProvider!: string;

  @IsObject()
  suitabilityRules!: Record<string, unknown>;

  @IsInt()
  @Min(365)
  auditRetentionDays!: number;
}
