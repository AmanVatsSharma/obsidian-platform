/**
 * @file preferences-section.tsx
 * @module web
 * @description User preferences display section (theme, density, timezone, leverage).
 * @author BharatERP
 * @created 2026-04-16
 */

import { Card, CardHeader, CardTitle, CardContent } from '@obsidian/obsidian-ui';
import type { UserPreferences } from '../lib/types';

function PrefRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-obsidian-border/50 py-3 last:border-0">
      <p className="text-sm text-obsidian-secondary">{label}</p>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

export function PreferencesSection({ preferences }: { preferences: UserPreferences }) {
  return (
    <Card data-testid="preferences-section">
      <CardHeader>
        <CardTitle className="text-base">Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <PrefRow label="Theme" value={preferences.theme} />
        <PrefRow label="Density" value={preferences.density} />
        <PrefRow label="Default Leverage" value={preferences.defaultLeverage} />
        <PrefRow label="Timezone" value={preferences.timezone} />
        <PrefRow label="Date Format" value={preferences.dateFormat} />
      </CardContent>
    </Card>
  );
}
