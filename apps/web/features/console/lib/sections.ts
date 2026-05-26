/**
 * File:        apps/web/features/console/lib/sections.ts
 * Module:      web · Console · Sections
 * Purpose:     Single source of truth for the 12 console sections — id, label,
 *              icon, group, route href, and the descriptive subtitle shown in
 *              the main header. Every other surface (sidebar, header, beads
 *              follow-up referencing) reads from here.
 *
 * Exports:
 *   - SECTIONS       — readonly array of ConsoleSection
 *   - SECTION_DESC   — Record<ConsoleSectionId, string> for subtitles
 *   - SECTION_GROUPS — readonly tuple of group ids in display order
 *   - GROUP_LABELS   — Record<group, string>
 *   - ConsoleSection, ConsoleSectionId, ConsoleSectionGroup types
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — type-only ObsidianIconName
 *
 * Side-effects:
 *   - none (pure constants)
 *
 * Key invariants:
 *   - The order of SECTIONS is the visual order in the sidebar; do not sort it later.
 *   - Every section's `href` follows /console/<id> with the exception of `overview`
 *     which is /console (the index).
 *   - Icon names must exist in lucide-react; the ObsidianIconName type guards this.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import type { ObsidianIconName } from '@obsidian/obsidian-ui';

export type ConsoleSectionId =
  | 'overview'
  | 'profile'
  | 'verification'
  | 'security'
  | 'accounts'
  | 'funding'
  | 'preferences'
  | 'notifications'
  | 'api'
  | 'statements'
  | 'referrals'
  | 'appearance';

export type ConsoleSectionGroup = 'account' | 'trading' | 'advanced';

export type ConsoleSection = {
  id: ConsoleSectionId;
  label: string;
  icon: ObsidianIconName;
  group: ConsoleSectionGroup;
  href: string;
};

export const SECTIONS: ReadonlyArray<ConsoleSection> = [
  { id: 'overview',      label: 'Overview',           icon: 'LayoutDashboard',     group: 'account',  href: '/console' },
  { id: 'profile',       label: 'Profile',            icon: 'User',                group: 'account',  href: '/console/profile' },
  { id: 'verification',  label: 'Verification',       icon: 'ShieldCheck',         group: 'account',  href: '/console/verification' },
  { id: 'security',      label: 'Security',           icon: 'Lock',                group: 'account',  href: '/console/security' },
  { id: 'accounts',      label: 'Trading Accounts',   icon: 'Wallet',              group: 'trading',  href: '/console/accounts' },
  { id: 'funding',       label: 'Funding',            icon: 'ArrowDownUp',         group: 'trading',  href: '/console/funding' },
  { id: 'preferences',   label: 'Trade Preferences',  icon: 'SlidersHorizontal',   group: 'trading',  href: '/console/preferences' },
  { id: 'notifications', label: 'Notifications',      icon: 'Bell',                group: 'trading',  href: '/console/notifications' },
  { id: 'api',           label: 'API & Connectivity', icon: 'Terminal',            group: 'advanced', href: '/console/api' },
  { id: 'statements',    label: 'Statements & Tax',   icon: 'FileText',            group: 'advanced', href: '/console/statements' },
  { id: 'referrals',     label: 'Referrals & IB',     icon: 'Users',               group: 'advanced', href: '/console/referrals' },
  { id: 'appearance',    label: 'Appearance',         icon: 'Palette',             group: 'advanced', href: '/console/appearance' },
];

export const SECTION_GROUPS: ReadonlyArray<ConsoleSectionGroup> = ['account', 'trading', 'advanced'];

export const GROUP_LABELS: Record<ConsoleSectionGroup, string> = {
  account:  'Account',
  trading:  'Trading',
  advanced: 'Advanced',
};

export const SECTION_DESC: Record<ConsoleSectionId, string> = {
  overview:      'At-a-glance view of your accounts, recent activity and security posture.',
  profile:       'Manage your personal information, contact details and locale preferences.',
  verification:  'Submit and track identity-verification documents to unlock trading features.',
  security:      'Password, two-factor authentication, devices and recent sign-in activity.',
  accounts:      'Open, configure and manage your live and demo trading accounts.',
  funding:       'Deposit, withdraw and transfer funds between your accounts.',
  preferences:   'Order entry defaults, hotkeys, chart options and risk controls.',
  notifications: "Choose what we tell you about, and on which channel.",
  api:           'Programmatic access · API keys, webhooks, and FIX connectivity.',
  statements:    'Account statements, tax documents and scheduled reports.',
  referrals:     'Refer-a-friend rewards and Introducing Broker dashboard.',
  appearance:    'Theme, density, accent colour and chart styling.',
};
