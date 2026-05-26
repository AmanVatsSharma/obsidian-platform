/**
 * File:        apps/platform-owner/src/lib/api/endpoints.ts
 * Module:      platform-owner · API Endpoints
 * Purpose:     Typed wrappers over apiRequest for every backend endpoint the PO app uses.
 *
 * Exports:
 *   - requestOtp(mobile)                  → Promise<{ success: boolean }>
 *   - verifyOtp(mobile, otp)              → Promise<OtpVerifyResponse>
 *   - listBrokers()                       → Promise<ApiBroker[]>
 *   - getBroker(tenantCode)               → Promise<ApiBroker | null>
 *   - onboardBroker(dto)                  → Promise<OnboardBrokerResponse>
 *   - suspendBroker(tenantCode, reason?)  → Promise<void>
 *   - ApiBroker, OtpVerifyResponse, OnboardBrokerRequest, OnboardBrokerResponse — API shapes
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

import { apiRequest } from './client';

export interface OtpVerifyResponse {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  tokenId: string;
}

export interface ApiBrokerMetrics {
  aum: string;
  clients: number;
  monthlyRevenue: string;
  monthlyRevenuePrev: string;
  healthScore: number;
  lastActivityAt: string | null;
  computedAt: string | null;
}

export interface ApiBroker {
  id: string;
  tenantId: string;
  brokerCode: string;
  displayName: string;
  status: string;
  createdAt: string;
  metrics?: ApiBrokerMetrics;
}

export interface OnboardBrokerRequest {
  brokerCode: string;
  brokerDisplayName: string;
  adminMobileE164: string;
  adminName?: string;
  adminEmail?: string;
  timezone?: string;
  jurisdictionProfile?: string;
}

export interface OnboardBrokerResponse {
  tenantId: string;
  brokerCode: string;
  brokerId: string;
  adminUserId: string;
  resumed: boolean;
}

export const api = {
  requestOtp: (mobileE164: string) =>
    apiRequest<{ success: boolean }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ tenantId: 'platform', mobileE164 }),
    }),

  verifyOtp: (mobileE164: string, otp: string) =>
    apiRequest<OtpVerifyResponse>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ tenantId: 'platform', mobileE164, otp }),
    }),

  listBrokers: () =>
    apiRequest<ApiBroker[]>('/saas/brokers'),

  getBroker: (tenantCode: string) =>
    apiRequest<ApiBroker>(`/saas/brokers/${tenantCode}`),

  onboardBroker: (dto: OnboardBrokerRequest) =>
    apiRequest<OnboardBrokerResponse>('/saas/onboard-broker', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  suspendBroker: (tenantCode: string, reason?: string) =>
    apiRequest<void>(`/saas/brokers/${tenantCode}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  listBrokersWithMetrics: () =>
    apiRequest<ApiBroker[]>('/saas/brokers/metrics'),

  getBrokerMetrics: (tenantCode: string) =>
    apiRequest<ApiBrokerMetrics>(`/saas/brokers/${tenantCode}/metrics`),

  getPlatformStats: () =>
    apiRequest<{
      totalBrokers: number;
      activeBrokers: number;
      totalClients: number;
      totalAum: string;
      totalMonthlyRevenue: string;
      totalMonthlyRevenuePrev: string;
    }>('/saas/stats'),

  getRevenueSeries: () =>
    apiRequest<Array<{ month: string; mrr: number; newBusiness: number; churn: number }>>('/saas/revenue-series'),

  listAllBilling: () =>
    apiRequest<Array<{
      id: string;
      tenantId: string;
      invoiceNumber: string;
      amount: string;
      currency: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    }>>('/saas/billing/invoices'),

  createBilling: (dto: { tenantId: string; invoiceNumber: string; amount: string; currency: string }) =>
    apiRequest<{ id: string; invoiceNumber: string }>('/saas/billing/invoices', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  listAllEntitlements: () =>
    apiRequest<Array<{
      id: string;
      tenantId: string;
      planCode: string;
      entitlements: Record<string, unknown>;
      featureFlags: Record<string, boolean>;
      createdAt: string;
      updatedAt: string;
    }>>('/saas/entitlements'),

  upsertEntitlements: (dto: {
    tenantId: string;
    planCode: string;
    entitlements: Record<string, unknown>;
    featureFlags: Record<string, boolean>;
  }) =>
    apiRequest<{
      id: string;
      tenantId: string;
      planCode: string;
    }>('/saas/entitlements', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  listTenants: () =>
    apiRequest<Array<{
      id: string;
      code: string;
      displayName: string;
      status: string;
      timezone: string;
      jurisdictionProfile: string;
      createdAt: string;
      updatedAt: string;
    }>>('/saas/brokers'),

  getPlanRevenueBreakdown: () =>
    apiRequest<Array<{ plan: string; amount: number; tenants: number }>>('/saas/revenue/plan-breakdown'),

  getPlatformHealth: () =>
    apiRequest<{
      services: Array<{ name: string; status: string; uptime: string; latency: string; description: string }>;
      nodes: Array<{ id: string; location: string; load: number; memory: number; status: string; tenants: number }>;
      liquidityProviders: Array<{ id: number; name: string; type: string; status: string; latency: number; instruments: number; uptime: string; creditLimit: number; creditUsed: number }>;
    }>('/saas/health'),

  listAllAudit: () =>
    apiRequest<Array<{
      id: string;
      tenantId: string;
      actorUserId: string;
      targetUserId: string;
      reason: string;
      action: string;
      createdAt: string;
    }>>('/saas/audit/impersonations'),

  // Phase 2: Activity / Onboarding Queue / Suspended

  getLiveActivity: () =>
    apiRequest<Array<{
      id: string;
      type: string;
      message: string;
      time: string;
      brokerCode: string;
      severity: string;
    }>>('/saas/activity'),

  listPendingOnboarding: () =>
    apiRequest<Array<{
      tenantId: string;
      tenantCode: string;
      displayName: string;
      provisioningStatus: string;
      requestedBy: string;
      createdAt: string;
      daysPending: number;
    }>>('/saas/onboarding/queue'),

  advanceProvisioning: (tenantId: string) =>
    apiRequest<void>(`/saas/onboarding/${tenantId}/advance`, {
      method: 'POST',
    }),

  listSuspendedBrokers: () =>
    apiRequest<Array<{
      id: string;
      tenantId: string;
      brokerCode: string;
      displayName: string;
      status: string;
      createdAt: string;
    }>>('/saas/suspended'),

  reactivateBroker: (tenantCode: string) =>
    apiRequest<{ id: string; brokerCode: string }>(`/saas/suspended/${tenantCode}/reactivate`, {
      method: 'POST',
    }),

  // Platform dashboard endpoints — wired to /platform/dashboard/*
  getPlatformDashboardStats: () =>
    apiRequest<{
      totalBrokers: number;
      activeBrokers: number;
      totalClients: number;
      totalAum: string;
      totalMonthlyRevenue: string;
      totalMonthlyRevenuePrev: string;
    }>('/platform/dashboard/stats'),

  getPlatformDashboardBrokers: (limit = 10, offset = 0) =>
    apiRequest<{
      brokers: Array<{
        id: string;
        tenantId: string;
        brokerCode: string;
        displayName: string;
        status: string;
        createdAt: string;
        metrics?: {
          aum: string;
          clients: number;
          monthlyRevenue: string;
          monthlyRevenuePrev: string;
          healthScore: number;
          lastActivityAt: string | null;
          computedAt: string | null;
        };
      }>;
      total: number;
    }>(`/platform/dashboard/brokers?limit=${limit}&offset=${offset}`),

  getPlatformDashboardRevenue: (months = 12) =>
    apiRequest<Array<{ month: string; mrr: number; newBusiness: number; churn: number }>>(
      `/platform/dashboard/revenue?months=${months}`,
    ),
};
