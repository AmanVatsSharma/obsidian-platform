/**
 * @file src/modules/settlement/services/settlement.service.ts
 * @module settlement
 * @description Settlement workflow service for backoffice processing scaffold
 * @author BharatERP
 * @created 2026-02-17
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from '../../../shared/logger';
import { CreateSettlementJobDto } from '../dtos/create-settlement-job.dto';
import { SettlementJobEntity } from '../entities/settlement-job.entity';

@Injectable()
export class SettlementService {
  constructor(
    @InjectRepository(SettlementJobEntity)
    private readonly jobs: Repository<SettlementJobEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(SettlementService.name);
  }

  async createJob(dto: CreateSettlementJobDto): Promise<SettlementJobEntity> {
    this.logger.debug('createJob:start', dto);
    const saved = await this.jobs.save(this.jobs.create({ ...dto, status: 'PENDING' }));
    this.logger.debug('createJob:end', { settlementJobId: saved.id });
    return saved;
  }

  async listJobs(tenantId: string): Promise<SettlementJobEntity[]> {
    return this.jobs.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }
}
