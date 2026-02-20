/**
 * @file src/modules/support/dtos/create-support-ticket.dto.ts
 * @module support
 * @description DTO for support ticket creation
 * @author BharatERP
 * @created 2026-02-19
 */

import { IsIn, IsObject, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSupportTicketDto {
  @IsUUID()
  tenantId!: string;

  @IsUUID()
  userId!: string;

  @IsString()
  @MaxLength(256)
  subject!: string;

  @IsString()
  description!: string;

  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  priority!: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @IsObject()
  metadata!: Record<string, unknown>;
}
