/**
 * @file sessions-table.tsx
 * @module web
 * @description Active sessions table with revoke action.
 * @author BharatERP
 * @created 2026-04-16
 */

'use client';

import { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@obsidian/obsidian-ui';
import type { ActiveSession } from '../lib/types';

export function SessionsTable({ initialSessions }: { initialSessions: ActiveSession[] }) {
  const [sessions, setSessions] = useState(initialSessions);

  function handleRevoke(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <Card data-testid="sessions-section">
      <CardHeader>
        <CardTitle className="text-base">Active Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-obsidian-border text-left text-xs uppercase tracking-wider text-obsidian-faint">
                <th className="px-3 py-2">Device</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Last Active</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-obsidian-border/50 hover:bg-obsidian-muted/50" data-testid={`session-row-${s.id}`}>
                  <td className="px-3 py-2">
                    <span className="text-sm font-medium">{s.device}</span>
                    {s.isCurrent && (
                      <span className="ml-2 rounded bg-[var(--bull)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--bull)]">
                        CURRENT
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-obsidian-secondary">{s.ip}</td>
                  <td className="px-3 py-2 text-xs text-obsidian-secondary">{s.location}</td>
                  <td className="px-3 py-2 text-xs text-obsidian-secondary">{s.lastActive}</td>
                  <td className="px-3 py-2">
                    {!s.isCurrent && (
                      <Button variant="destructive" size="sm" onClick={() => handleRevoke(s.id)} data-testid={`revoke-${s.id}`}>
                        Revoke
                      </Button>
                    )}
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
