/**
 * @file src/modules/dealing/controllers/dealing.controller.ts
 * @module dealing
 * @description Dealing controller scaffold for deal operations
 * @author BharatERP
 * @created 2026-02-19
 */

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateDealDto } from '../dtos/create-deal.dto';
import { DealEntity } from '../entities/deal.entity';
import { DealingService } from '../services/dealing.service';

@Controller('dealing')
export class DealingController {
  constructor(private readonly dealingService: DealingService) {}

  @Post('deals')
  async create(@Body() dto: CreateDealDto): Promise<DealEntity> {
    return this.dealingService.createDeal(dto);
  }

  @Get('deals')
  async list(@Query('tenantId') tenantId: string): Promise<DealEntity[]> {
    return this.dealingService.listDeals(tenantId);
  }

  @Get('deals/:id/status')
  async status(@Param('id') id: string): Promise<{ id: string; status: string } | null> {
    return this.dealingService.getDealStatus(id);
  }
}
