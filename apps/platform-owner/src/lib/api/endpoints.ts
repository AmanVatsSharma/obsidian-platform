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

export interface ApiBroker {
  id: string;
  tenantId: string;
  brokerCode: string;
  displayName: string;
  createdAt: string;
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
};
