/**
 * File:        apps/backend/src/modules/accounts/services/strategy-position.service.ts
 * Module:      accounts
 * Purpose:     Repository-style service for StrategyPositionEntity — fetches and
 *              aggregates per-account option/equity positions used by risk-engine
 *              for Greeks computation, exposure tracking, and auto-liquidation.
 *
 * Exports:
 *   - StrategyPositionService                              — injectable
 *   - StrategyPositionService.getPositionsByAccount(id)   — all positions for account
 *   - StrategyPositionService.getPosition(id)             — single position by id
 *   - StrategyPositionService.upsertPosition(dto)         — create or update a position
 *
 * Depends on:
 *   - @/modules/accounts/entities/strategy-position.entity — StrategyPositionEntity
 *   - @/shared/logger                                      — AppLoggerService
 *
 * Side-effects:
 *   - DB reads (select) / DB writes (upsert)
 *
 * Key invariants:
 *   - Always tenant-scoped via getRequestContext
 *   - Instrument IDs are UUIDs (foreign key into market.instruments)
 *
 * Read order:
 *   1. getPositionsByAccount()  — primary query
 *   2. upsertPosition()         — write path
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from '../../../shared/logger';
import { getRequestContext } from '../../../shared/request-context';
import { StrategyPositionEntity, BookTypeEnum } from '../entities/strategy-position.entity';

export interface PositionSummary {
  accountId: string;
  instrumentId: string | null;
  netQuantity: number;
  averagePrice: number;
  unrealizedPnl: number;
  delta: number;
  gamma: number;
  strategyType: string;
}

/** DTO for upserting a strategy position */
export interface UpsertPositionDto {
  accountId: string;
  instrumentId?: string | null;
  strategyType?: string;
  netQuantity: number;
  averagePrice: number;
  unrealizedPnl?: number;
  realizedPnl?: number;
  delta?: number;
  gamma?: number;
  bookType?: 'A' | 'B';
}

@Injectable()
export class StrategyPositionService {
  constructor(
    @InjectRepository(StrategyPositionEntity)
    private readonly positions: Repository<StrategyPositionEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(StrategyPositionService.name);
  }

  /**
   * Returns all strategy positions for an account (tenant-scoped).
   */
  async getPositionsByAccount(accountId: string): Promise<PositionSummary[]> {
    const ctx = getRequestContext();
    this.logger.debug('getPositionsByAccount()', { accountId, tenantId: ctx?.tenantId });

    const rows = await this.positions.find({
      where: { tenantId: ctx?.tenantId ?? '', accountId },
    });

    return rows.map((row) => ({
      accountId: row.accountId,
      instrumentId: row.instrumentId ?? '',
      netQuantity: Number(row.netQuantity),
      averagePrice: Number(row.averagePrice),
      unrealizedPnl: Number(row.unrealizedPnl),
      delta: Number(row.delta),
      gamma: Number(row.gamma),
      strategyType: row.strategyType,
    }));
  }

  /**
   * Returns a single position by its ID.
   */
  async getPosition(id: string): Promise<StrategyPositionEntity | null> {
    return this.positions.findOne({ where: { id } });
  }

  /**
   * Creates or updates a strategy position.
   * Matching is done on accountId + instrumentId (+ optional bookType).
   */
  async upsertPosition(dto: UpsertPositionDto): Promise<StrategyPositionEntity> {
    const ctx = getRequestContext();
    this.logger.debug('upsertPosition:start', dto);

    const existing = await this.positions.findOne({
      where: {
        tenantId: ctx?.tenantId ?? '',
        accountId: dto.accountId,
        instrumentId: dto.instrumentId ?? null,
      },
    });

    if (existing) {
      existing.netQuantity = String(dto.netQuantity);
      existing.averagePrice = String(dto.averagePrice);
      if (dto.unrealizedPnl !== undefined) existing.unrealizedPnl = String(dto.unrealizedPnl);
      if (dto.realizedPnl !== undefined) existing.realizedPnl = String(dto.realizedPnl);
      if (dto.delta !== undefined) existing.delta = String(dto.delta);
      if (dto.gamma !== undefined) existing.gamma = String(dto.gamma);
      if (dto.strategyType) existing.strategyType = dto.strategyType as any;
      if (dto.bookType) existing.bookType = dto.bookType as BookTypeEnum;
      const saved = await this.positions.save(existing);
      this.logger.debug('upsertPosition:updated', { id: saved.id });
      return saved;
    }

    const newEntity = this.positions.create({
      tenantId: ctx?.tenantId ?? '',
      accountId: dto.accountId,
      instrumentId: dto.instrumentId ?? null,
      netQuantity: String(dto.netQuantity),
      averagePrice: String(dto.averagePrice),
      unrealizedPnl: String(dto.unrealizedPnl ?? 0),
      realizedPnl: String(dto.realizedPnl ?? 0),
      delta: String(dto.delta ?? 0),
      gamma: String(dto.gamma ?? 0),
      strategyType: (dto.strategyType ?? 'SINGLE') as any,
      bookType: (dto.bookType ?? 'A') as BookTypeEnum,
    });

    const saved = await this.positions.save(newEntity);
    this.logger.debug('upsertPosition:created', { id: saved.id });
    return saved;
  }
}