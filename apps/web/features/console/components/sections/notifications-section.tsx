/**
 * File:        apps/web/features/console/components/sections/notifications-section.tsx
 * Module:      web · Console · Notifications
 * Purpose:     /console/notifications — channel verification card, channel × event
 *              opt-in matrix (with locked critical-channel cells), price-alert table.
 *
 * Exports:
 *   - default NotificationsSection
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — ObsidianBadge, ObsidianIcon, ObsidianToggle, useToast
 *   - ../../lib/use-console-user
 *
 * Side-effects:
 *   - Local React state. Toast on save.
 *   - [SonuRamTODO] Persist preferences via PUT /v1/users/me/notifications.
 *
 * Key invariants:
 *   - 'margin' × 'sms' is locked ON (critical for margin-call safety).
 *   - 'logins' × 'email' is locked ON (security-critical for new-device sign-ins).
 *   - These pairs are uncheckable from the UI; clicking renders a lock icon.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as React from 'react';

import {
  ObsidianBadge,
  ObsidianIcon,
  ObsidianToggle,
  type ObsidianIconName,
  useToast,
} from '@obsidian/obsidian-ui';

import { useConsoleUser } from '../../lib/use-console-user';

type ChannelId = 'in' | 'email' | 'push' | 'sms';
type EventId =
  | 'execution'
  | 'margin'
  | 'deposits'
  | 'withdrawals'
  | 'logins'
  | 'price_alerts'
  | 'news_high'
  | 'news_economic'
  | 'marketing';

const CHANNELS: ReadonlyArray<{ id: ChannelId; label: string; icon: ObsidianIconName }> = [
  { id: 'in',    label: 'In-app', icon: 'Monitor' },
  { id: 'email', label: 'Email',  icon: 'Mail' },
  { id: 'push',  label: 'Push',   icon: 'Smartphone' },
  { id: 'sms',   label: 'SMS',    icon: 'MessageSquare' },
];

const EVENTS: ReadonlyArray<{
  id: EventId;
  group: 'Trading' | 'Funding' | 'Security' | 'Markets' | 'Other';
  title: string;
  detail: string;
}> = [
  { id: 'execution',     group: 'Trading',  title: 'Order execution',     detail: 'Fills, partial fills, rejections' },
  { id: 'margin',        group: 'Trading',  title: 'Margin calls',        detail: 'Critical · cannot be disabled for SMS' },
  { id: 'deposits',      group: 'Funding',  title: 'Deposits',            detail: 'Confirmed and credited' },
  { id: 'withdrawals',   group: 'Funding',  title: 'Withdrawals',         detail: 'Submitted, approved, paid' },
  { id: 'logins',        group: 'Security', title: 'New device sign-in', detail: 'Always on for unrecognized devices' },
  { id: 'price_alerts',  group: 'Markets',  title: 'Price alerts you set', detail: 'Triggers from your alert list' },
  { id: 'news_high',     group: 'Markets',  title: 'High-impact news',    detail: 'FOMC, NFP, CPI · ~5 min before' },
  { id: 'news_economic', group: 'Markets',  title: 'Economic calendar',   detail: 'All medium+ impact events' },
  { id: 'marketing',     group: 'Other',    title: 'Product updates',     detail: 'New instruments, platform releases' },
];

const INITIAL_MATRIX: Record<EventId, Record<ChannelId, boolean>> = {
  execution:     { in: true,  email: true,  push: true,  sms: false },
  margin:        { in: true,  email: true,  push: true,  sms: true  },
  deposits:      { in: true,  email: true,  push: false, sms: false },
  withdrawals:   { in: true,  email: true,  push: true,  sms: true  },
  logins:        { in: false, email: true,  push: false, sms: false },
  price_alerts:  { in: true,  email: false, push: true,  sms: false },
  news_high:     { in: true,  email: false, push: true,  sms: false },
  news_economic: { in: true,  email: false, push: false, sms: false },
  marketing:     { in: false, email: false, push: false, sms: false },
};

function isLocked(eid: EventId, ch: ChannelId): boolean {
  return (eid === 'margin' && ch === 'sms') || (eid === 'logins' && ch === 'email');
}

const PRICE_ALERTS: ReadonlyArray<readonly [string, string, string, ReadonlyArray<string>, 'armed' | 'triggered']> = [
  ['EUR/USD',  'crosses above',  '1.09850',   ['Push', 'In-app'],     'armed'],
  ['XAU/USD',  'drops below',    '2,310.00',  ['Email', 'Push'],      'armed'],
  ['BTC/USD',  'moves ±5%',      '—',         ['Push'],               'armed'],
  ['NAS100',   'crosses above',  '18,400',    ['Email'],              'triggered'],
];

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

export default function NotificationsSection() {
  const user = useConsoleUser();
  const toast = useToast();
  const [matrix, setMatrix] = React.useState(INITIAL_MATRIX);
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [quiet, setQuiet] = React.useState(false);

  const groups: Array<typeof EVENTS[number]['group']> = Array.from(
    new Set(EVENTS.map((e) => e.group)),
  );

  const toggleCell = (eid: EventId, ch: ChannelId) => {
    if (isLocked(eid, ch)) return;
    setMatrix((m) => ({ ...m, [eid]: { ...m[eid], [ch]: !m[eid][ch] } }));
  };

  return (
    <>
      <section className="sec">
        <div className="sec-hd">
          <h2>Channels</h2>
          <div className="line" />
        </div>
        <div className="card">
          <FieldRow label="Email">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="mono" style={{ fontSize: 12 }}>
                {user.email}
              </span>
              <ObsidianBadge kind="bull" dot>
                Verified
              </ObsidianBadge>
            </div>
          </FieldRow>
          <FieldRow label="SMS">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="mono" style={{ fontSize: 12 }}>
                {user.phone}
              </span>
              <ObsidianBadge kind="bull" dot>
                Verified
              </ObsidianBadge>
            </div>
          </FieldRow>
          <FieldRow
            label="Push notifications"
            hint="iOS · 1 device · Android · not paired"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ObsidianToggle on={pushEnabled} onChange={setPushEnabled} aria-label="Push notifications" />
              <span className="muted small">
                {pushEnabled ? 'Enabled on iPhone 15 Pro' : 'Disabled on all devices'}
              </span>
            </div>
          </FieldRow>
          <FieldRow label="Quiet hours" hint="Mute non-critical alerts during these hours.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ObsidianToggle on={quiet} onChange={setQuiet} aria-label="Enable quiet hours" />
              {quiet && (
                <div className="ip-row">
                  <div className="ip">
                    <input type="text" defaultValue="22:00" />
                  </div>
                  <span className="muted small" style={{ alignSelf: 'center' }}>
                    to
                  </span>
                  <div className="ip">
                    <input type="text" defaultValue="07:00" />
                  </div>
                </div>
              )}
            </div>
          </FieldRow>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Event matrix</h2>
          <div className="line" />
          <span className="muted small">Toggle which events reach you on each channel.</span>
        </div>
        <div className="card flush">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Event</th>
                {CHANNELS.map((c) => (
                  <th key={c.id} style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <ObsidianIcon name={c.icon} size={11} />
                      {c.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <React.Fragment key={g}>
                  <tr>
                    <td
                      colSpan={1 + CHANNELS.length}
                      style={{ background: 'var(--bg-base)', padding: '6px 14px' }}
                    >
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
                        {g}
                      </span>
                    </td>
                  </tr>
                  {EVENTS.filter((e) => e.group === g).map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{e.title}</div>
                        <div
                          style={{ fontSize: 10, color: 'var(--fg3)', marginTop: 2 }}
                        >
                          {e.detail}
                        </div>
                      </td>
                      {CHANNELS.map((c) => {
                        const locked = isLocked(e.id, c.id);
                        const checked = matrix[e.id][c.id];
                        return (
                          <td key={c.id} style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => toggleCell(e.id, c.id)}
                              disabled={locked}
                              aria-label={`${e.title} on ${c.label}`}
                              aria-pressed={checked}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 22,
                                height: 22,
                                borderRadius: 4,
                                background: checked ? 'var(--accent-dim)' : 'transparent',
                                border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                                color: checked ? 'var(--accent)' : 'var(--fg4)',
                                cursor: locked ? 'not-allowed' : 'pointer',
                                opacity: locked ? 0.7 : 1,
                              }}
                            >
                              {checked && (
                                <ObsidianIcon name={locked ? 'Lock' : 'Check'} size={11} />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Price alerts</h2>
          <div className="line" />
          <button type="button" className="btn sm primary">
            <ObsidianIcon name="Plus" size={11} />
            New alert
          </button>
        </div>
        <div className="card flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Condition</th>
                <th className="num">Trigger</th>
                <th>Channels</th>
                <th>Status</th>
                <th aria-label="row actions" />
              </tr>
            </thead>
            <tbody>
              {PRICE_ALERTS.map(([sym, cond, trig, chans, st], i) => (
                <tr key={`${sym}-${i}`}>
                  <td className="mono strong">{sym}</td>
                  <td>{cond}</td>
                  <td className="num mono">{trig}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {chans.map((x) => (
                        <ObsidianBadge key={x} kind="muted">
                          {x}
                        </ObsidianBadge>
                      ))}
                    </div>
                  </td>
                  <td>
                    <ObsidianBadge kind={st === 'armed' ? 'bull' : 'warn'} dot={st === 'armed'}>
                      {st}
                    </ObsidianBadge>
                  </td>
                  <td style={{ width: 1 }}>
                    <button type="button" className="btn sm ghost" aria-label="Alert actions">
                      <ObsidianIcon name="MoreHorizontal" size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
        <button
          type="button"
          className="btn primary"
          onClick={() => toast.push({ kind: 'bull', title: 'Notification settings saved' })}
        >
          Save
        </button>
      </div>
    </>
  );
}
