/**
 * @file mock-data.ts
 * @module platform-owner
 * @description Initial mock data for Platform Owner UI; shapes aligned with backend entities
 * @author BharatERP
 * @created 2026-03-15
 */

import type {
  Tenant,
  TenantProvisioning,
  EntitlementPlan,
  BillingInvoicePlaceholder,
  SupportImpersonationAudit,
} from './types';

export const MOCK_TENANTS: Tenant[] = [
  {
    id: 't-001',
    code: 'broker-alpha',
    displayName: 'Broker Alpha Ltd',
    timezone: 'UTC',
    jurisdictionProfile: 'GLOBAL',
    status: 'ACTIVE',
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
  },
  {
    id: 't-002',
    code: 'broker-beta',
    displayName: 'Broker Beta Securities',
    timezone: 'America/New_York',
    jurisdictionProfile: 'US',
    status: 'ACTIVE',
    createdAt: '2026-02-15T09:00:00.000Z',
    updatedAt: '2026-03-10T14:00:00.000Z',
  },
  {
    id: 't-003',
    code: 'broker-gamma',
    displayName: 'Gamma Trading Co',
    timezone: 'Asia/Kolkata',
    jurisdictionProfile: 'IN',
    status: 'PENDING',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
  },
];

export const MOCK_PROVISIONING: TenantProvisioning[] = [
  {
    id: 'pr-001',
    tenantId: 't-003',
    requestedBy: 'platform-owner-user',
    status: 'PENDING',
    resources: { region: 'ap-south-1', tier: 'standard' },
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
  },
];

export const MOCK_ENTITLEMENT_PLANS: EntitlementPlan[] = [
  {
    id: 'ep-001',
    tenantId: 't-001',
    planCode: 'professional',
    entitlements: { maxAccounts: 10, apiRateLimit: 1000 },
    featureFlags: { advancedCharts: true, algoTrading: true },
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
  },
  {
    id: 'ep-002',
    tenantId: 't-002',
    planCode: 'enterprise',
    entitlements: { maxAccounts: 500, apiRateLimit: 50000 },
    featureFlags: { advancedCharts: true, algoTrading: true, whiteLabel: true },
    createdAt: '2026-02-15T09:00:00.000Z',
    updatedAt: '2026-03-10T14:00:00.000Z',
  },
];

export const MOCK_BILLING_INVOICES: BillingInvoicePlaceholder[] = [
  {
    id: 'inv-001',
    tenantId: 't-001',
    invoiceNumber: 'INV-2026-001',
    amount: '2500.00',
    currency: 'USD',
    status: 'PAID',
    createdAt: '2026-02-28T00:00:00.000Z',
    updatedAt: '2026-03-05T00:00:00.000Z',
  },
  {
    id: 'inv-002',
    tenantId: 't-002',
    invoiceNumber: 'INV-2026-002',
    amount: '15000.00',
    currency: 'USD',
    status: 'DRAFT',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
];

export const MOCK_IMPERSONATION_AUDITS: SupportImpersonationAudit[] = [
  {
    id: 'aud-001',
    tenantId: 't-001',
    actorUserId: 'support-agent-1',
    targetUserId: 'user-abc',
    reason: 'Customer KYC verification',
    action: 'STARTED',
    createdAt: '2026-03-10T11:30:00.000Z',
  },
  {
    id: 'aud-002',
    tenantId: 't-002',
    actorUserId: 'support-agent-2',
    targetUserId: 'user-xyz',
    reason: 'Order dispute investigation',
    action: 'ENDED',
    createdAt: '2026-03-12T09:15:00.000Z',
  },
];
