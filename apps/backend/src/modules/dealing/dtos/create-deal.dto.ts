/**
 * @file src/modules/dealing/dtos/create-deal.dto.ts
 * @module dealing
 * @description DTO for deal creation
 * @author BharatERP
 * @created 2026-02-19
 */

import { IsIn, IsNumberString, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateDealDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsString()
  instrumentId!: string;

  @IsIn(['BUY', 'SELL', 'BUY_HEDGE', 'SELL_HEDGE'])
  side!: 'BUY' | 'SELL' | 'BUY_HEDGE' | 'SELL_HEDGE';

  @IsNumberString()
  quantity!: string;

  @IsNumberString()
  price!: string;

  @IsObject()
  metadata!: Record<string, unknown>;

  status?: string;
}
