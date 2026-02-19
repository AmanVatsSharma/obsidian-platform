/**
 * @file src/modules/dealing/dtos/create-deal.dto.ts
 * @module dealing
 * @description DTO for deal creation
 * @author BharatERP
 * @created 2026-02-19
 */

import { IsIn, IsNumberString, IsObject, IsString, IsUUID } from 'class-validator';

export class CreateDealDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  instrumentId!: string;

  @IsIn(['BUY', 'SELL'])
  side!: 'BUY' | 'SELL';

  @IsNumberString()
  quantity!: string;

  @IsNumberString()
  price!: string;

  @IsObject()
  metadata!: Record<string, unknown>;
}
