/**
 * File:        apps/backend/src/modules/market/services/segment-access.service.ts
 * Module:      market · Segment Access Control
 * Purpose:     Control user access to market segments and instruments.
 *              Admin can configure which segments/instruments are available to which user groups.
 *
 * Exports:
 *   - SegmentAccessService — getUserSegments, canUserAccessInstrument, etc.
 *
 * Depends on:
 *   - UserSegmentAccessEntity — user ↔ segment mapping
 *   - InstrumentEntity — instrument master
 *   - rbac module — user roles
 *
 * Side-effects:
 *   - Read-only for most operations
 *   - Write via admin endpoints
 *
 * Key invariants:
 *   - Default: user has no segment access (explicit grants required)
 *   - Admin: always has all segment access
 *   - Compliance: KYC users get EQUITY + COM access by default
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AppLoggerService } from '../../../shared/logger';
import { AppError } from '../../../common/errors/app-error';
import { UserSegmentAccessEntity } from '../entities/user-segment-access.entity';
import { InstrumentEntity, InstrumentSegment, InstrumentType } from '../entities/instrument.entity';
import { InstrumentSegment as SegmentEnum } from '../entities/instrument.entity';

export interface SegmentAccessInfo {
  segment: InstrumentSegment;
  isEnabled: boolean;
  allowedTypes: InstrumentType[];
  maxOrderValue: number | null;
  maxOpenPositions: number | null;
  maxDailyTrades: number | null;
}

@Injectable()
export class SegmentAccessService {
  constructor(
    private readonly logger: AppLoggerService,
    @InjectRepository(UserSegmentAccessEntity)
    private readonly userAccess: Repository<UserSegmentAccessEntity>,
    @InjectRepository(InstrumentEntity)
    private readonly instruments: Repository<InstrumentEntity>,
  ) {
    this.logger.setContext(SegmentAccessService.name);
  }

  /**
   * Get all segments accessible to a user.
   * Admin role: returns all segments with full access.
   */
  async getUserSegments(userId: string, role: string): Promise<SegmentAccessInfo[]> {
    // Admin sees everything
    if (role === 'admin') {
      return [
        { segment: InstrumentSegment.EQ, isEnabled: true, allowedTypes: [InstrumentType.EQUITY], maxOrderValue: null, maxOpenPositions: null, maxDailyTrades: null },
        { segment: InstrumentSegment.FNO, isEnabled: true, allowedTypes: [InstrumentType.FUTURE, InstrumentType.OPTION], maxOrderValue: null, maxOpenPositions: null, maxDailyTrades: null },
        { segment: InstrumentSegment.COM, isEnabled: true, allowedTypes: [InstrumentType.FUTURE, InstrumentType.OPTION], maxOrderValue: null, maxOpenPositions: null, maxDailyTrades: null },
        { segment: InstrumentSegment.CDS, isEnabled: true, allowedTypes: [InstrumentType.FUTURE, InstrumentType.OPTION], maxOrderValue: null, maxOpenPositions: null, maxDailyTrades: null },
      ];
    }

    const access = await this.userAccess.find({
      where: { userId, isEnabled: true },
    });

    return access.map(a => ({
      segment: a.segment as InstrumentSegment,
      isEnabled: a.isEnabled,
      allowedTypes: this.parseTypes(a.allowedTypes),
      maxOrderValue: a.maxOrderValue,
      maxOpenPositions: a.maxOpenPositions,
      maxDailyTrades: a.maxDailyTrades,
    }));
  }

  /**
   * Check if user can access a specific instrument.
   * Checks both segment access and instrument-level restrictions.
   */
  async canUserAccessInstrument(
    userId: string,
    role: string,
    instrumentId: string,
  ): Promise<boolean> {
    // Admin can access everything
    if (role === 'admin') return true;

    const instrument = await this.instruments.findOne({ where: { id: instrumentId } });
    if (!instrument) {
      throw new AppError('INSTRUMENT_NOT_FOUND', 'Instrument not found');
    }

    if (instrument.status !== 'ACTIVE' || !instrument.isTradingEnabled) {
      return false;
    }

    const access = await this.userAccess.findOne({
      where: { userId, segment: instrument.segment, isEnabled: true },
    });

    if (!access) return false;

    // Check instrument-type restrictions
    if (access.allowedTypes && access.allowedTypes.length > 0) {
      const types = this.parseTypes(access.allowedTypes);
      if (!types.includes(instrument.type)) {
        return false;
      }
    }

    // Check blacklisted instruments
    if (access.blockedInstrumentIds) {
      const blocked = this.parseList(access.blockedInstrumentIds);
      if (blocked.includes(instrumentId)) return false;
    }

    return true;
  }

  /**
   * Validate a proposed order against user's segment access.
   * Returns true if allowed, throws AppError if not.
   */
  async validateOrderAccess(
    userId: string,
    role: string,
    instrumentId: string,
    orderValue: number,
  ): Promise<void> {
    if (role === 'admin') return;

    const hasAccess = await this.canUserAccessInstrument(userId, role, instrumentId);
    if (!hasAccess) {
      throw new AppError('INSTRUMENT_ACCESS_DENIED', 'You do not have access to this segment/instrument');
    }

    const instrument = await this.instruments.findOne({ where: { id: instrumentId } });
    if (!instrument) {
      throw new AppError('INSTRUMENT_NOT_FOUND', 'Instrument not found');
    }

    const access = await this.userAccess.findOne({
      where: { userId, segment: instrument.segment, isEnabled: true },
    });
    if (!access) return;

    if (access.maxOrderValue && orderValue > access.maxOrderValue) {
      throw new AppError(
        'ORDER_VALUE_EXCEEDS_LIMIT',
        `Order value ${orderValue} exceeds your limit of ${access.maxOrderValue}`,
      );
    }
  }

  /**
   * Admin: Grant segment access to a user.
   */
  async grantSegmentAccess(
    userId: string,
    segment: InstrumentSegment,
    options: {
      allowedTypes?: InstrumentType[];
      maxOrderValue?: number;
      maxOpenPositions?: number;
      maxDailyTrades?: number;
      grantedBy: string;
    },
  ): Promise<UserSegmentAccessEntity> {
    let access = await this.userAccess.findOne({
      where: { userId, segment },
    });

    if (!access) {
      access = this.userAccess.create({
        userId,
        segment,
        grantedBy: options.grantedBy,
        grantedAt: new Date(),
      });
    }

    access.isEnabled = true;
    access.allowedTypes = options.allowedTypes?.join(',') ?? '';
    access.maxOrderValue = options.maxOrderValue;
    access.maxOpenPositions = options.maxOpenPositions;
    access.maxDailyTrades = options.maxDailyTrades;
    access.grantedBy = options.grantedBy;
    access.grantedAt = new Date();

    return this.userAccess.save(access);
  }

  /**
   * Admin: Revoke segment access from a user.
   */
  async revokeSegmentAccess(userId: string, segment: InstrumentSegment): Promise<void> {
    await this.userAccess.update(
      { userId, segment },
      { isEnabled: false, revokedAt: new Date() },
    );
  }

  /**
   * Admin: List all users with segment access.
   */
  async listUserSegmentAccess(): Promise<UserSegmentAccessEntity[]> {
    return this.userAccess.find({ order: { userId: 'ASC', segment: 'ASC' } });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private parseTypes(types: string): InstrumentType[] {
    if (!types) return [];
    return types.split(',').filter(Boolean) as InstrumentType[];
  }

  private parseList(list: string): string[] {
    if (!list) return [];
    return list.split(',').filter(Boolean);
  }
}