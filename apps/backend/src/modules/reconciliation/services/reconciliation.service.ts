/**
 * @file src/modules/reconciliation/services/reconciliation.service.ts
 * @module reconciliation
 * @description Reconciliation break queue service for operational exception handling
 * @author BharatERP
 * @created 2026-02-17
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from '../../../shared/logger';
import { CreateReconciliationBreakDto } from '../dtos/create-reconciliation-break.dto';
import { ReconciliationBreakEntity } from '../entities/reconciliation-break.entity';

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(ReconciliationBreakEntity)
    private readonly breaksRepo: Repository<ReconciliationBreakEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(ReconciliationService.name);
  }

  async createBreak(dto: CreateReconciliationBreakDto): Promise<ReconciliationBreakEntity> {
    this.logger.debug('createBreak:start', dto);
    const saved = await this.breaksRepo.save(this.breaksRepo.create(dto));
    this.logger.debug('createBreak:end', { breakId: saved.id });
    return saved;
  }

  async listBreaks(tenantId: string): Promise<ReconciliationBreakEntity[]> {
    return this.breaksRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }
}
