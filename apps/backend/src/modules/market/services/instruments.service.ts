/**
 * File:        apps/backend/src/modules/market/services/instruments.service.ts
 * Module:      market
 * Purpose:     Service for instrument discovery, management, and multi-provider support.
 *
 * Exports:
 *   - InstrumentsService — CRUD operations for instruments
 *   - listInstruments() — query with exchange/segment/provider/status filters
 *   - getBySymbol() — lookup by exchange + symbol
 *   - updateInstrument() — single instrument update
 *   - bulkUpdateInstruments() — bulk operations
 *
 * Depends on:
 *   - InstrumentEntity, InstrumentStatus, InstrumentSegment
 *   - ExchangeEntity
 *
 * Side-effects: DB writes for updates
 *
 * Key invariants:
 *   - symbol + exchangeCode form unique key
 *   - segment enables multi-segment filtering (EQ|FNO|COM|CDS|FX|CRYPTO|INDEX)
 *   - providerCode links to data provider for quotes
 *
 * Read order:
 *   1. listInstruments() — main query method with filters
 *   2. bulkUpdateInstruments() — batch operations
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import {
  InstrumentEntity,
  InstrumentStatus,
  InstrumentSegment,
  InstrumentType,
} from '../entities/instrument.entity';
import { ExchangeEntity } from '../entities/exchange.entity';
import { AppLoggerService } from '../../../shared/logger';
import { AppError } from '../../../common/errors/app-error';
import {
  AdminListInstrumentsQueryDto,
  UpdateInstrumentDto,
  BulkUpdateInstrumentDto,
} from '../dto/admin-instruments.dto';

export interface ListInstrumentsOptions extends Partial<AdminListInstrumentsQueryDto> {
  exchangeCode?: string;
  type?: string;
  segment?: InstrumentSegment;
  provider?: string;
  q?: string;
  status?: InstrumentStatus;
  limit?: number;
  offset?: number;
}

export interface BulkUpdateOptions extends Partial<BulkUpdateInstrumentDto> {
  symbols?: string[];
  exchangeCode?: string;
  segment?: InstrumentSegment;
  provider?: string;
}

@Injectable()
export class InstrumentsService {
  constructor(
    @InjectRepository(InstrumentEntity)
    private readonly instruments: Repository<InstrumentEntity>,
    @InjectRepository(ExchangeEntity)
    private readonly exchanges: Repository<ExchangeEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(InstrumentsService.name);
  }

  /**
   * List exchanges — for exchange selector UI
   */
  listExchanges(): Promise<ExchangeEntity[]> {
    this.logger.debug('listExchanges() called');
    return this.exchanges.find({ order: { code: 'ASC' } });
  }

  /**
   * List instruments with full filter support.
   * Supports exchange, segment, provider, status, type, and symbol search.
   */
  async listInstruments(options: ListInstrumentsOptions = {}): Promise<{
    instruments: InstrumentEntity[];
    total: number;
  }> {
    this.logger.debug('listInstruments() called', options);

    const {
      exchangeCode,
      type,
      segment,
      provider,
      q,
      status,
      limit = 50,
      offset = 0,
    } = options;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (exchangeCode) where.exchangeCode = exchangeCode;
    if (type) where.type = type;
    if (segment) where.segment = segment;
    if (provider) where.providerCode = provider;
    if (status) where.status = status;

    // Symbol search via OR on symbol or displayName (requires QueryBuilder for proper OR)
    let queryBuilder = this.instruments.createQueryBuilder('inst');

    if (exchangeCode) queryBuilder = queryBuilder.andWhere('inst.exchangeCode = :exchangeCode', { exchangeCode });
    if (type) queryBuilder = queryBuilder.andWhere('inst.type = :type', { type });
    if (segment) queryBuilder = queryBuilder.andWhere('inst.segment = :segment', { segment });
    if (provider) queryBuilder = queryBuilder.andWhere('inst.providerCode = :provider', { provider });
    if (status) queryBuilder = queryBuilder.andWhere('inst.status = :status', { status });

    if (q) {
      queryBuilder = queryBuilder.andWhere(
        '(inst.symbol ILIKE :q OR inst.displayName ILIKE :q)',
        { q: `%${q}%` }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const instruments = await queryBuilder
      .orderBy('inst.symbol', 'ASC')
      .skip(offset)
      .take(limit)
      .getMany();

    return { instruments, total };
  }

  /**
   * Legacy overload for simple filters (backward compatible)
   */
  listInstruments(filters: {
    exchangeCode?: string;
    type?: string;
    q?: string;
  }): Promise<InstrumentEntity[]> {
    return this.listInstruments(filters).then((r) => r.instruments);
  }

  /**
   * Get instrument by exchange + symbol
   */
  getBySymbol(
    exchangeCode: string,
    symbol: string,
  ): Promise<InstrumentEntity | null> {
    this.logger.debug('getBySymbol() called', { exchangeCode, symbol });
    return this.instruments.findOne({ where: { exchangeCode, symbol } });
  }

  /**
   * Get by internal ID
   */
  getById(id: string): Promise<InstrumentEntity | null> {
    this.logger.debug('getById() called', { id });
    return this.instruments.findOne({ where: { id } });
  }

  /**
   * List multiple instruments by IDs
   */
  listByIds(ids: string[]): Promise<InstrumentEntity[]> {
    this.logger.debug('listByIds() called', { count: ids.length });
    if (ids.length === 0) return Promise.resolve([]);
    return this.instruments.find({ where: { id: In(ids) } });
  }

  /**
   * Single instrument partial update.
   * Supports status, isTradingEnabled, spreadOverride, lotOverride, leverageOverride, maxPositionOverride.
   */
  async updateInstrument(
    id: string,
    attrs: UpdateInstrumentDto,
  ): Promise<InstrumentEntity> {
    this.logger.debug('updateInstrument() called', { id, attrs });
    const existing = await this.instruments.findOne({ where: { id } });
    if (!existing) {
      throw new AppError('RESOURCE_NOT_FOUND', `Instrument ${id} not found`);
    }

    // Merge updates
    const updated = this.instruments.create({
      ...existing,
      status: attrs.status ?? existing.status,
      isTradingEnabled: attrs.isTradingEnabled ?? existing.isTradingEnabled,
      spreadOverride: attrs.spreadOverride ?? existing.spreadOverride,
      lotOverride: attrs.lotOverride ?? existing.lotOverride,
      leverageOverride: attrs.leverageOverride ?? existing.leverageOverride,
      maxPositionOverride: attrs.maxPositionOverride ?? existing.maxPositionOverride,
    });

    return this.instruments.save(updated);
  }

  /**
   * Bulk update instruments matching filter criteria.
   * Returns count of updated records.
   */
  async bulkUpdateInstruments(
    attrs: UpdateInstrumentDto,
    filters: BulkUpdateOptions,
  ): Promise<number> {
    this.logger.debug('bulkUpdateInstruments() called', { attrs, filters });

    const { symbols, exchangeCode, segment, provider } = filters;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (exchangeCode) where.exchangeCode = exchangeCode;
    if (segment) where.segment = segment;
    if (provider) where.providerCode = provider;

    // Handle symbols array or comma-separated string
    if (symbols && symbols.length > 0) {
      where.symbol = In(symbols);
    }

    // If no filters at all, require explicit symbols
    if (!exchangeCode && !segment && !provider && (!symbols || symbols.length === 0)) {
      throw new AppError('VALIDATION_ERROR', 'At least one filter required: exchange, segment, provider, or symbols');
    }

    // Build update query
    const updateSet: Record<string, unknown> = {};
    if (attrs.status) updateSet.status = attrs.status;
    if (attrs.isTradingEnabled !== undefined) updateSet.isTradingEnabled = attrs.isTradingEnabled;
    if (attrs.spreadOverride !== undefined) updateSet.spreadOverride = attrs.spreadOverride;
    if (attrs.lotOverride !== undefined) updateSet.lotOverride = attrs.lotOverride;
    if (attrs.leverageOverride !== undefined) updateSet.leverageOverride = attrs.leverageOverride;
    if (attrs.maxPositionOverride !== undefined) updateSet.maxPositionOverride = attrs.maxPositionOverride;

    const result = await this.instruments.update(where, updateSet);
    this.logger.debug('bulkUpdateInstruments result', { affected: result.affected });

    return result.affected ?? 0;
  }

  /**
   * Get instrument counts by exchange and status — for dashboard stats
   */
  async getInstrumentStats(): Promise<
    Array<{
      exchangeCode: string;
      total: number;
      active: number;
      disabled: number;
      halted: number;
    }>
  > {
    this.logger.debug('getInstrumentStats() called');

    const exchanges = await this.exchanges.find();
    const stats: Array<{
      exchangeCode: string;
      total: number;
      active: number;
      disabled: number;
      halted: number;
    }> = [];

    for (const ex of exchanges) {
      const total = await this.instruments.count({ where: { exchangeCode: ex.code } });
      const active = await this.instruments.count({
        where: { exchangeCode: ex.code, status: InstrumentStatus.ACTIVE },
      });
      const disabled = await this.instruments.count({
        where: { exchangeCode: ex.code, status: InstrumentStatus.DISABLED },
      });
      const halted = await this.instruments.count({
        where: { exchangeCode: ex.code, status: InstrumentStatus.HALTED },
      });

      stats.push({ exchangeCode: ex.code, total, active, disabled, halted });
    }

    return stats;
  }
}
