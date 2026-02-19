/**
 * @file src/modules/compliance/services/compliance.service.ts
 * @module compliance
 * @description Compliance policy management for KYC/AML/sanctions/suitability rules
 * @author BharatERP
 * @created 2026-02-17
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from '../../../shared/logger';
import { UpsertCompliancePolicyDto } from '../dtos/upsert-compliance-policy.dto';
import { CompliancePolicyEntity } from '../entities/compliance-policy.entity';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(CompliancePolicyEntity)
    private readonly policies: Repository<CompliancePolicyEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(ComplianceService.name);
  }

  async upsertPolicy(dto: UpsertCompliancePolicyDto): Promise<CompliancePolicyEntity> {
    this.logger.debug('upsertPolicy:start', dto);
    const existing = await this.policies.findOne({
      where: { tenantId: dto.tenantId, jurisdictionCode: dto.jurisdictionCode },
    });
    const entity = this.policies.create({
      ...(existing ?? {}),
      ...dto,
    });
    const saved = await this.policies.save(entity);
    this.logger.debug('upsertPolicy:end', { policyId: saved.id });
    return saved;
  }

  async listPolicies(tenantId: string): Promise<CompliancePolicyEntity[]> {
    this.logger.debug('listPolicies:start', { tenantId });
    return this.policies.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }
}
