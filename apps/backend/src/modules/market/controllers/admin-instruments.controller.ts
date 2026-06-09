/**
 * File:        apps/backend/src/modules/market/controllers/admin-instruments.controller.ts
 * Module:      market
 * Purpose:     Platform-admin endpoints for instrument management — multi-filter
 *              listing, single/bulk updates, stats, and sync triggers.
 *
 * Exports:
 *   - AdminInstrumentsController — @Controller('admin/instruments')
 *       GET    /admin/instruments      — list with exchange/segment/provider/status filters
 *       GET    /admin/instruments/stats — instrument counts by exchange
 *       PATCH  /admin/instruments/:id    — update single instrument
 *       PATCH  /admin/instruments/bulk  — bulk update by filter criteria
 *
 * Depends on:
 *   - InstrumentsService         — CRUD operations
 *   - JwtAuthGuard, TenantGuard, RolesGuard — auth
 *
 * Side-effects: DB writes via InstrumentsService.updateInstrument/bulkUpdateInstruments
 *
 * Key invariants:
 *   - segment filter enables multi-segment permissions (EQ|FNO|COM|CDS|FX|CRYPTO|INDEX)
 *   - provider filter enables multi-provider instrument catalogs
 *   - bulk operations impact all matching instruments
 *
 * Read order:
 *   1. listInstruments() — admin query with all filters
 *   2. updateInstrument() — single instrument update
 *   3. bulkUpdateInstruments() — batch operations
 *   4. getInstrumentStats() — dashboard counts
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  AdminListInstrumentsQueryDto,
  UpdateInstrumentDto,
  BulkUpdateInstrumentDto,
  SyncInstrumentsDto,
} from '../dto/admin-instruments.dto';
import { InstrumentsService } from '../services/instruments.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../rbac/guards/tenant.guard';
import { RolesGuard } from '../../rbac/guards/roles.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';
import { AppLoggerService } from '../../../shared/logger';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('admin')
@ApiTags('Admin Instruments')
@ApiBearerAuth('JWT')
@Controller('admin/instruments')
export class AdminInstrumentsController {
  constructor(
    private readonly svc: InstrumentsService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(AdminInstrumentsController.name);
  }

  @Get()
  @ApiOperation({
    summary: 'List instruments with filters',
    description: 'Supports exchange, segment, provider, status, type filters + pagination',
  })
  @ApiQuery({ name: 'exchange', required: false, example: 'NSE' })
  @ApiQuery({ name: 'segment', required: false, example: 'EQ' })
  @ApiQuery({ name: 'provider', required: false, example: 'KITE' })
  @ApiQuery({ name: 'status', required: false, example: 'Active' })
  @ApiQuery({ name: 'type', required: false, example: 'EQUITY' })
  @ApiQuery({ name: 'q', required: false, example: 'RELI' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiResponse({ status: 200, description: 'Instruments list with pagination' })
  async listInstruments(@Query() query: AdminListInstrumentsQueryDto) {
    this.logger.debug('GET /admin/instruments', query as any);
    return this.svc.listInstruments({
      exchangeCode: query.exchange,
      type: query.type,
      segment: query.segment,
      provider: query.provider,
      q: query.q,
      status: query.status,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get instrument counts by exchange' })
  @ApiResponse({ status: 200, description: 'Stats by exchange' })
  async getInstrumentStats() {
    this.logger.debug('GET /admin/instruments/stats');
    return this.svc.getInstrumentStats();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update single instrument parameters' })
  @ApiParam({ name: 'id', example: 'instrument-uuid' })
  @ApiResponse({ status: 200, description: 'Instrument updated' })
  async updateInstrument(
    @Param('id') id: string,
    @Body() dto: UpdateInstrumentDto,
  ) {
    this.logger.debug('PATCH /admin/instruments/:id', { id, dto });
    return this.svc.updateInstrument(id, dto);
  }

  @Patch('bulk')
  @ApiOperation({
    summary: 'Bulk update instruments by filter criteria',
    description: 'Update all instruments matching exchange/segment/provider/symbols filter',
  })
  @ApiBody({ type: BulkUpdateInstrumentDto })
  @ApiResponse({ status: 200, description: 'Count of updated instruments' })
  async bulkUpdateInstruments(@Body() dto: BulkUpdateInstrumentDto) {
    this.logger.debug('PATCH /admin/instruments/bulk', dto as any);

    // Parse symbols if provided as comma-separated string
    const symbols = dto.symbols
      ? dto.symbols.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const attrs: UpdateInstrumentDto = {
      status: dto.status,
      isTradingEnabled: dto.isTradingEnabled,
      spreadOverride: dto.spreadOverride,
      lotOverride: dto.lotOverride,
      leverageOverride: dto.leverageOverride,
      maxPositionOverride: dto.maxPositionOverride,
    };

    const filters = {
      symbols,
      exchangeCode: dto.exchange,
      segment: dto.segment,
      provider: dto.provider,
    };

    const count = await this.svc.bulkUpdateInstruments(attrs, filters);
    return { updated: count };
  }

  @Post('sync')
  @ApiOperation({
    summary: 'Trigger instrument sync from data provider',
    description: 'Sync instruments from provider API (Kite, Alpaca, etc.)',
  })
  @ApiResponse({ status: 202, description: 'Sync triggered' })
  async syncInstruments(@Body() dto: SyncInstrumentsDto) {
    this.logger.debug('POST /admin/instruments/sync', dto as any);
    // TODO: Implement actual provider sync - wire up to data-provider adapters
    return { status: 'not_implemented', message: 'Provider sync endpoint pending implementation' };
  }
}