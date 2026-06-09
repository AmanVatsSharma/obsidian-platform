/**
 * File:        apps/backend/src/modules/market/dto/admin-instruments.dto.ts
 * Module:      market
 * Purpose:     DTOs for the admin instruments REST endpoint — multi-filter support,
 *              segment filtering, provider filtering, and instrument patch.
 *
 * Exports:
 *   - AdminListInstrumentsQueryDto  — GET /admin/instruments query params
 *   - UpdateInstrumentDto           — PATCH /admin/instruments/:id body
 *   - BulkUpdateInstrumentDto      — bulk update by filter criteria
 *   - SyncInstrumentsDto           — trigger sync from data provider
 *
 * Depends on:
 *   - class-validator
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - status filter maps to InstrumentEntity.status (Active|Disabled|Halted|Archived)
 *   - segment supports segment-based user permissions (EQ|FNO|COM|CDS|FX|CRYPTO|INDEX)
 *   - provider filter enables multi-provider instrument catalogs
 *
 * Read order:
 *   1. AdminListInstrumentsQueryDto — query shape with all filters
 *   2. UpdateInstrumentDto          — single instrument update
 *   3. BulkUpdateInstrumentDto    — bulk operations
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

import { IsIn, IsOptional, IsString, IsNumber, IsArray, IsBoolean, MaxLength, Min, ValidateIf } from 'class-validator';

export const INSTRUMENT_STATUSES = ['Active', 'Disabled', 'Halted', 'Archived'] as const;
export const INSTRUMENT_SEGMENTS = ['EQ', 'FNO', 'COM', 'CDS', 'FX', 'CRYPTO', 'INDEX'] as const;
export const INSTRUMENT_TYPES = ['EQUITY', 'FUTURE', 'OPTION', 'ETF', 'FOREX', 'CRYPTO', 'INDEX'] as const;

export class AdminListInstrumentsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(16)
  exchange?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  type?: string; // Maps to InstrumentType

  @IsOptional()
  @IsString()
  @MaxLength(64)
  q?: string; // Symbol search

  @IsOptional()
  @IsIn(INSTRUMENT_STATUSES)
  status?: typeof INSTRUMENT_STATUSES[number];

  @IsOptional()
  @IsIn(INSTRUMENT_SEGMENTS)
  segment?: typeof INSTRUMENT_SEGMENTS[number];

  @IsOptional()
  @IsString()
  @MaxLength(32)
  provider?: string; // providerCode filter

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number; // Pagination limit

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number; // Pagination offset
}

export class UpdateInstrumentDto {
  @IsOptional()
  @IsIn(INSTRUMENT_STATUSES)
  status?: typeof INSTRUMENT_STATUSES[number];

  @IsOptional()
  @IsBoolean()
  isTradingEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  spreadOverride?: number;

  @IsOptional()
  @IsNumber()
  lotOverride?: number;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  leverageOverride?: string;

  @IsOptional()
  @IsNumber()
  maxPositionOverride?: number;
}

/**
 * Bulk update DTO — apply changes to instruments matching filter criteria
 */
export class BulkUpdateInstrumentDto {
  @IsOptional()
  @IsIn(INSTRUMENT_STATUSES)
  status?: typeof INSTRUMENT_STATUSES[number];

  @IsOptional()
  @IsBoolean()
  isTradingEnabled?: boolean;

  // Filter criteria — at least one required
  @ValidateIf((o) => !o.exchange && !o.segment && !o.provider)
  @IsString()
  @MaxLength(64)
  symbols?: string; // Comma-separated symbols

  @IsOptional()
  @IsString()
  @MaxLength(16)
  exchange?: string;

  @IsOptional()
  @IsIn(INSTRUMENT_SEGMENTS)
  segment?: typeof INSTRUMENT_SEGMENTS[number];

  @IsOptional()
  @IsString()
  @MaxLength(32)
  provider?: string;
}

/**
 * Trigger sync from data provider
 */
export class SyncInstrumentsDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  provider?: string; // If not specified, sync all providers

  @IsOptional()
  @IsString()
  @MaxLength(16)
  exchange?: string; // Filter to specific exchange

  @IsOptional()
  @IsIn(INSTRUMENT_SEGMENTS)
  segment?: typeof INSTRUMENT_SEGMENTS[number];
}