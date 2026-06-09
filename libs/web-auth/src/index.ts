/**
 * File:        libs/web-auth/src/index.ts
 * Module:      web-auth · Public Surface
 * Purpose:     Barrel export for @obsidian/web-auth — the shared Obsidian authentication
 *              UI library used across platform-owner, broker-admin, and web (trader) apps.
 *
 * Exports:
 *   Types/Utilities:
 *     - SessionPrincipal — { userId, tenantId, roles }
 *     - hasRole(principal, role) → boolean
 *   Shared UI: AuthShell, FormCard, StepIndicator, MarketHero, ObsidianLogo, SparkChart,
 *              TextInput, PrimaryButton, GhostButton, FieldLabel, Divider, LegalFooter, AuthIcons
 *   Screens: LoginScreen, SignUpScreen, ForgotScreen, EmailVerifyScreen, TwoFAScreen,
 *            KYCScreen, ExperienceScreen, RiskProfileScreen
 *
 * Side-effects: none — CSS must be imported by consumer (auth.css + obsidian-ui tokens.css)
 * Key invariants:
 *   - All screen components are render-only; navigation / data via callback props
 *   - CSS variables must be in scope (provided by obsidian-ui tokens.css)
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-10
 */

// ─── Types & utilities ──────────────────────────────────────────
export type SessionPrincipal = {
  userId: string;
  tenantId: string;
  roles: string[];
};

export function hasRole(principal: SessionPrincipal, role: string): boolean {
  return principal.roles.includes(role);
}

// ─── Shared components ──────────────────────────────────────────
export { AuthShell } from './components/shared/auth-shell';
export { FormCard, StepIndicator } from './components/shared/form-card';
export { MarketHero } from './components/shared/market-hero';
export { ObsidianLogo } from './components/shared/obsidian-logo';
export { SparkChart } from './components/shared/spark-chart';
export { TextInput, PrimaryButton, GhostButton, FieldLabel, Divider, LegalFooter } from './components/shared/primitives';
export { AuthIcons } from './components/shared/icons';
export { CountrySelector } from './components/shared/country-selector';
export { OtpInput } from './components/shared/otp-input';

// ─── Auth screens ───────────────────────────────────────────────
export { LoginScreen } from './components/screens/login-screen';
export { SignUpScreen } from './components/screens/sign-up-screen';
export { ForgotScreen } from './components/screens/forgot-screen';
export { EmailVerifyScreen } from './components/screens/email-verify-screen';
export { TwoFAScreen } from './components/screens/two-fa-screen';
export { KYCScreen } from './components/screens/kyc-screen';
export { ExperienceScreen } from './components/screens/experience-screen';
export { RiskProfileScreen } from './components/screens/risk-profile-screen';
