/**
 * @file security-section.tsx
 * @module web
 * @description Security settings section with 2FA, password, and notification toggles.
 * @author BharatERP
 * @created 2026-04-16
 */

import { Card, CardHeader, CardTitle, CardContent } from '@obsidian/obsidian-ui';
import type { SecuritySettings } from '../lib/types';

function SettingRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-obsidian-border/50 py-3 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-obsidian-secondary">{sub}</p>}
      </div>
      <span className="font-mono text-sm text-obsidian-secondary">{value}</span>
    </div>
  );
}

export function SecuritySection({ security }: { security: SecuritySettings }) {
  return (
    <Card data-testid="security-section">
      <CardHeader>
        <CardTitle className="text-base">Security</CardTitle>
      </CardHeader>
      <CardContent>
        <SettingRow
          label="Two-Factor Authentication"
          value={security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          sub="TOTP-based authenticator app"
        />
        <SettingRow
          label="Password"
          value={`Changed ${security.lastPasswordChange}`}
          sub="Use a strong, unique password"
        />
        <SettingRow
          label="Login Notifications"
          value={security.loginNotifications ? 'Enabled' : 'Disabled'}
          sub="Email alerts on new sign-ins"
        />
      </CardContent>
    </Card>
  );
}
