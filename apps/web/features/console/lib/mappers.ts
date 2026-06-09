/**
 * File:        apps/web/features/console/lib/mappers.ts
 * Module:      web · Console · Mappers
 * Purpose:     Pure functions that transform backend GraphQL DTOs into the
 *              ConsoleUser shape consumed by /console sections. No React, no
 *              Apollo, no I/O — fully unit-testable.
 *
 * Exports:
 *   - mapProfileToConsoleUser(profile, accounts, fallback) → ConsoleUser
 *   - deriveKycState(profile, accounts) → KycState
 *   - deriveTier(kycLevel) → AccountTier
 *   - toTradingAccount(backendAccount) → TradingAccount
 *
 * Depends on:
 *   - ./seed-data — ConsoleUser type and shape contract
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Pure functions only — deterministic, no Date.now() / Math.random()
 *   - Missing fields fall back to safe defaults from the seed shape
 *   - Mappers never throw on partial data — they always return a complete ConsoleUser
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-09
 */

import {
  type ConsoleUser,
  type TradingAccount,
  type AccountTier,
  type KycState,
  type TwoFAState,
  type ApiKey,
  type Device,
  type LoginEvent,
  type PaymentMethod,
  type Transaction,
} from './seed-data';

/* ── Types matching backend GraphQL responses ──────────────────────────────── */

/** Shape of a UserDto from `getUserProfile` query (subset we care about). */
export interface BackendUserProfile {
  id: string;
  tenantId: string;
  mobileE164: string;
  email: string | null;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  name: string | null;
  countryCode: string | null;
  isActive: boolean;
  createdAt: string | Date;
}

/** Shape of an AccountEntity from `getMyAccounts` query. */
export interface BackendAccount {
  id: string;
  accountType: 'LIVE' | 'DEMO';
  status: 'ACTIVE' | 'DISABLED';
  baseCurrency: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/* ── Mappers ──────────────────────────────────────────────────────────────── */

/**
 * Map a backend trading account to the TradingAccount shape sections use.
 * Fields not exposed by the backend (equity, balance, leverage, marginLevel)
 * default to 0 / '—' — they're filled in by separate balance queries later.
 */
export function toTradingAccount(acc: BackendAccount): TradingAccount {
  return {
    id: acc.id,
    type: acc.accountType === 'LIVE' ? 'Live' : 'Demo',
    platform: 'MT5', // Backend doesn't expose platform yet; default to MT5
    currency: normalizeCurrency(acc.baseCurrency),
    balance: 0,
    equity: 0,
    leverage: '—',
    margin: 0,
    marginLevel: 0,
    status: acc.status === 'ACTIVE' ? 'active' : 'archived',
  };
}

/** Map a backend currency code to the union the seed type allows. */
function normalizeCurrency(ccy: string): TradingAccount['currency'] {
  const allowed: ReadonlyArray<TradingAccount['currency']> = [
    'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'SGD',
  ];
  const upper = ccy.toUpperCase();
  return (allowed.includes(upper as TradingAccount['currency'])
    ? (upper as TradingAccount['currency'])
    : 'USD');
}

/**
 * Derive KYC state from profile verification flags.
 * Backend doesn't expose kycStatus directly — we infer from email/mobile
 * verification until a dedicated KYC field lands.
 */
export function deriveKycState(profile: BackendUserProfile | null): KycState {
  if (!profile) return 'todo';
  if (profile.isActive && profile.isEmailVerified && profile.isMobileVerified) {
    return 'approved';
  }
  if (profile.isEmailVerified || profile.isMobileVerified) {
    return 'pending';
  }
  return 'todo';
}

/** Map KYC level (0-3) to the merchandising tier string. */
export function deriveTier(kycLevel: 0 | 1 | 2 | 3): AccountTier {
  if (kycLevel >= 3) return 'platinum';
  if (kycLevel === 2) return 'gold';
  if (kycLevel === 1) return 'silver';
  return 'unverified';
}

/** Format a Date/string as the YYYY-MM-DD style the shell expects. */
function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '—';
  return date.toISOString().slice(0, 10);
}

/** Derive the user's display initials from their name. */
function deriveInitials(name: string | null, fallback: string): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * The main aggregator. Combines a (possibly null) profile, an (empty-able) list
 * of accounts, and a seed fallback into a complete ConsoleUser.
 *
 * Defensive by design: if any input is missing, the corresponding field falls
 * back to the seed value. This keeps sections from breaking on partial data
 * (e.g., a network blip on a single query).
 */
export function mapProfileToConsoleUser(
  profile: BackendUserProfile | null,
  accounts: ReadonlyArray<BackendAccount>,
  fallback: ConsoleUser,
): ConsoleUser {
  // If we have neither profile nor accounts, return the seed verbatim.
  if (!profile && accounts.length === 0) {
    return fallback;
  }

  const kycState: KycState = deriveKycState(profile);
  // KYC level isn't on the backend yet — derive heuristically from state.
  const kycLevel: 0 | 1 | 2 | 3 =
    kycState === 'approved' ? 2 : kycState === 'pending' ? 1 : 0;
  const tier = deriveTier(kycLevel);

  const tradingAccounts: ReadonlyArray<TradingAccount> =
    accounts.length > 0 ? accounts.map(toTradingAccount) : fallback.accounts;

  // 2FA isn't exposed by the backend yet — keep seed values until the
  // security-settings endpoint is wired. We still surface email-verify
  // as a proxy signal.
  const twoFA: TwoFAState = {
    app: fallback.twoFA.app,
    sms: fallback.twoFA.sms,
    email: profile?.isEmailVerified ?? fallback.twoFA.email,
  };

  // Build the contact name / display fields. Phone is mandatory on backend,
  // email is optional — fall back to seed when missing.
  const displayName = profile?.name ?? fallback.name;
  const initials = deriveInitials(profile?.name, fallback.initials);

  // Empty stand-ins for fields that aren't on the backend yet. Sections that
  // need them (devices, API keys, transactions) keep working off the seed.
  const emptyDevices: ReadonlyArray<Device> = [];
  const emptyApiKeys: ReadonlyArray<ApiKey> = [];
  const emptyLogin: ReadonlyArray<LoginEvent> = [];
  const emptyPayments: ReadonlyArray<PaymentMethod> = [];
  const emptyTx: ReadonlyArray<Transaction> = [];

  return {
    id: profile?.id ?? fallback.id,
    name: displayName,
    initials,
    email: profile?.email ?? fallback.email,
    phone: profile?.mobileE164 ?? fallback.phone,
    country: profile?.countryCode ?? fallback.country,
    city: fallback.city, // Not exposed yet
    address: fallback.address,
    dob: fallback.dob,
    lang: fallback.lang,
    timezone: fallback.timezone,
    joined: formatDate(profile?.createdAt ?? fallback.joined),
    tier,
    kycState,
    kycLevel,
    referrer: fallback.referrer,
    ibCode: fallback.ibCode,
    accounts: tradingAccounts,
    balanceTotal: fallback.balanceTotal, // Computed from accountBalance — not in accounts[]
    equityTotal: fallback.equityTotal,
    pnlMTD: fallback.pnlMTD,
    pnlYTD: fallback.pnlYTD,
    twoFA,
    apiKeys: emptyApiKeys,
    devices: emptyDevices,
    loginHistory: emptyLogin,
    paymentMethods: emptyPayments,
    transactions: emptyTx,
  };
}
