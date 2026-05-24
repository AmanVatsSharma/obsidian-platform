/**
 * File:        apps/backend/src/modules/oms/dtos/bracket-order.dto.ts
 * Module:      oms · Bracket Order DTOs
 * Purpose:     Input DTOs for bracket order (one-triggers-all) and trailing-stop orders
 *
 * Exports:
 *   - BracketConfigDto    — embedded take-profit + stop-loss leg configuration
 *   - PlaceBracketOrderDto — input for placeBracketOrder endpoint (extends PlaceOrderDto)
 *
 * Depends on:
 *   - class-validator  — @IsIn, @IsOptional, @IsString, @Length, @Matches, @ValidateIf
 *   - @nestjs/swagger  — ApiProperty decorators
 *   - @nestjs/graphql  — @Field, @InputType decorators
 *   - ../order.dto     — PlaceOrderDto (base fields)
 *
 * Side-effects:  none
 * Key invariants:
 *   - BUY: tpPrice > price (limit) AND slPrice < price (limit)
 *   - SELL: tpPrice < price (limit) AND slPrice > price (limit)
 *   - TRAILING_STOP: requires trailingDistance when tpPrice/slPrice absent
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { IsIn, IsOptional, IsString, Length, Matches, Validate, ValidatorConstraint, ValidationArguments } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InputType, Field, Float, registerEnumType } from '@nestjs/graphql';

/** Trigger condition for conditional orders (GTT / STOP / STOP_LIMIT) */
export type TriggerCondition = 'ABOVE' | 'BELOW';
export const TriggerCondition = {
  ABOVE: 'ABOVE' as const,
  BELOW: 'BELOW' as const,
};
registerEnumType(TriggerCondition as any, { name: 'TriggerCondition' });

/** Leg role for bracket order children */
export type BracketRole = 'TAKE_PROFIT' | 'STOP_LOSS';

/**
 * Validates that BUY: tpPrice > entryPrice AND slPrice < entryPrice,
 * and SELL: tpPrice < entryPrice AND slPrice > entryPrice,
 * and at least one of tpPrice/slPrice/trailingDistance/trailingPct is set.
 *
 * The parent PlaceBracketOrderDto exposes `price` (entry) and `side`.
 * BracketConfigDto is validated in context of its parent.
 */
@ValidatorConstraint({ name: 'bracketPriceConstraint', async: false })
export class BracketPriceConstraint {
  validate(_: unknown, args: ValidationArguments) {
    const obj = args.object as PlaceBracketOrderDto;
    if (!obj || obj.type !== 'BRACKET') return true; // let @IsIn('BRACKET') handle type check

    const { bracket } = obj;
    if (!bracket) return false;

    const entryPrice = Number(obj.price ?? 0);
    const tpPrice = bracket.tpPrice ? Number(bracket.tpPrice) : null;
    const slPrice = bracket.slPrice ? Number(bracket.slPrice) : null;
    const hasTrailing = bracket.trailingDistance != null || bracket.trailingPct != null;

    // At least one of TP/SL/trailing must be specified
    if (!hasTrailing && tpPrice === null && slPrice === null) {
      return false;
    }

    if (obj.side === 'BUY') {
      if (tpPrice !== null && tpPrice <= entryPrice) return false;
      if (slPrice !== null && slPrice >= entryPrice) return false;
    } else {
      // SELL
      if (tpPrice !== null && tpPrice >= entryPrice) return false;
      if (slPrice !== null && slPrice <= entryPrice) return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const obj = args.object as PlaceBracketOrderDto;
    const { bracket } = obj ?? {};
    if (!bracket) return 'Bracket config is required';
    if (!bracket.tpPrice && !bracket.slPrice && !bracket.trailingDistance && !bracket.trailingPct) {
      return 'Bracket must specify at least one of: tpPrice, slPrice, trailingDistance, trailingPct';
    }
    const entryPrice = Number(obj.price ?? 0);
    if (obj.side === 'BUY') {
      if (bracket.tpPrice && Number(bracket.tpPrice) <= entryPrice) {
        return `For BUY bracket, tpPrice (${bracket.tpPrice}) must be > entry price (${entryPrice})`;
      }
      if (bracket.slPrice && Number(bracket.slPrice) >= entryPrice) {
        return `For BUY bracket, slPrice (${bracket.slPrice}) must be < entry price (${entryPrice})`;
      }
    } else {
      if (bracket.tpPrice && Number(bracket.tpPrice) >= entryPrice) {
        return `For SELL bracket, tpPrice (${bracket.tpPrice}) must be < entry price (${entryPrice})`;
      }
      if (bracket.slPrice && Number(bracket.slPrice) <= entryPrice) {
        return `For SELL bracket, slPrice (${bracket.slPrice}) must be > entry price (${entryPrice})`;
      }
    }
    return 'Invalid bracket price configuration';
  }
}

/**
 * Embedded bracket leg configuration — used inside PlaceBracketOrderDto.
 * Supports both price-based (tpPrice/slPrice) and trailing-distance modes.
 */
@InputType()
export class BracketConfigDto {
  /** Take-profit limit price — validated against entryPrice by side */
  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({
    pattern: '^\\d{1,20}(\\.\\d{1,8})?$',
    description: 'Take-profit limit price',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  tpPrice?: string;

  /** Stop-loss limit price — validated against entryPrice by side */
  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({
    pattern: '^\\d{1,20}(\\.\\d{1,8})?$',
    description: 'Stop-loss limit price',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  slPrice?: string;

  /**
   * Trailing distance — absolute price offset from current market.
   * Required when tpPrice and slPrice are both absent (trailing-stop mode).
   */
  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({
    pattern: '^\\d{1,20}(\\.\\d{1,8})?$',
    description: 'Trailing distance (absolute price offset)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  trailingDistance?: string;

  /**
   * Trailing distance — percentage of entry price.
   * Mutually exclusive with trailingDistance (absolute).
   */
  @Field(() => Float, { nullable: true })
  @ApiPropertyOptional({ description: 'Trailing distance as percentage of entry price' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  trailingPct?: string;

  /**
   * Trigger condition — determines how triggerPrice comparison is evaluated.
   * ABOVE = activate when market >= triggerPrice; BELOW = when market <= triggerPrice.
   */
  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ enum: ['ABOVE', 'BELOW'], description: 'Trigger condition' })
  @IsOptional()
  @IsIn(['ABOVE', 'BELOW'])
  triggerCondition?: TriggerCondition;

  /**
   * Trigger price — optional price at which the bracket leg activates.
   * Used for GTT / conditional bracket legs.
   */
  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({
    pattern: '^\\d{1,20}(\\.\\d{1,8})?$',
    description: 'Trigger price for conditional activation',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,20}(\.\d{1,8})?$/)
  triggerPrice?: string;
}

/**
 * Bracket order input — standalone InputType with all fields (does NOT extend PlaceOrderDto
 * because 'BRACKET' is not in PlaceOrderDto.type).  The primary is placed first; TP/SL legs
 * are created by the OMS service once the primary fills (or immediately for internal fills).
 *
 * Validation is enforced by BracketPriceConstraint and by OMS service-level guards at place time.
 */
@InputType()
export class PlaceBracketOrderDto {
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

  /** Must be 'BRACKET' — TP/SL legs are defined in bracket config */
  @Field(() => String)
  @ApiProperty({ enum: ['BRACKET'] })
  @IsIn(['BRACKET'])
  type!: 'BRACKET';

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

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ minLength: 1, maxLength: 64 })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  clientOrderId?: string;

  @Field(() => String)
  @ApiProperty({ minLength: 1, maxLength: 128 })
  @IsString()
  @Length(1, 128)
  externalRefId!: string;

  @Field(() => String, { nullable: true })
  @ApiPropertyOptional({ enum: ['DAY', 'IOC', 'GTC', 'FOK'], default: 'DAY' })
  @IsOptional()
  @IsIn(['DAY', 'IOC', 'GTC', 'FOK'])
  timeInForce?: 'DAY' | 'IOC' | 'GTC' | 'FOK';

  /** Bracket legs — take-profit and stop-loss configuration */
  @Field(() => BracketConfigDto)
  @ApiProperty({ type: () => BracketConfigDto, description: 'Bracket legs (TP + SL)' })
  @Validate(BracketPriceConstraint)
  bracket!: BracketConfigDto;
}