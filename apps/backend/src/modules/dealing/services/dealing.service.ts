/**
 * @file src/modules/dealing/services/dealing.service.ts
 * @module dealing
 * @description Dealing service scaffold for deal capture and status
 * @author BharatERP
 * @created 2026-02-19
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from '../../../shared/logger';
import { CreateDealDto } from '../dtos/create-deal.dto';
import { DealEntity } from '../entities/deal.entity';

@Injectable()
export class DealingService {
  constructor(
    @InjectRepository(DealEntity)
    private readonly deals: Repository<DealEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(DealingService.name);
  }

  async createDeal(dto: CreateDealDto): Promise<DealEntity> {
    this.logger.debug('createDeal:start', dto);
    const saved = await this.deals.save(this.deals.create(dto));
    this.logger.debug('createDeal:end', { dealId: saved.id });
    return saved;
  }

  async listDeals(tenantId: string): Promise<DealEntity[]> {
    return this.deals.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async getDealStatus(id: string): Promise<{ id: string; status: string } | null> {
    const deal = await this.deals.findOne({ where: { id }, select: ['id', 'status'] });
    return deal ? { id: deal.id, status: deal.status } : null;
  }
}
