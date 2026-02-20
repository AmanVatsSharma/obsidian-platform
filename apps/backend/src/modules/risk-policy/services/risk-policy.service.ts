/**
 * @file src/modules/risk-policy/services/risk-policy.service.ts
 * @module risk-policy
 * @description Risk policy service for jurisdiction controls and tenant assignments
 * @author BharatERP
 * @created 2026-02-17
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from '../../../shared/logger';
import { AssignRiskPolicyDto, CreateRiskPolicyDto } from '../dtos/create-risk-policy.dto';
import { RiskPolicyEntity } from '../entities/risk-policy.entity';
import { TenantRiskPolicyEntity } from '../entities/tenant-risk-policy.entity';

@Injectable()
export class RiskPolicyService {
  constructor(
    @InjectRepository(RiskPolicyEntity)
    private readonly policies: Repository<RiskPolicyEntity>,
    @InjectRepository(TenantRiskPolicyEntity)
    private readonly assignments: Repository<TenantRiskPolicyEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(RiskPolicyService.name);
  }

  async createPolicy(dto: CreateRiskPolicyDto): Promise<RiskPolicyEntity> {
    this.logger.debug('createPolicy:start', dto);
    const saved = await this.policies.save(this.policies.create(dto));
    this.logger.debug('createPolicy:end', { riskPolicyId: saved.id });
    return saved;
  }

  async assignPolicy(dto: AssignRiskPolicyDto): Promise<TenantRiskPolicyEntity> {
    this.logger.debug('assignPolicy:start', dto);
    const saved = await this.assignments.save(this.assignments.create(dto));
    this.logger.debug('assignPolicy:end', { assignmentId: saved.id });
    return saved;
  }

  async listPolicies(tenantId: string): Promise<RiskPolicyEntity[]> {
    return this.policies.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }
}
