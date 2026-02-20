/**
 * @file src/modules/reconciliation/controllers/reconciliation.controller.ts
 * @module reconciliation
 * @description Reconciliation break APIs for broker-admin workflows
 * @author BharatERP
 * @created 2026-02-17
 */

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateReconciliationBreakDto } from '../dtos/create-reconciliation-break.dto';
import { ReconciliationBreakEntity } from '../entities/reconciliation-break.entity';
import { ReconciliationService } from '../services/reconciliation.service';

@Controller('reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post('breaks')
  async create(@Body() dto: CreateReconciliationBreakDto): Promise<ReconciliationBreakEntity> {
    return this.reconciliationService.createBreak(dto);
  }

  @Get('breaks')
  async list(@Query('tenantId') tenantId: string): Promise<ReconciliationBreakEntity[]> {
    return this.reconciliationService.listBreaks(tenantId);
  }
}
