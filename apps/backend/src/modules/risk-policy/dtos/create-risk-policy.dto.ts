/**
 * @file src/modules/risk-policy/dtos/create-risk-policy.dto.ts
 * @module risk-policy
 * @description DTOs for risk policy creation and tenant assignment
 * @author BharatERP
 * @created 2026-02-17
 */

import { IsArray, IsBoolean, IsIn, IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';

export class CreateRiskPolicyDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  jurisdictionCode!: string;

  @IsString()
  @IsNotEmpty()
  policyName!: string;

  @Matches(/^\d+(\.\d+)?$/)
  maxLeverage!: string;

  @Matches(/^\d+(\.\d+)?$/)
  maxOrderNotional!: string;

  @IsArray()
  restrictedProducts!: string[];

  @IsBoolean()
  sanctionsCheckRequired!: boolean;
}

export class AssignRiskPolicyDto {
  @IsUUID()
  tenantId!: string;

  @IsUUID()
  riskPolicyId!: string;

  @IsIn(['TENANT', 'BROKER', 'DESK', 'ACCOUNT'])
  scopeType!: 'TENANT' | 'BROKER' | 'DESK' | 'ACCOUNT';

  @IsString()
  @IsNotEmpty()
  scopeValue!: string;
}
