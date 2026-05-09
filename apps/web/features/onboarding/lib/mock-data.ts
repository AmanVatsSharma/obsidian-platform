/**
 * @file mock-data.ts
 * @module web
 * @description Mock onboarding steps, KYC documents, and broker profile.
 * @author BharatERP
 * @created 2026-04-16
 */

import type { BrokerProfile, KycDocument, OnboardingStep } from './types';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 'S1', title: 'Identity Verification', description: 'Upload government-issued ID (Aadhaar, PAN, or passport).', status: 'COMPLETE' },
  { id: 'S2', title: 'Address Proof', description: 'Utility bill, bank statement, or voter ID as address proof.', status: 'COMPLETE' },
  { id: 'S3', title: 'Financial Profile', description: 'Annual income, net worth, trading experience, and risk appetite.', status: 'IN_PROGRESS' },
  { id: 'S4', title: 'Bank Account Linking', description: 'Link your primary bank account for deposits and withdrawals.', status: 'PENDING' },
  { id: 'S5', title: 'Agreement & Disclosure', description: 'Review and sign the client agreement and risk disclosure.', status: 'PENDING' },
];

export const KYC_DOCUMENTS: KycDocument[] = [
  { id: 'D001', type: 'PAN Card', fileName: 'pan-card.pdf', uploadedAt: '2026-04-10', status: 'VERIFIED' },
  { id: 'D002', type: 'Aadhaar Card', fileName: 'aadhaar-front-back.pdf', uploadedAt: '2026-04-10', status: 'VERIFIED' },
  { id: 'D003', type: 'Bank Statement', fileName: 'hdfc-statement-mar26.pdf', uploadedAt: '2026-04-12', status: 'PENDING' },
];

export const BROKER_PROFILE: BrokerProfile = {
  brokerId: 'NT-2026-0042',
  brokerName: 'Obsidian Markets',
  platform: 'Obsidian Terminal',
  accountType: 'Standard',
  leverage: '1:100',
  currency: 'USD',
  status: 'UNDER_REVIEW',
};
