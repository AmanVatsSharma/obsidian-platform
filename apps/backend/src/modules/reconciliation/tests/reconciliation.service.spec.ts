/**
 * @file src/modules/reconciliation/tests/reconciliation.service.spec.ts
 * @module reconciliation
 * @description Unit tests for reconciliation service scaffold
 * @author BharatERP
 * @created 2026-02-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppLoggerService } from '../../../shared/logger';
import { ReconciliationBreakEntity } from '../entities/reconciliation-break.entity';
import { ReconciliationService } from '../services/reconciliation.service';

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  const repo = { save: jest.fn(), create: jest.fn(), find: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconciliationService,
        { provide: getRepositoryToken(ReconciliationBreakEntity), useValue: repo },
        { provide: AppLoggerService, useValue: { setContext: jest.fn(), debug: jest.fn() } },
      ],
    }).compile();
    service = module.get<ReconciliationService>(ReconciliationService);
    jest.clearAllMocks();
  });

  it('creates a break', async () => {
    repo.create.mockReturnValue({});
    repo.save.mockResolvedValue({ id: 'break-1' });
    const result = await service.createBreak({
      tenantId: 'f3cb1857-f41b-4615-9ce6-9494fc59de23',
      breakType: 'SETTLEMENT_MISMATCH',
      description: 'Mismatch between clearing and ledger',
      metadata: {},
    });
    expect(result.id).toBe('break-1');
  });
});
