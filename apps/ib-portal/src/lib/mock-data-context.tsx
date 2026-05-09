/**
 * File:        apps/ib-portal/src/lib/mock-data-context.tsx
 * Module:      ib-portal · Mock Data Context
 * Purpose:     React context + provider that exposes all IB portal demo data to the component tree
 *
 * Exports:
 *   - MockIBDataProvider({ children }) — wraps app; populates context with mock data
 *   - useIBData() → IBDataContextValue — hook for consuming IB data in any child component
 *   - IBDataContextValue                — type of the context value
 *
 * Depends on:
 *   - ./mock-data — all MOCK_* constants
 *   - ./types     — domain types
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - useIBData() throws if called outside MockIBDataProvider
 *   - Replace MockIBDataProvider with a real API provider when backend is ready — no page changes needed
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import * as React from 'react';
import type {
  Announcement,
  Client,
  CommissionSchedule,
  EarningsRow,
  EmailTemplate,
  IBProfile,
  LPTemplate,
  MarketingBanner,
  MonthlyEarning,
  Payment,
  ReferralLink,
  SubIB,
  TopClient,
} from './types';
import {
  ALL_CLIENTS,
  ANNOUNCEMENTS,
  COMMISSION_SCHEDULE,
  EARNINGS_BAR_DATA,
  EMAIL_TEMPLATES,
  LINK_SIGNUP_HISTORY,
  LP_TEMPLATES,
  MARKETING_BANNERS,
  MOCK_IB,
  MONTHLY_EARNINGS,
  PAYMENTS,
  REFERRAL_LINKS,
  SPARKLINE_DATA,
  STATEMENT_ROWS,
  SUB_IBS,
  TOP_CLIENTS,
} from './mock-data';

export interface IBDataContextValue {
  ib: IBProfile;
  sparklineData: number[];
  earningsBarData: typeof EARNINGS_BAR_DATA;
  topClients: TopClient[];
  allClients: Client[];
  announcements: Announcement[];
  commissionSchedule: CommissionSchedule[];
  statementRows: EarningsRow[];
  monthlyEarnings: MonthlyEarning[];
  payments: Payment[];
  subIBs: SubIB[];
  referralLinks: ReferralLink[];
  linkSignupHistory: number[][];
  marketingBanners: MarketingBanner[];
  emailTemplates: EmailTemplate[];
  lpTemplates: LPTemplate[];
}

const IBDataContext = React.createContext<IBDataContextValue | null>(null);

export function useIBData(): IBDataContextValue {
  const ctx = React.useContext(IBDataContext);
  if (!ctx) throw new Error('useIBData must be used within MockIBDataProvider');
  return ctx;
}

export function MockIBDataProvider({ children }: { children: React.ReactNode }) {
  const value: IBDataContextValue = React.useMemo(() => ({
    ib: MOCK_IB,
    sparklineData: SPARKLINE_DATA,
    earningsBarData: EARNINGS_BAR_DATA,
    topClients: TOP_CLIENTS,
    allClients: ALL_CLIENTS,
    announcements: ANNOUNCEMENTS,
    commissionSchedule: COMMISSION_SCHEDULE,
    statementRows: STATEMENT_ROWS,
    monthlyEarnings: MONTHLY_EARNINGS,
    payments: PAYMENTS,
    subIBs: SUB_IBS,
    referralLinks: REFERRAL_LINKS,
    linkSignupHistory: LINK_SIGNUP_HISTORY,
    marketingBanners: MARKETING_BANNERS,
    emailTemplates: EMAIL_TEMPLATES,
    lpTemplates: LP_TEMPLATES,
  }), []);

  return <IBDataContext.Provider value={value}>{children}</IBDataContext.Provider>;
}
