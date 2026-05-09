/**
 * @file types.ts
 * @module web
 * @description Onboarding types for KYC steps, documents, and broker profile.
 * @author BharatERP
 * @created 2026-04-16
 */

export type StepStatus = 'COMPLETE' | 'IN_PROGRESS' | 'PENDING' | 'REJECTED';

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
};

export type KycDocument = {
  id: string;
  type: string;
  fileName: string;
  uploadedAt: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  rejectionReason?: string;
};

export type BrokerProfile = {
  brokerId: string;
  brokerName: string;
  platform: string;
  accountType: string;
  leverage: string;
  currency: string;
  status: 'ACTIVE' | 'UNDER_REVIEW' | 'SUSPENDED';
};
