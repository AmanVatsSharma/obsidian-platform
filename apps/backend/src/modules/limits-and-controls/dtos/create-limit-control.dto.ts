/**
 * @file src/modules/limits-and-controls/dtos/create-limit-control.dto.ts
 * @module limits-and-controls
 * @description DTOs for limit-control and exception queue operations
 * @author BharatERP
 * @created 2026-02-17
 */

import { IsBoolean, IsNotEmpty, IsObject, IsString, IsUUID, Matches } from 'class-validator';

export class CreateLimitControlDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  controlType!: string;

  @IsString()
  @IsNotEmpty()
  scopeType!: string;

  @IsString()
  @IsNotEmpty()
  scopeValue!: string;

  @Matches(/^\d+(\.\d+)?$/)
  threshold!: string;

  @IsBoolean()
  enabled!: boolean;
}

export class CreateLimitExceptionDto {
  @IsUUID()
  tenantId!: string;

  @IsUUID()
  limitControlId!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsObject()
  metadata!: Record<string, unknown>;
}
