/**
 * File:        apps/web/features/console/lib/mappers.ts
 * Module:      web · Console · Mappers
 * Purpose:     Pure functions that transform backend GraphQL DTOs into the
 *              ConsoleUser shape consumed by /console sections. No React, no
 *              Apollo, no I/O — fully unit-testable.
 *
 * Exports:
 *   - mapProfileToConsoleUser(profile, accounts) → ConsoleUser
 *   - emptyConsoleUser() → ConsoleUser
 *   - deriveKycState(profile) → KycState
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
function formatDate(d: string | Date | null | undefined): string {
  if (d == null) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
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
/**
 * Strictly empty ConsoleUser — used when the user is unauthenticated.
 * Every field is an honest empty sentinel; no persona, no fake IBANs, no fake devices.
 */
export function emptyConsoleUser(): ConsoleUser {
  return {
    id: '',
    name: '',
    initials: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    dob: '',
    lang: '',
    timezone: '',
    joined: '',
    tier: 'unverified',
    kycState: 'todo',
    kycLevel: 0,
    referrer: '',
    ibCode: null,
    accounts: [],
    balanceTotal: 0,
    equityTotal: 0,
    pnlMTD: 0,
    pnlYTD: 0,
    twoFA: { app: false, sms: false, email: false },
    apiKeys: [],
    devices: [],
    loginHistory: [],
    paymentMethods: [],
    transactions: [],
  };
}

export function mapProfileToConsoleUser(
  profile: BackendUserProfile | null,
  accounts: ReadonlyArray<BackendAccount>,
): ConsoleUser {
  // Unauthenticated: return strictly empty shape — no fake persona.
  if (!profile && accounts.length === 0) {
    return emptyConsoleUser();
  }

  const kycState: KycState = deriveKycState(profile);
  // KYC level isn't on the backend yet — derive heuristically from state.
  const kycLevel: 0 | 1 | 2 | 3 =
    kycState === 'approved' ? 2 : kycState === 'pending' ? 1 : 0;
  const tier = deriveTier(kycLevel);

  const tradingAccounts: ReadonlyArray<TradingAccount> = accounts.map(toTradingAccount);

  // 2FA isn't exposed by the backend yet — default all channels to false until
  // the security-settings endpoint is wired. We still surface email-verify
  // as a proxy signal.
  const twoFA: TwoFAState = {
    app: false,
    sms: false,
    email: !!profile?.isEmailVerified,
  };

  // Build the contact name / display fields. Phone is mandatory on backend,
  // email is optional — empty string when missing (NEVER the seed persona).
  const displayName = profile?.name ?? '';
  const initials = deriveInitials(profile?.name ?? null, '');

  return {
    id: profile?.id ?? '',
    name: displayName,
    initials,
    email: profile?.email ?? '',
    phone: profile?.mobileE164 ?? '',
    country: profile?.countryCode ?? '',
    city: '', // Not exposed yet
    address: '', // Not exposed yet
    dob: '', // Not exposed yet
    lang: '', // Not exposed yet
    timezone: '', // Not exposed yet
    joined: formatDate(profile?.createdAt),
    tier,
    kycState,
    kycLevel,
    referrer: '',
    ibCode: null,
    accounts: tradingAccounts,
    balanceTotal: 0, // TODO: computed from accountBalance once endpoint exists
    equityTotal: 0,
    pnlMTD: 0,
    pnlYTD: 0,
    twoFA,
    apiKeys: [],
    devices: [],
    loginHistory: [],
    paymentMethods: [],
    transactions: [],
  };
}
