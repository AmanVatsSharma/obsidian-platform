/**
 * File:        apps/web/features/console/lib/seed-data.ts
 * Module:      web · Console · Seed Data
 * Purpose:     Mock user payload that drives every console section while backend
 *              wiring is pending. Distilled from the design's `data.jsx` "retail"
 *              persona — the designer-only newbie/pro personas are intentionally
 *              dropped for production.
 *
 * Exports:
 *   - SEED_USER          — ConsoleUser (retail persona, KYC approved, ~€60k)
 *   - SEED_SPARK         — number[]  (30-point sparkline series, 0..1 normalized)
 *   - ConsoleUser type   — shape of the user object every section consumes
 *   - TradingAccount, ApiKey, Device, LoginEvent, PaymentMethod, Transaction — sub-types
 *
 * Depends on:
 *   - none (pure data)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - All monetary amounts are positive numbers; sign comes from `type` (Deposit / Withdrawal)
 *     for transactions and from explicit minus on withdrawal-shaped rows.
 *   - `kycState` is always one of: 'approved' | 'pending' | 'todo' | 'rejected'.
 *   - `tier` ∈ 'gold' | 'silver' | 'platinum' | 'unverified'.
 *   - The shape mirrors the prototype 1:1 so each section's logic can be ported verbatim
 *     without re-shaping in the section component.
 *   - [SonuRamTODO] Replace SEED_USER with a real fetch (e.g. GET /v1/users/me) once the
 *     consolidated user-console endpoint exists. Track via Obsidian follow-ups.
 *
 * Read order:
 *   1. ConsoleUser type      — top-level shape
 *   2. SEED_USER             — concrete instance fed to sections
 *   3. SEED_SPARK            — 30-day equity sparkline
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

export type KycState = 'approved' | 'pending' | 'todo' | 'rejected';
export type AccountTier = 'gold' | 'silver' | 'platinum' | 'unverified';

export type TradingAccount = {
  id: string;
  type: 'Live' | 'Demo';
  platform: 'MT5' | 'MT4' | 'FIX';
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'SGD';
  balance: number;
  equity: number;
  leverage: string;
  margin: number;
  marginLevel: number;
  status: 'active' | 'archived';
};

export type ApiKey = {
  id: string;
  name: string;
  scopes: ReadonlyArray<'read' | 'trade' | 'withdraw'>;
  created: string;
  lastUsed: string;
  ips: ReadonlyArray<string>;
};

export type Device = {
  id: string;
  name: string;
  os: string;
  browser: string;
  location: string;
  ip: string;
  lastSeen: string;
  current: boolean;
};

export type LoginEvent = {
  ts: string;
  ip: string;
  loc: string;
  device: string;
  status: 'ok' | 'challenge';
};

export type PaymentMethod = {
  id: string;
  kind: 'bank' | 'card' | 'crypto';
  label: string;
  primary: boolean;
};

export type Transaction = {
  ts: string;
  type: 'Deposit' | 'Withdrawal' | 'Internal Transfer';
  method: string;
  amount: number;
  ccy: string;
  status: 'completed' | 'pending';
};

export type TwoFAState = {
  app: boolean;
  sms: boolean;
  email: boolean;
};

export type ConsoleUser = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  dob: string;
  lang: string;
  timezone: string;
  joined: string;
  tier: AccountTier;
  kycState: KycState;
  kycLevel: 0 | 1 | 2 | 3;
  referrer: string;
  ibCode: string | null;
  accounts: ReadonlyArray<TradingAccount>;
  balanceTotal: number;
  equityTotal: number;
  pnlMTD: number;
  pnlYTD: number;
  twoFA: TwoFAState;
  apiKeys: ReadonlyArray<ApiKey>;
  devices: ReadonlyArray<Device>;
  loginHistory: ReadonlyArray<LoginEvent>;
  paymentMethods: ReadonlyArray<PaymentMethod>;
  transactions: ReadonlyArray<Transaction>;
};

export const SEED_USER: ConsoleUser = {
  id: 'OBS-1048291',
  name: 'Adrián Vasilenko',
  initials: 'AV',
  email: 'adrian.v@protonmail.com',
  phone: '+34 612 884 102',
  country: 'Spain',
  city: 'Barcelona',
  address: 'Carrer de Provença 287, 4-2',
  dob: '1989-04-12',
  lang: 'English',
  timezone: 'Europe/Madrid (UTC+01:00)',
  joined: '2023-08-14',
  tier: 'gold',
  kycState: 'approved',
  kycLevel: 2,
  referrer: '—',
  ibCode: null,
  accounts: [
    { id: 'ML-441829', type: 'Live', platform: 'MT5', currency: 'EUR', balance: 48214.62, equity: 49102.18, leverage: '1:30',  margin: 1184.20, marginLevel: 4146,  status: 'active' },
    { id: 'ML-441830', type: 'Live', platform: 'MT5', currency: 'USD', balance: 12480.00, equity: 12480.00, leverage: '1:30',  margin: 0,        marginLevel: 0,     status: 'active' },
    { id: 'DM-998127', type: 'Demo', platform: 'MT5', currency: 'USD', balance: 100000.00, equity: 99214.40, leverage: '1:200', margin: 2104.00, marginLevel: 4715, status: 'active' },
  ],
  balanceTotal: 60694.62,
  equityTotal:  61582.18,
  pnlMTD:       887.56,
  pnlYTD:       4214.80,
  twoFA: { app: true, sms: false, email: true },
  apiKeys: [
    { id: 'ak_8s2k', name: 'TradingView webhook',  scopes: ['read', 'trade'], created: '2025-09-12', lastUsed: '2026-05-07 14:22 UTC', ips: ['52.89.214.0/24'] },
    { id: 'ak_2p9m', name: 'Personal Python bot',  scopes: ['read'],          created: '2024-11-04', lastUsed: '2026-04-19 09:01 UTC', ips: [] },
  ],
  devices: [
    { id: 'd1', name: 'MacBook Pro 14"', os: 'macOS 15.1',  browser: 'Safari 18.2',         location: 'Barcelona, ES', ip: '85.47.213.91',  lastSeen: 'Active now',  current: true  },
    { id: 'd2', name: 'iPhone 15 Pro',   os: 'iOS 18.4',    browser: 'Obsidian iOS 4.2',   location: 'Barcelona, ES', ip: '31.6.84.142',   lastSeen: '2 hours ago', current: false },
    { id: 'd3', name: 'Windows desktop', os: 'Windows 11',  browser: 'Chrome 132',          location: 'Madrid, ES',    ip: '88.27.103.52',  lastSeen: '3 days ago',  current: false },
  ],
  loginHistory: [
    { ts: '2026-05-08 09:14 UTC', ip: '85.47.213.91',  loc: 'Barcelona, ES', device: 'Safari · macOS',  status: 'ok' },
    { ts: '2026-05-08 06:42 UTC', ip: '31.6.84.142',   loc: 'Barcelona, ES', device: 'iOS app',         status: 'ok' },
    { ts: '2026-05-07 22:11 UTC', ip: '85.47.213.91',  loc: 'Barcelona, ES', device: 'Safari · macOS',  status: 'ok' },
    { ts: '2026-05-04 14:08 UTC', ip: '203.0.113.45',  loc: 'Lisbon, PT',    device: 'Chrome · Win',    status: 'challenge' },
    { ts: '2026-05-02 10:20 UTC', ip: '88.27.103.52',  loc: 'Madrid, ES',    device: 'Chrome · Win',    status: 'ok' },
  ],
  paymentMethods: [
    { id: 'pm1', kind: 'bank',   label: 'BBVA · ES91 •• 4421',          primary: true  },
    { id: 'pm2', kind: 'card',   label: 'Visa •• 8821',                 primary: false },
    { id: 'pm3', kind: 'crypto', label: 'USDT · TRC20 · TVk•••8s2J',    primary: false },
  ],
  transactions: [
    { ts: '2026-05-06', type: 'Deposit',           method: 'Bank · BBVA',                amount:  5000, ccy: 'EUR',  status: 'completed' },
    { ts: '2026-04-28', type: 'Withdrawal',        method: 'Bank · BBVA',                amount: -1200, ccy: 'EUR',  status: 'completed' },
    { ts: '2026-04-15', type: 'Internal Transfer', method: 'ML-441829 → ML-441830',     amount: -2000, ccy: 'EUR',  status: 'completed' },
    { ts: '2026-03-22', type: 'Deposit',           method: 'Card · Visa',               amount:  3000, ccy: 'EUR',  status: 'completed' },
    { ts: '2026-03-04', type: 'Withdrawal',        method: 'USDT · TRC20',              amount:  -800, ccy: 'USDT', status: 'pending' },
  ],
};

export const SEED_SPARK: ReadonlyArray<number> = [
  0.31, 0.34, 0.38, 0.36, 0.40, 0.42, 0.39, 0.44, 0.48, 0.46,
  0.51, 0.49, 0.55, 0.58, 0.54, 0.57, 0.61, 0.65, 0.62, 0.68,
  0.66, 0.70, 0.74, 0.71, 0.76, 0.79, 0.81, 0.78, 0.83, 0.86,
];
