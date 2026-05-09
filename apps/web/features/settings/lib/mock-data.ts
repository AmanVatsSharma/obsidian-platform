/**
 * @file mock-data.ts
 * @module web
 * @description Mock security state, sessions, API keys, and preferences for settings page.
 * @author BharatERP
 * @created 2026-04-16
 */

import type { ActiveSession, ApiKey, SecuritySettings, UserPreferences } from './types';

export const SECURITY: SecuritySettings = {
  twoFactorEnabled: true,
  lastPasswordChange: '2026-03-01',
  loginNotifications: true,
};

export const SESSIONS: ActiveSession[] = [
  { id: 'S001', device: 'Chrome / macOS', ip: '103.21.xx.xx', location: 'Mumbai, IN', lastActive: '2026-04-16 14:30', isCurrent: true },
  { id: 'S002', device: 'Safari / iOS', ip: '103.21.xx.xx', location: 'Mumbai, IN', lastActive: '2026-04-16 12:15', isCurrent: false },
  { id: 'S003', device: 'Chrome / Windows', ip: '49.36.xx.xx', location: 'Delhi, IN', lastActive: '2026-04-14 09:00', isCurrent: false },
];

export const API_KEYS: ApiKey[] = [
  { id: 'K001', label: 'Trading Bot v2', keyMasked: 'nt_live_****A8xK', created: '2026-02-10', lastUsed: '2026-04-16', permissions: ['read', 'trade'] },
  { id: 'K002', label: 'Portfolio Tracker', keyMasked: 'nt_live_****3mPq', created: '2026-03-05', lastUsed: '2026-04-15', permissions: ['read'] },
];

export const PREFERENCES: UserPreferences = {
  theme: 'dark',
  density: 'comfortable',
  defaultLeverage: '1:100',
  timezone: 'Asia/Kolkata (IST)',
  dateFormat: 'DD/MM/YYYY',
};
