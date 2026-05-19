/**
 * File:        apps/backend/src/modules/rules-engine/dtos/rule.dto.ts
 * Module:      rules-engine
 * Purpose:     DTOs for rule CRUD endpoints.
 *
 * Exports:
 *   - CreateRuleDto   — create a new automation rule
 *   - UpdateRuleDto   — patch an existing rule
 *   - RuleConditionDto — individual condition in a rule
 *   - RuleActionDto   — individual action in a rule
 *
 * Depends on:  class-validator
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-16
 */

import { IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RuleConditionDto {
  @IsString()
  @IsNotEmpty()
  field!: string;

  @IsString()
  @IsNotEmpty()
  op!: string;

  @IsNotEmpty()
  value!: string | number;
}

export class RuleActionDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsObject()
  @IsOptional()
  params?: Record<string, string | number>;
}

export class CreateRuleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  triggerEvent!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions!: RuleConditionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleActionDto)
  actions!: RuleActionDto[];

  @IsInt()
  @IsOptional()
  priority?: number;
}

export class UpdateRuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  triggerEvent?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  @IsOptional()
  conditions?: RuleConditionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleActionDto)
  @IsOptional()
  actions?: RuleActionDto[];

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsInt()
  @IsOptional()
  priority?: number;
}
