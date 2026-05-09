/**
 * @file types.ts
 * @module web
 * @description Settings feature types for security, sessions, API keys, and preferences.
 * @author BharatERP
 * @created 2026-04-16
 */

export type SecuritySettings = {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  loginNotifications: boolean;
};

export type ActiveSession = {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
};

export type ApiKey = {
  id: string;
  label: string;
  keyMasked: string;
  created: string;
  lastUsed: string;
  permissions: string[];
};

export type UserPreferences = {
  theme: 'dark' | 'light' | 'system';
  density: 'comfortable' | 'compact';
  defaultLeverage: string;
  timezone: string;
  dateFormat: string;
};
