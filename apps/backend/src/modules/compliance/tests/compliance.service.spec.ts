/**
 * @file src/modules/compliance/tests/compliance.service.spec.ts
 * @module compliance
 * @description Unit tests for compliance service policy upsert scaffolding
 * @author BharatERP
 * @created 2026-02-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppLoggerService } from '../../../shared/logger';
import { CompliancePolicyEntity } from '../entities/compliance-policy.entity';
import { ComplianceService } from '../services/compliance.service';

describe('ComplianceService', () => {
  let service: ComplianceService;
  const repo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        { provide: getRepositoryToken(CompliancePolicyEntity), useValue: repo },
        { provide: AppLoggerService, useValue: { setContext: jest.fn(), debug: jest.fn() } },
      ],
    }).compile();
    service = module.get<ComplianceService>(ComplianceService);
    jest.clearAllMocks();
  });

  it('upserts policy', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue({ tenantId: 'tenant-1' });
    repo.save.mockResolvedValue({ id: 'policy-1', tenantId: 'tenant-1' });
    const result = await service.upsertPolicy({
      tenantId: 'a8ed251a-cdb7-4fac-ab0f-f0a6bd45138a',
      jurisdictionCode: 'IN',
      kycTier: 'BASIC',
      amlRiskLevel: 'LOW',
      sanctionsProvider: 'provider-x',
      suitabilityRules: {},
      auditRetentionDays: 365,
    });
    expect(result.id).toBe('policy-1');
  });
});
