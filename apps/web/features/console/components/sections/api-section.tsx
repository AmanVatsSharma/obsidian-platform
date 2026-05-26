/**
 * File:        apps/web/features/console/components/sections/api-section.tsx
 * Module:      web · Console · API & Connectivity
 * Purpose:     /console/api — REST/WS hero card, API keys table with revoke,
 *              IP allowlist, webhooks table, and a "create API key" modal with
 *              scope toggles.
 *
 * Exports:
 *   - default ApiSection
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — ObsidianBadge, ObsidianIcon, ObsidianSelect,
 *                              ObsidianToggle, useToast
 *   - ../local/console-modal
 *   - ../../lib/use-console-user
 *
 * Side-effects:
 *   - Local list state for API keys (create / revoke). Toasts on action.
 *   - [SonuRamTODO] Wire to backend: GET / POST / DELETE /v1/api-keys, /v1/webhooks.
 *
 * Key invariants:
 *   - The "Withdraw" scope toggle uses bear styling — it grants funds-movement
 *     authority and should always be visually loud.
 *   - When a key is created, the secret would normally be shown once; we toast a
 *     warning so the implementation matches the design's "Copy now" affordance.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as React from 'react';

import {
  ObsidianBadge,
  ObsidianIcon,
  ObsidianSelect,
  ObsidianToggle,
  useToast,
} from '@obsidian/obsidian-ui';

import type { ApiKey } from '../../lib/seed-data';
import { useConsoleUser } from '../../lib/use-console-user';
import { ConsoleModal } from '../local/console-modal';

type Scopes = { read: boolean; trade: boolean; withdraw: boolean };

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="frow">
      <div className="lbl">
        {label}
        {hint && <span className="hint">{hint}</span>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--fg3)',
        }}
      >
        {label}
      </span>
      <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

function ScopeRow({
  label,
  detail,
  on,
  onChange,
  warn,
  danger,
}: {
  label: string;
  detail: string;
  on: boolean;
  onChange: (v: boolean) => void;
  warn?: boolean;
  danger?: boolean;
}) {
  const bg = on
    ? danger
      ? 'rgba(255,59,92,0.05)'
      : warn
        ? 'rgba(245,158,11,0.05)'
        : 'var(--bg-active)'
    : 'var(--bg-elevated)';
  const border = on
    ? danger
      ? 'rgba(255,59,92,0.4)'
      : warn
        ? 'rgba(245,158,11,0.4)'
        : 'var(--accent)'
    : 'var(--border)';
  const labelColor = danger ? 'var(--bear)' : warn ? 'var(--warn)' : 'var(--fg1)';
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 6,
        cursor: 'pointer',
      }}
    >
      <ObsidianToggle on={on} onChange={onChange} aria-label={label} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: labelColor }}>{label}</div>
        <div style={{ fontSize: 10, color: 'var(--fg3)', marginTop: 2 }}>{detail}</div>
      </div>
    </label>
  );
}

export default function ApiSection() {
  const user = useConsoleUser();
  const toast = useToast();
  const [keys, setKeys] = React.useState<ReadonlyArray<ApiKey>>(user.apiKeys);
  const [newOpen, setNewOpen] = React.useState(false);
  const [draftName, setDraftName] = React.useState('');
  const [scopes, setScopes] = React.useState<Scopes>({
    read: true,
    trade: false,
    withdraw: false,
  });

  const allowedIps = Array.from(new Set(user.apiKeys.flatMap((k) => k.ips)));

  const create = () => {
    const id = 'ak_' + Math.random().toString(36).slice(2, 6);
    const enabled = (Object.keys(scopes) as Array<keyof Scopes>).filter((s) => scopes[s]) as Array<
      'read' | 'trade' | 'withdraw'
    >;
    setKeys((prev) => [
      {
        id,
        name: draftName || 'New key',
        scopes: enabled,
        created: '2026-05-09',
        lastUsed: '—',
        ips: [],
      },
      ...prev,
    ]);
    setNewOpen(false);
    setDraftName('');
    setScopes({ read: true, trade: false, withdraw: false });
    toast.push({
      kind: 'bull',
      title: 'API key created',
      detail: "Copy the secret now — it won't be shown again.",
    });
  };

  const revoke = (k: ApiKey) => {
    setKeys((prev) => prev.filter((x) => x.id !== k.id));
    toast.push({ kind: 'warn', title: 'Key revoked', detail: k.id });
  };

  return (
    <>
      <section className="sec">
        <div className="card" style={{ background: 'linear-gradient(180deg, rgba(59,130,246,0.04), transparent)' }}>
          <div style={{ display: 'flex', gap: 18 }}>
            <span
              aria-hidden="true"
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ObsidianIcon name="Terminal" size={22} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
                REST &amp; WebSocket API
              </div>
              <div
                style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 4, lineHeight: 1.5 }}
              >
                Programmatic access to market data, account state, and order routing. FIX 4.4
                available on Pro tier with dedicated cross-connect.
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
                <Stat label="Base URL" value="api.obsidian.fx/v1" />
                <Stat label="WS feed" value="wss.obsidian.fx/v1" />
                <Stat label="Rate limit" value="600 req/min" />
                <Stat
                  label="FIX"
                  value={user.tier === 'platinum' ? 'us-east-1 · cross-connect' : 'Pro tier only'}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" className="btn">
                <ObsidianIcon name="BookOpen" size={12} />
                Documentation
              </button>
              <button type="button" className="btn">
                <ObsidianIcon name="Github" size={12} />
                SDKs
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>API keys</h2>
          <div className="line" />
          <button type="button" className="btn primary" onClick={() => setNewOpen(true)}>
            <ObsidianIcon name="Plus" size={12} />
            New API key
          </button>
        </div>
        <div className="card flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key ID</th>
                <th>Scopes</th>
                <th>Created</th>
                <th>Last used</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--fg3)' }}>
                    No API keys yet. Create one to start integrating.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{k.name}</div>
                      {k.ips.length > 0 && (
                        <div
                          className="mono"
                          style={{ fontSize: 10, color: 'var(--fg3)', marginTop: 2 }}
                        >
                          {k.ips.length} IP{k.ips.length > 1 ? 's' : ''} allowlisted
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="key">{k.id}•••••••••</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {k.scopes.map((s) => (
                          <ObsidianBadge
                            key={s}
                            kind={s === 'withdraw' ? 'bear' : s === 'trade' ? 'warn' : 'muted'}
                          >
                            {s}
                          </ObsidianBadge>
                        ))}
                      </div>
                    </td>
                    <td className="mono">{k.created}</td>
                    <td className="mono">{k.lastUsed}</td>
                    <td style={{ width: 1 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button type="button" className="btn sm ghost" aria-label="Edit">
                          <ObsidianIcon name="Edit2" size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn sm ghost danger"
                          aria-label={`Revoke ${k.name}`}
                          onClick={() => revoke(k)}
                        >
                          <ObsidianIcon name="Trash2" size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>IP allowlist</h2>
          <div className="line" />
        </div>
        <div className="card">
          <p className="muted small" style={{ marginBottom: 14 }}>
            Restrict API requests to these CIDR ranges. Empty = allow from anywhere (not
            recommended for trade-scoped keys).
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allowedIps.map((ip) => (
              <div
                key={ip}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                }}
              >
                <ObsidianIcon name="Globe" size={14} />
                <span className="mono" style={{ flex: 1, fontSize: 12 }}>
                  {ip}
                </span>
                <span className="muted small">added 2024-02-11</span>
                <button type="button" className="btn sm ghost danger" aria-label="Remove">
                  <ObsidianIcon name="X" size={11} />
                </button>
              </div>
            ))}
            <div className="ip-row">
              <div className="ip">
                <span className="pre">
                  <ObsidianIcon name="Plus" size={12} />
                </span>
                <input type="text" placeholder="0.0.0.0/0" />
              </div>
              <button type="button" className="btn">
                Add range
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Webhooks</h2>
          <div className="line" />
          <button type="button" className="btn sm">
            <ObsidianIcon name="Plus" size={11} />
            Add endpoint
          </button>
        </div>
        <div className="card flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Events</th>
                <th>Status</th>
                <th>Last delivery</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono">https://api.wexford-cap.io/obsidian/webhook</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <ObsidianBadge kind="muted">order.filled</ObsidianBadge>
                    <ObsidianBadge kind="muted">order.cancelled</ObsidianBadge>
                    <ObsidianBadge kind="muted">+3</ObsidianBadge>
                  </div>
                </td>
                <td>
                  <ObsidianBadge kind="bull" dot>
                    200 OK
                  </ObsidianBadge>
                </td>
                <td className="mono">2026-05-08 09:14:42</td>
                <td>
                  <button type="button" className="btn sm ghost" aria-label="actions">
                    <ObsidianIcon name="MoreHorizontal" size={12} />
                  </button>
                </td>
              </tr>
              <tr>
                <td className="mono">https://hooks.tradingview.com/svc/4j9d••</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <ObsidianBadge kind="muted">alert.triggered</ObsidianBadge>
                  </div>
                </td>
                <td>
                  <ObsidianBadge kind="warn" dot>
                    5xx · retrying
                  </ObsidianBadge>
                </td>
                <td className="mono">2026-05-08 08:47:11</td>
                <td>
                  <button type="button" className="btn sm ghost" aria-label="actions">
                    <ObsidianIcon name="MoreHorizontal" size={12} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <ConsoleModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Create API key"
        icon="KeyRound"
        footer={
          <>
            <button type="button" className="btn ghost" onClick={() => setNewOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn primary" onClick={create}>
              Generate key
            </button>
          </>
        }
      >
        <FieldRow label="Name" hint="Helps you remember what this key is for.">
          <div className="ip">
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Production · execution"
            />
          </div>
        </FieldRow>
        <FieldRow label="Scopes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ScopeRow
              label="Read"
              detail="Account, positions, market data"
              on={scopes.read}
              onChange={(v) => setScopes((s) => ({ ...s, read: v }))}
            />
            <ScopeRow
              label="Trade"
              detail="Place, modify, cancel orders"
              on={scopes.trade}
              onChange={(v) => setScopes((s) => ({ ...s, trade: v }))}
              warn
            />
            <ScopeRow
              label="Withdraw"
              detail="Initiate withdrawals to allowlisted methods"
              on={scopes.withdraw}
              onChange={(v) => setScopes((s) => ({ ...s, withdraw: v }))}
              danger
            />
          </div>
        </FieldRow>
        <FieldRow label="IP allowlist (optional)" hint="Comma-separated CIDR ranges.">
          <div className="ip">
            <input type="text" placeholder="44.214.88.0/24, 18.142.0.0/16" />
          </div>
        </FieldRow>
        <FieldRow label="Expires">
          <ObsidianSelect
            value={'Never' as const}
            onChange={() => undefined}
            options={['7 days', '30 days', '90 days', '1 year', 'Never'] as const}
          />
        </FieldRow>
      </ConsoleModal>
    </>
  );
}
