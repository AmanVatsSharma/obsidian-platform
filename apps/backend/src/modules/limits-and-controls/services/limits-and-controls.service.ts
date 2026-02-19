/**
 * @file src/modules/limits-and-controls/services/limits-and-controls.service.ts
 * @module limits-and-controls
 * @description Service scaffold for limits configuration and exception queues
 * @author BharatERP
 * @created 2026-02-17
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from '../../../shared/logger';
import { CreateLimitControlDto, CreateLimitExceptionDto } from '../dtos/create-limit-control.dto';
import { LimitControlEntity } from '../entities/limit-control.entity';
import { LimitExceptionEntity } from '../entities/limit-exception.entity';

@Injectable()
export class LimitsAndControlsService {
  constructor(
    @InjectRepository(LimitControlEntity)
    private readonly controls: Repository<LimitControlEntity>,
    @InjectRepository(LimitExceptionEntity)
    private readonly exceptions: Repository<LimitExceptionEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(LimitsAndControlsService.name);
  }

  async createControl(dto: CreateLimitControlDto): Promise<LimitControlEntity> {
    this.logger.debug('createControl:start', dto);
    const saved = await this.controls.save(this.controls.create(dto));
    this.logger.debug('createControl:end', { controlId: saved.id });
    return saved;
  }

  async listControls(tenantId: string): Promise<LimitControlEntity[]> {
    return this.controls.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  async createException(dto: CreateLimitExceptionDto): Promise<LimitExceptionEntity> {
    this.logger.debug('createException:start', dto);
    const saved = await this.exceptions.save(this.exceptions.create(dto));
    this.logger.debug('createException:end', { exceptionId: saved.id });
    return saved;
  }

  async listExceptions(tenantId: string): Promise<LimitExceptionEntity[]> {
    return this.exceptions.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }
}
