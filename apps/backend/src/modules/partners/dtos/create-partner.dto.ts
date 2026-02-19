/**
 * @file src/modules/partners/dtos/create-partner.dto.ts
 * @module partners
 * @description DTO for partner creation
 * @author BharatERP
 * @created 2026-02-19
 */

import { IsEmail, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePartnerDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  @MaxLength(128)
  name!: string;

  @IsString()
  @MaxLength(64)
  code!: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsObject()
  metadata!: Record<string, unknown>;
}
