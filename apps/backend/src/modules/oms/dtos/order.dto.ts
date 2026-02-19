/**
 * @file src/modules/oms/dtos/order.dto.ts
 * @module oms
 * @description DTOs for order placement and modification
 * @author BharatERP
 * @created 2025-09-19
 */

import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlaceOrderDto {
  @ApiProperty({ minLength: 1, maxLength: 64 })
  @IsString()
  @Length(1, 64)
  accountId!: string;

  @ApiProperty({ minLength: 1, maxLength: 64 })
  @IsString()
  @Length(1, 64)
  instrumentId!: string;

  @ApiProperty({ enum: ['BUY', 'SELL'] })
  @IsIn(['BUY', 'SELL'])
  side!: 'BUY' | 'SELL';

  @ApiProperty({ enum: ['MARKET', 'LIMIT'] })
  @IsIn(['MARKET', 'LIMIT'])
  type!: 'MARKET' | 'LIMIT';

  @ApiProperty({ pattern: '^\\d{1,20}(\\.\\d{1,8})?$' })
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  quantity!: string;

  @ApiPropertyOptional({ pattern: '^\\d{1,20}(\\.\\d{1,8})?$' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  price?: string;

  @ApiPropertyOptional({ minLength: 1, maxLength: 64 })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  clientOrderId?: string;

  @ApiProperty({ enum: ['DAY', 'IOC', 'GTC', 'FOK'], default: 'DAY' })
  @IsIn(['DAY', 'IOC', 'GTC', 'FOK'])
  timeInForce!: 'DAY' | 'IOC' | 'GTC' | 'FOK';

  @ApiProperty({ minLength: 1, maxLength: 128, description: 'Idempotency key for the order at tenant scope' })
  @IsString()
  @Length(1, 128)
  externalRefId!: string;
}

export class CancelOrderDto {
  @IsString()
  @Length(1, 64)
  orderId!: string;
}

export class ModifyOrderDto {
  @ApiProperty({ minLength: 1, maxLength: 64 })
  @IsString()
  @Length(1, 64)
  orderId!: string;

  @ApiPropertyOptional({ pattern: '^\\d{1,20}(\\.\\d{1,8})?$' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  price?: string;

  @ApiPropertyOptional({ pattern: '^\\d{1,20}(\\.\\d{1,8})?$' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  quantity?: string;

  @ApiPropertyOptional({ enum: ['DAY', 'IOC', 'GTC', 'FOK'] })
  @IsOptional()
  @IsIn(['DAY', 'IOC', 'GTC', 'FOK'])
  timeInForce?: 'DAY' | 'IOC' | 'GTC' | 'FOK';
}


