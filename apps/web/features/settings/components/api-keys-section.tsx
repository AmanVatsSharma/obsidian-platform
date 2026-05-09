/**
 * @file api-keys-section.tsx
 * @module web
 * @description API key management section with masked keys and permission tags.
 * @author BharatERP
 * @created 2026-04-16
 */

import { Card, CardHeader, CardTitle, CardContent } from '@obsidian/obsidian-ui';
import type { ApiKey } from '../lib/types';

export function ApiKeysSection({ keys }: { keys: ApiKey[] }) {
  return (
    <Card data-testid="api-keys-section">
      <CardHeader>
        <CardTitle className="text-base">API Keys</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-obsidian-border text-left text-xs uppercase tracking-wider text-obsidian-faint">
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2">Key</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Last Used</th>
                <th className="px-3 py-2">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-obsidian-border/50 hover:bg-obsidian-muted/50" data-testid={`api-key-row-${k.id}`}>
                  <td className="px-3 py-2 text-sm font-medium">{k.label}</td>
                  <td className="px-3 py-2 font-mono text-xs text-obsidian-faint">{k.keyMasked}</td>
                  <td className="px-3 py-2 text-xs text-obsidian-secondary">{k.created}</td>
                  <td className="px-3 py-2 text-xs text-obsidian-secondary">{k.lastUsed}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {k.permissions.map((p) => (
                        <span key={p} className="rounded bg-obsidian-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-obsidian-secondary">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
