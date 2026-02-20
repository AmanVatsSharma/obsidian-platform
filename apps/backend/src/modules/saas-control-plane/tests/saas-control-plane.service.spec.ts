/**
 * @file src/modules/saas-control-plane/tests/saas-control-plane.service.spec.ts
 * @module saas-control-plane
 * @description Unit tests for SaaS control-plane service scaffold
 * @author BharatERP
 * @created 2026-02-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppLoggerService } from '../../../shared/logger';
import { BillingInvoicePlaceholderEntity } from '../entities/billing-invoice-placeholder.entity';
import { EntitlementPlanEntity } from '../entities/entitlement-plan.entity';
import { SupportImpersonationAuditEntity } from '../entities/support-impersonation-audit.entity';
import { TenantProvisioningEntity } from '../entities/tenant-provisioning.entity';
import { SaasControlPlaneService } from '../services/saas-control-plane.service';

describe('SaasControlPlaneService', () => {
  let service: SaasControlPlaneService;
  const provisioningRepo = { save: jest.fn(), create: jest.fn(), find: jest.fn() };
  const entitlementRepo = { save: jest.fn(), create: jest.fn(), find: jest.fn(), findOne: jest.fn() };
  const billingRepo = { save: jest.fn(), create: jest.fn(), find: jest.fn() };
  const auditRepo = { save: jest.fn(), create: jest.fn(), find: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaasControlPlaneService,
        { provide: getRepositoryToken(TenantProvisioningEntity), useValue: provisioningRepo },
        { provide: getRepositoryToken(EntitlementPlanEntity), useValue: entitlementRepo },
        { provide: getRepositoryToken(BillingInvoicePlaceholderEntity), useValue: billingRepo },
        { provide: getRepositoryToken(SupportImpersonationAuditEntity), useValue: auditRepo },
        { provide: AppLoggerService, useValue: { setContext: jest.fn(), debug: jest.fn() } },
      ],
    }).compile();
    service = module.get<SaasControlPlaneService>(SaasControlPlaneService);
    jest.clearAllMocks();
  });

  it('creates tenant provisioning request', async () => {
    provisioningRepo.create.mockReturnValue({});
    provisioningRepo.save.mockResolvedValue({ id: 'prov-1' });
    const result = await service.createProvisioning({
      tenantId: '31c7800e-aefc-4f91-a4df-0133f9d478ff',
      requestedBy: 'owner-1',
      resources: {},
    });
    expect(result.id).toBe('prov-1');
  });
});
