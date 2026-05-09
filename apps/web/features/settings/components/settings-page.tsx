/**
 * @file settings-page.tsx
 * @module web
 * @description Main settings page composing security, sessions, API keys, and preferences.
 * @author BharatERP
 * @created 2026-04-16
 */

'use client';

import { SECURITY, SESSIONS, API_KEYS, PREFERENCES } from '../lib/mock-data';
import { SecuritySection } from './security-section';
import { SessionsTable } from './sessions-table';
import { ApiKeysSection } from './api-keys-section';
import { PreferencesSection } from './preferences-section';

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6" data-testid="settings-page">
      <SecuritySection security={SECURITY} />
      <SessionsTable initialSessions={SESSIONS} />
      <ApiKeysSection keys={API_KEYS} />
      <PreferencesSection preferences={PREFERENCES} />
    </div>
  );
}
