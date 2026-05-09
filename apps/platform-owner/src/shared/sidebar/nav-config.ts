/**
 * File:        apps/platform-owner/src/shared/sidebar/nav-config.ts
 * Module:      platform-owner · Navigation
 * Purpose:     Full sidebar navigation tree mirroring legacy ObsidianHub nav structure
 *
 * Exports:
 *   - NAV_GROUPS (NavGroup[]) — 8 navigation groups with all 20+ items
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import type { NavGroup } from '../../lib/types';

export const NAV_GROUPS: NavGroup[] = [
  {
    section: 'OVERVIEW',
    items: [
      { id: 'dashboard',  label: 'Dashboard',          href: '/dashboard' },
      { id: 'health',     label: 'Platform Health',    href: '/health' },
      { id: 'activity',   label: 'Live Activity',      href: '/activity' },
    ],
  },
  {
    section: 'TENANTS',
    items: [
      { id: 'brokers',    label: 'All Brokers',        href: '/brokers',    badge: '14' },
      { id: 'onboarding', label: 'Onboarding Queue',  href: '/onboarding', badge: '2' },
      { id: 'suspended',  label: 'Suspended',          href: '/suspended',  badge: '1', badgeWarn: true },
      { id: 'features',   label: 'Feature Requests',  href: '/feature-requests', badge: '7' },
    ],
  },
  {
    section: 'PLATFORM',
    items: [
      { id: 'instruments', label: 'Instruments',       href: '/instruments' },
      { id: 'lps',         label: 'Liquidity Providers', href: '/liquidity-providers' },
      { id: 'pricing',     label: 'Pricing Engine',    href: '/pricing' },
      { id: 'fees',        label: 'Fee Schedules',     href: '/fees' },
    ],
  },
  {
    section: 'INFRA',
    items: [
      { id: 'nodes',   label: 'Server Nodes',     href: '/nodes' },
      { id: 'gateway', label: 'API Gateway',      href: '/api-gateway' },
      { id: 'ws',      label: 'WebSocket Feeds',  href: '/websocket-feeds' },
      { id: 'db',      label: 'Database Health',  href: '/database-health' },
    ],
  },
  {
    section: 'FINANCE',
    items: [
      { id: 'revenue',  label: 'SaaS Revenue', href: '/revenue' },
      { id: 'billing',  label: 'Billing',      href: '/billing' },
      { id: 'invoices', label: 'Invoices',     href: '/invoices' },
    ],
  },
  {
    section: 'COMPLIANCE',
    items: [
      { id: 'compliance', label: 'Global Limits',   href: '/compliance' },
      { id: 'aml',        label: 'AML Rules',       href: '/aml' },
      { id: 'incidents',  label: 'Incident Log',    href: '/incidents' },
    ],
  },
  {
    section: 'DEVELOPER',
    items: [
      { id: 'developer', label: 'Dev Portal',       href: '/developer' },
      { id: 'webhooks',  label: 'Webhook Registry', href: '/webhooks' },
      { id: 'sdks',      label: 'SDK Versions',     href: '/sdks' },
    ],
  },
  {
    section: 'SETTINGS',
    items: [
      { id: 'team',           label: 'Team',           href: '/team' },
      { id: 'audit-controls', label: 'Audit Log',      href: '/audit-controls' },
      { id: 'notifications',  label: 'Notifications',  href: '/notifications' },
      { id: 'settings',       label: 'Settings',       href: '/settings' },
    ],
  },
];
