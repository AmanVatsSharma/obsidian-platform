/**
 * File:        apps/web/features/console/index.ts
 * Module:      web · Console · Public API
 * Purpose:     Single import surface for the Account Console feature. Routes and
 *              other features should reach in via this barrel only — never via
 *              relative paths into components/* or lib/*.
 *
 * Exports:
 *   - ConsoleShell                                  — Layout-level chrome (top bar + sidebar)
 *   - OverviewSection, ProfileSection,
 *     VerificationSection, SecuritySection,
 *     AccountsSection, FundingSection,
 *     PreferencesSection, NotificationsSection,
 *     ApiSection, StatementsSection,
 *     ReferralsSection, AppearanceSection         — Twelve console sections
 *   - useConsoleUser, useConsoleSpark              — Data hooks (mock today)
 *   - SECTIONS, SECTION_DESC, SECTION_GROUPS,
 *     GROUP_LABELS                                  — Section metadata
 *   - Type re-exports: ConsoleSection, ConsoleSectionId, ConsoleUser, etc.
 *
 * Depends on:
 *   - none (re-export only)
 *
 * Side-effects:
 *   - none (no top-level work)
 *
 * Key invariants:
 *   - Default exports from section files are renamed to named exports here so the
 *     public API is uniformly named (no per-import .default disambiguation).
 *   - This file is checked by Nx's enforce-module-boundaries; cross-feature imports
 *     of console must come through here.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

export { ConsoleShell } from './components/console-shell';

export { default as OverviewSection } from './components/sections/overview-section';
export { default as ProfileSection } from './components/sections/profile-section';
export { default as VerificationSection } from './components/sections/verification-section';
export { default as SecuritySection } from './components/sections/security-section';
export { default as AccountsSection } from './components/sections/accounts-section';
export { default as FundingSection } from './components/sections/funding-section';
export { default as PreferencesSection } from './components/sections/preferences-section';
export { default as NotificationsSection } from './components/sections/notifications-section';
export { default as ApiSection } from './components/sections/api-section';
export { default as StatementsSection } from './components/sections/statements-section';
export { default as ReferralsSection } from './components/sections/referrals-section';
export { default as AppearanceSection } from './components/sections/appearance-section';

export { useConsoleUser, useConsoleSpark } from './lib/use-console-user';
export {
  SECTIONS,
  SECTION_DESC,
  SECTION_GROUPS,
  GROUP_LABELS,
  type ConsoleSection,
  type ConsoleSectionId,
  type ConsoleSectionGroup,
} from './lib/sections';
export type {
  AccountTier,
  ApiKey,
  ConsoleUser,
  Device,
  KycState,
  LoginEvent,
  PaymentMethod,
  TradingAccount,
  Transaction,
  TwoFAState,
} from './lib/seed-data';
