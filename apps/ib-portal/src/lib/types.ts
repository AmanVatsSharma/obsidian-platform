/**
 * File:        apps/ib-portal/src/lib/types.ts
 * Module:      ib-portal · Types
 * Purpose:     All domain types for the IB portal — IB profile, clients, sub-IBs, earnings, payments, referral links
 *
 * Exports:
 *   - IBProfile          — primary IB account record
 *   - Client             — referred client record
 *   - SubIB              — sub-IB node (recursive children for tree)
 *   - EarningsRow        — trade-level commission statement row
 *   - MonthlyEarning     — monthly summary row
 *   - Payment            — payout record
 *   - ReferralLink       — per-channel tracking link with funnel stats
 *   - Announcement       — broker announcement feed item
 *   - CommissionSchedule — per-instrument commission rate
 *   - MarketingBanner    — banner asset metadata
 *   - EmailTemplate      — email template metadata
 *   - LPTemplate         — landing page template option
 *   - NavItem            — single nav entry
 *   - NavGroup           — nav section (label + items[])
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

export type IBTier = 'SILVER' | 'GOLD' | 'PLATINUM';

export interface IBProfile {
  name: string;
  tier: IBTier;
  broker: string;
  since: string;
  code: string;
  avatar: string;
  earningsMTD: number;
  pendingPayout: number;
  nextPayment: string;
  allTimeEarnings: number;
  allTimeClients: number;
  volumeMTD: number;
  activeClients: number;
  newClients: number;
  dormantClients: number;
  toGold: number;
  goldUnlocks: string;
}

export type ClientStatus = 'ACTIVE' | 'DORMANT' | 'UNVERIFIED';

export interface Client {
  name: string;
  joined: string;
  type: string;
  volumeMTD: number;
  tradesMTD: number;
  commission: number;
  lastTrade: string;
  status: ClientStatus;
  link: string;
}

export interface SubIB {
  id: number;
  name: string;
  initials: string;
  tier: 1 | 2;
  clients: number;
  volumeMTD: number;
  earnings: number;
  myOverride: number;
  joined: string;
  status: 'ACTIVE' | 'DORMANT';
  children: SubIB[];
}

export type EarningsSide = 'BUY' | 'SELL';
export type EarningsType = 'Direct' | 'Sub-IB';
export type EarningsStatus = 'PENDING' | 'PAID';

export interface EarningsRow {
  date: string;
  client: string;
  instrument: string;
  side: EarningsSide;
  lots: number;
  rate: number;
  commission: number;
  type: EarningsType;
  status: EarningsStatus;
}

export interface MonthlyEarning {
  month: string;
  clients: number;
  lots: number;
  commission: number;
  change: number;
  status: EarningsStatus;
}

export interface Payment {
  period: string;
  amount: number;
  method: string;
  ref: string;
  date: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
}

export interface ReferralLink {
  name: string;
  short: string;
  clicks: number;
  signups: number;
  verified: number;
  deposited: number;
  volume: number;
  commission: number;
  conv: number;
  active: boolean;
}

export interface Announcement {
  id: number;
  date: string;
  tag: 'NEW' | 'UPDATE' | 'MARKETING';
  text: string;
}

export interface CommissionSchedule {
  instrument: string;
  rate: string;
}

export interface MarketingBanner {
  name: string;
  size: string;
  type: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  tag: string;
}

export interface LPTemplate {
  id: string;
  name: string;
  desc: string;
}

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface TopClient {
  rank: number;
  name: string;
  volume: number;
  trades: number;
  commission: number;
  status: ClientStatus;
  link: string;
  joined: string;
}
