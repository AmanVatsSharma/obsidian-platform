/**
 * @file types.ts
 * @module platform-owner
 * @description Shared types aligned with backend entities for future API drop-in
 * @author BharatERP
 * @created 2026-03-15
 */

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface Tenant {
  id: string;
  code: string;
  displayName: string;
  timezone: string;
  jurisdictionProfile: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TenantProvisioning {
  id: string;
  tenantId: string;
  requestedBy: string;
  status: string;
  resources: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EntitlementPlan {
  id: string;
  tenantId: string;
  planCode: string;
  entitlements: Record<string, unknown>;
  featureFlags: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface BillingInvoicePlaceholder {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportImpersonationAudit {
  id: string;
  tenantId: string;
  actorUserId: string;
  targetUserId: string;
  reason: string;
  action: string;
  createdAt: string;
}

/** DTO shape for creating a tenant (aligned with backend CreateTenantDto) */
export interface CreateTenantInput {
  code: string;
  displayName: string;
  timezone?: string;
  jurisdictionProfile?: string;
  status?: TenantStatus;
}

/** DTO shape for upserting entitlement (aligned with backend UpsertEntitlementPlanDto) */
export interface UpsertEntitlementInput {
  tenantId: string;
  planCode: string;
  entitlements: Record<string, unknown>;
  featureFlags: Record<string, boolean>;
}

/** DTO shape for creating billing placeholder (aligned with backend CreateBillingInvoicePlaceholderDto) */
export interface CreateBillingInput {
  tenantId: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
}
