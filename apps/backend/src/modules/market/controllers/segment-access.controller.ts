/**
 * File:        apps/backend/src/modules/market/controllers/segment-access.controller.ts
 * Module:      market · Segment Access
 * Purpose:     Admin endpoints for managing user segment access.
 *              Allows admin to grant/revoke segments and configure limits.
 *
 * Exports:
 *   - SegmentAccessController — @Controller('api/v1/admin/segment-access')
 *       GET  /                              — list all user access
 *       POST /                              — grant segment access
 *       DELETE /:userId/:segment            — revoke
 *       PATCH /:userId/:segment             — update limits
 *       GET  /user/:userId                  — get specific user access
 *
 * Depends on:
 *   - SegmentAccessService
 *   - JwtAuthGuard, RolesGuard
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

import {
  Body, Controller, Delete, Get, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { IsString, IsEnum, IsOptional, IsNumber, IsArray, IsUUID } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../rbac/guards/roles.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';
import { SegmentAccessService } from '../services/segment-access.service';
import { InstrumentSegment, InstrumentType } from '../entities/instrument.entity';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

class GrantSegmentAccessDto {
  @IsUUID()
  userId!: string;

  @IsEnum(InstrumentSegment)
  segment!: InstrumentSegment;

  @IsOptional()
  @IsArray()
  allowedTypes?: InstrumentType[];

  @IsOptional()
  @IsNumber()
  maxOrderValue?: number;

  @IsOptional()
  @IsNumber()
  maxOpenPositions?: number;

  @IsOptional()
  @IsNumber()
  maxDailyTrades?: number;
}

class UpdateLimitsDto {
  @IsOptional()
  @IsNumber()
  maxOrderValue?: number;

  @IsOptional()
  @IsNumber()
  maxOpenPositions?: number;

  @IsOptional()
  @IsNumber()
  maxDailyTrades?: number;

  @IsOptional()
  @IsArray()
  allowedTypes?: InstrumentType[];
}

@Controller('admin/segment-access')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SegmentAccessController {
  constructor(
    private readonly segmentAccess: SegmentAccessService,
  ) {}

  @Get()
  async listAll() {
    return this.segmentAccess.listUserSegmentAccess();
  }

  @Get('user/:userId')
  async getUserAccess(@Param('userId') userId: string) {
    return this.segmentAccess.getUserSegments(userId, 'user');
  }

  @Post()
  async grantAccess(
    @Body() dto: GrantSegmentAccessDto,
    @CurrentUser() admin: { id: string },
  ) {
    return this.segmentAccess.grantSegmentAccess(
      dto.userId,
      dto.segment,
      {
        allowedTypes: dto.allowedTypes,
        maxOrderValue: dto.maxOrderValue,
        maxOpenPositions: dto.maxOpenPositions,
        maxDailyTrades: dto.maxDailyTrades,
        grantedBy: admin.id,
      },
    );
  }

  @Patch(':userId/:segment')
  async updateLimits(
    @Param('userId') userId: string,
    @Param('segment') segment: InstrumentSegment,
    @Body() dto: UpdateLimitsDto,
    @CurrentUser() admin: { id: string },
  ) {
    return this.segmentAccess.grantSegmentAccess(
      userId,
      segment,
      {
        allowedTypes: dto.allowedTypes,
        maxOrderValue: dto.maxOrderValue,
        maxOpenPositions: dto.maxOpenPositions,
        maxDailyTrades: dto.maxDailyTrades,
        grantedBy: admin.id,
      },
    );
  }

  @Delete(':userId/:segment')
  async revokeAccess(
    @Param('userId') userId: string,
    @Param('segment') segment: InstrumentSegment,
  ) {
    await this.segmentAccess.revokeSegmentAccess(userId, segment);
    return { revoked: true };
  }
}