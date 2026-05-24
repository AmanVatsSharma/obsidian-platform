/**
 * File:        apps/backend/src/modules/oms/dtos/order.dto.ts
 * Module:      oms · Order DTOs
 * Purpose:     Input DTOs for place, cancel, and modify order operations
 *
 * Exports:
 *   - PlaceOrderDto    — input for placeOrder mutation
 *   - CancelOrderDto   — input for cancelOrder mutation
 *   - ModifyOrderDto  — input for modifyOrder mutation
 *
 * Depends on:
 *   - class-validator  — @IsIn, @IsOptional, @IsString, @Length, @Matches
 *   - @nestjs/swagger   — ApiProperty decorators
 *   - @nestjs/graphql   — @Field, @InputType decorators
 *
 * Side-effects:  none
 * Key invariants:
 *   - externalRefId is required and must be unique per tenant (idempotency key)
 *   - price is required when type = 'LIMIT'
 *   - slPrice < price when side = 'BUY'; slPrice > price when side = 'SELL'
 *   - tpPrice > price when side = 'BUY'; tpPrice < price when side = 'SELL'
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class PlaceOrderDto {
  @Field(() => String)
  @ApiProperty({ minLength: 1, maxLength: 64 })
  @IsString()
  @Length(1, 64)
  accountId!: string;

  @Field(() => String)
  @ApiProperty({ minLength: 1, maxLength: 64 })
  @IsString()
  @Length(1, 64)
  instrumentId!: string;

  @Field(() => String)
  @ApiProperty({ enum: ['BUY', 'SELL'] })
  @IsIn(['BUY', 'SELL'])
  side!: 'BUY' | 'SELL';

  @Field(() => String)
  @ApiProperty({ enum: ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'GTT', 'TRAILING_STOP'] })
  @IsIn(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT', 'GTT', 'TRAILING_STOP'])
  type!: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'GTT' | 'TRAILING_STOP';

  @Field(() => String)
  @ApiProperty({ pattern: '^\\d{1,20}(\\.\\d{1,8})?$' })
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  quantity!: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ pattern: '^\\d{1,20}(\\.\\d{1,8})?$' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  price?: string;

  /** Stop-loss price — optional, validated by OMS service */
  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ pattern: '^\\d{1,20}(\\.\\d{1,8})?$', description: 'Stop-loss price' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  slPrice?: string;

  /** Take-profit price — optional, validated by OMS service */
  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ pattern: '^\\d{1,20}(\\.\\d{1,8})?$', description: 'Take-profit price' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  tpPrice?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ minLength: 1, maxLength: 64 })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  clientOrderId?: string;

  @Field(() => String)
  @ApiProperty({ enum: ['DAY', 'IOC', 'GTC', 'FOK'], default: 'DAY' })
  @IsIn(['DAY', 'IOC', 'GTC', 'FOK'])
  timeInForce!: 'DAY' | 'IOC' | 'GTC' | 'FOK';

  @Field(() => String)
  @ApiProperty({ minLength: 1, maxLength: 128, description: 'Idempotency key for the order at tenant scope' })
  @IsString()
  @Length(1, 128)
  externalRefId!: string;
}

@InputType()
export class CancelOrderDto {
  @Field(() => String)
  @IsString()
  @Length(1, 64)
  orderId!: string;
}

@InputType()
export class ModifyOrderDto {
  @Field(() => String)
  @ApiProperty({ minLength: 1, maxLength: 64 })
  @IsString()
  @Length(1, 64)
  orderId!: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ pattern: '^\\d{1,20}(\\.\\d{1,8})?$' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  price?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ pattern: '^\\d{1,20}(\\.\\d{1,8})?$' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  quantity?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ enum: ['DAY', 'IOC', 'GTC', 'FOK'] })
  @IsOptional()
  @IsIn(['DAY', 'IOC', 'GTC', 'FOK'])
  timeInForce?: 'DAY' | 'IOC' | 'GTC' | 'FOK';

  /** Stop-loss price */
  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ pattern: '^\\d{1,20}(\\.\\d{1,8})?$', description: 'Stop-loss price' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  slPrice?: string;

  /** Take-profit price */
  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ pattern: '^\\d{1,20}(\\.\\d{1,8})?$', description: 'Take-profit price' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  tpPrice?: string;
}