/**
 * File:        apps/backend/src/modules/oms/dtos/algo-order.dto.ts
 * Module:      oms · Algo Order DTOs
 * Purpose:     Input DTOs for TWAP / VWAP / ICEBERG algo order placement
 *
 * Exports:
 *   - PlaceAlgoOrderDto    — input for placeAlgoOrder endpoint
 *   - AlgoOrderType       — 'TWAP' | 'VWAP' | 'ICEBERG' (re-exported from type for convenience)
 *
 * Depends on:
 *   - class-validator    — @IsIn, @IsOptional, @IsString, @Length, @Matches, @Min, @ValidateIf
 *   - @nestjs/swagger   — ApiProperty decorators
 *   - @nestjs/graphql   — @Field, @InputType, registerEnumType
 *
 * Side-effects:  none
 * Key invariants:
 *   - TWAP / VWAP: type must be 'TWAP' or 'VWAP', price optional (MARKET if absent)
 *   - ICEBERG: type must be 'ICEBERG', price is required (iceberg visibility is sliceCount)
 *   - sliceCount must be >= 2 for TWAP/VWAP; >= 1 for ICEBERG
 *   - durationMinutes must be >= 1 and <= 1440 (max 24 h)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { IsIn, IsOptional, IsString, Length, Matches, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InputType, Field, registerEnumType } from '@nestjs/graphql';

/** Algo order types */
export type AlgoOrderType = 'TWAP' | 'VWAP' | 'ICEBERG';
export const AlgoOrderType = {
  TWAP: 'TWAP' as AlgoOrderType,
  VWAP: 'VWAP' as AlgoOrderType,
  ICEBERG: 'ICEBERG' as AlgoOrderType,
};
registerEnumType(AlgoOrderType as any, { name: 'AlgoOrderType' });

/**
 * Input DTO for placing an algo order (TWAP / VWAP / ICEBERG).
 *
 * TWAP  — Time-Weighted Average Price.  Splits totalQuantity into sliceCount equal
 *         slices dispatched at regular intervals (durationMinutes / sliceCount).
 *
 * VWAP  — Volume-Weighted Average Price.  Same slice structure as TWAP but child
 *         orders are submitted with a limit price derived from the algo meta.
 *
 * ICEBERG — Iceberg (hidden-size) order.  sliceCount = visible quantity per slice.
 *          The full remainingQty is hidden from the book; each slice reveals only
 *          `sliceCount` units.  Slices are dispatched as each visible fill completes.
 *
 * The type field in the parent order is set to the corresponding algo type so the
 * OMS order entity reflects it in type.
 */
@InputType()
export class PlaceAlgoOrderDto {
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

  /** Algo type — determines dispatch strategy */
  @Field(() => String)
  @ApiProperty({ enum: ['TWAP', 'VWAP', 'ICEBERG'] })
  @IsIn(['TWAP', 'VWAP', 'ICEBERG'])
  algoType!: AlgoOrderType;

  /** Total quantity for the full algo order */
  @Field(() => String)
  @ApiProperty({ pattern: '^\\d{1,20}(\\.\\d{1,8})?$', description: 'Total quantity' })
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  totalQuantity!: string;

  /**
   * Number of slices.
   * - TWAP / VWAP: minimum 2 (must split into at least 2 slices)
   * - ICEBERG: the visible quantity per slice (minimum 1)
   */
  @Field(() => Number)
  @ApiProperty({ description: 'Slice count: TWAP/VWAP = min 2; ICEBERG = visible qty (min 1)' })
  @Min(1)
  sliceCount!: number;

  /**
   * Total duration for the algo in minutes.
   * TWAP: slices dispatched at (durationMinutes / sliceCount) intervals.
   * VWAP: same interval structure.
   * ICEBERG: not used (slices fire on visible fill completion).
   */
  @Field(() => Number, { nullable: true })
  @ApiPropertyOptional({ description: 'Total duration in minutes (1–1440)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/)
  @Min(1)
  @Max(1440)
  durationMinutes?: number;

  /** Limit price — required for VWAP and ICEBERG, optional for TWAP (MARKET if absent) */
  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ pattern: '^\\d{1,20}(\\.\\d{1,8})?$', description: 'Limit price (required for VWAP / ICEBERG)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  priceLimit?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ minLength: 1, maxLength: 64 })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  clientOrderId?: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ enum: ['DAY', 'IOC', 'GTC', 'FOK'], default: 'DAY' })
  @IsOptional()
  @IsIn(['DAY', 'IOC', 'GTC', 'FOK'])
  timeInForce?: 'DAY' | 'IOC' | 'GTC' | 'FOK';

  @Field(() => String)
  @ApiProperty({ minLength: 1, maxLength: 128 })
  @IsString()
  @Length(1, 128)
  externalRefId!: string;
}