/**
 * @file settings-page.tsx
 * @module web
 * @description Main settings page composing security, sessions, API keys, and preferences.
 *              Also surfaces a discovery banner pointing to the new Account Console
 *              (/console), which is the long-term destination for these surfaces.
 * @author BharatERP
 * @created 2026-04-16
 * @last-updated 2026-05-09
 */

'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

import { SECURITY, SESSIONS, API_KEYS, PREFERENCES } from '../lib/mock-data';
import { SecuritySection } from './security-section';
import { SessionsTable } from './sessions-table';
import { ApiKeysSection } from './api-keys-section';
import { PreferencesSection } from './preferences-section';

function ConsoleDiscoveryBanner() {
  return (
    <Link
      href="/console"
      className="flex items-center gap-3 rounded-obs border border-obsidian-border bg-obsidian-elevated px-4 py-3 text-sm text-obsidian-primary transition-colors hover:border-[color:var(--accent)] hover:bg-obsidian-muted"
      style={{
        background: 'linear-gradient(180deg, rgba(59,130,246,0.04), transparent)',
        textDecoration: 'none',
      }}
    >
      <Sparkles size={16} className="shrink-0 text-[color:var(--accent)]" />
      <div className="flex-1">
        <div className="text-[13px] font-semibold">Try the new Account console</div>
        <div className="mt-[2px] text-[11px] text-obsidian-secondary">
          Profile, security, KYC, trading accounts, funding, API &amp; appearance — all in one place.
        </div>
      </div>
      <ArrowRight size={14} className="text-[color:var(--accent)]" />
    </Link>
  );
}

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-6" data-testid="settings-page">
      <ConsoleDiscoveryBanner />
      <SecuritySection security={SECURITY} />
      <SessionsTable initialSessions={SESSIONS} />
      <ApiKeysSection keys={API_KEYS} />
      <PreferencesSection preferences={PREFERENCES} />
    </div>
  );
}
