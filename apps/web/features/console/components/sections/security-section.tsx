/**
 * File:        apps/web/features/console/components/sections/security-section.tsx
 * Module:      web · Console · Security
 * Purpose:     /console/security — sign-in card (password, 2FA matrix, recovery codes,
 *              trusted IPs), active devices, recent sign-ins, danger zone, plus
 *              modals for password change and authenticator-app setup.
 *
 * Exports:
 *   - default SecuritySection
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — ObsidianBadge, ObsidianIcon, ObsidianProgress, ObsidianToggle, useToast
 *   - ../local/console-modal
 *   - ../../lib/use-console-user
 *
 * Side-effects:
 *   - Local modal state. Toasts on save. No real auth calls.
 *   - [SonuRamTODO] Wire to backend: PUT users/me/password, POST users/me/2fa/setup, etc.
 *
 * Key invariants:
 *   - The password strength meter rates 0..4 across length/upper/digit/symbol; submit is
 *     disabled below 'Strong' (3). Confirmation must match.
 *   - The QR code is a deterministic mock pattern (no real TOTP secret leaks); production
 *     wiring will fetch a server-issued provisioning URI.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as React from 'react';

import {
  ObsidianBadge,
  ObsidianIcon,
  ObsidianProgress,
  ObsidianToggle,
  type ObsidianIconName,
  useToast,
} from '@obsidian/obsidian-ui';

import { useConsoleUser } from '../../lib/use-console-user';
import { ConsoleModal } from '../local/console-modal';

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
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

function TfaRow({
  icon,
  label,
  detail,
  on,
  onClick,
  preferred,
}: {
  icon: ObsidianIconName;
  label: string;
  detail: string;
  on: boolean;
  onClick?: () => void;
  preferred?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 6,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: 'var(--bg-active)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--fg2)',
        }}
      >
        <ObsidianIcon name={icon} size={14} />
      </span>
      <div style={{ flex: 1 }}>
        <div
          style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {label}
          {preferred && <ObsidianBadge kind="accent">Preferred</ObsidianBadge>}
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--fg3)',
            fontFamily: 'var(--font-data)',
            marginTop: 2,
          }}
        >
          {detail}
        </div>
      </div>
      {on ? (
        <ObsidianBadge kind="bull" dot>
          On
        </ObsidianBadge>
      ) : (
        <button type="button" className="btn sm" onClick={onClick}>
          Set up
        </button>
      )}
      {on && <ObsidianToggle on={on} onChange={() => undefined} aria-label={`${label} toggle`} />}
    </div>
  );
}

export default function SecuritySection() {
  const user = useConsoleUser();
  const toast = useToast();

  const [pwOpen, setPwOpen] = React.useState(false);
  const [tfaOpen, setTfaOpen] = React.useState(false);
  const [pw, setPw] = React.useState({ cur: '', new: '', conf: '' });

  const pwStrength = React.useMemo(() => {
    const v = pw.new || '';
    let s = 0;
    if (v.length >= 10) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  }, [pw.new]);
  const pwLabel = ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent'][pwStrength] ?? 'Excellent';
  const pwKind = (['bear', 'bear', 'warn', 'bull', 'bull'] as const)[pwStrength] ?? 'bull';

  const submitPw = () => {
    setPwOpen(false);
    setPw({ cur: '', new: '', conf: '' });
    toast.push({
      kind: 'bull',
      title: 'Password changed',
      detail: 'All other sessions signed out',
    });
  };
  const submitTfa = () => {
    setTfaOpen(false);
    toast.push({
      kind: 'bull',
      title: '2FA enabled',
      detail: 'Authenticator app · use it next sign-in',
    });
  };

  return (
    <>
      <section className="sec">
        <div className="sec-hd">
          <h2>Sign-in</h2>
          <div className="line" />
        </div>
        <div className="card">
          <FieldRow
            label="Password"
            hint="Last changed 47 days ago. We recommend rotating every 90 days."
          >
            <button type="button" className="btn" onClick={() => setPwOpen(true)}>
              <ObsidianIcon name="Key" size={12} />
              Change password
            </button>
          </FieldRow>
          <FieldRow
            label="Two-factor authentication"
            hint="Required for withdrawals over €1,000."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <TfaRow
                icon="Smartphone"
                label="Authenticator app"
                detail="Google Authenticator, 1Password, Authy"
                on={user.twoFA.app}
                onClick={() => setTfaOpen(true)}
                preferred
              />
              <TfaRow
                icon="MessageSquare"
                label="SMS"
                detail={
                  user.twoFA.sms
                    ? '+•• ' + user.phone.slice(-4)
                    : 'Not configured · less secure than app'
                }
                on={user.twoFA.sms}
              />
              <TfaRow icon="Mail" label="Email" detail={user.email} on={user.twoFA.email} />
            </div>
          </FieldRow>
          <FieldRow
            label="Recovery codes"
            hint="Single-use codes for when you lose access to your second factor."
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn">
                <ObsidianIcon name="Download" size={12} />
                Download codes
              </button>
              <button type="button" className="btn ghost">
                <ObsidianIcon name="RefreshCw" size={12} />
                Regenerate
              </button>
            </div>
          </FieldRow>
          <FieldRow
            label="Trusted IPs"
            hint="Limit sign-in to specific addresses. Pro accounts only."
          >
            <div className="tags">
              <span className="key">85.47.213.0/24</span>
              <span className="key">82.31.114.21</span>
              <button type="button" className="btn sm ghost">
                <ObsidianIcon name="Plus" size={11} />
                Add IP
              </button>
            </div>
          </FieldRow>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Active devices</h2>
          <div className="line" />
          <button
            type="button"
            className="btn sm danger"
            onClick={() =>
              toast.push({
                kind: 'warn',
                title: 'All other devices signed out',
                detail: `${user.devices.filter((d) => !d.current).length} sessions revoked`,
              })
            }
          >
            Sign out all other devices
          </button>
        </div>
        <div className="card flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Device</th>
                <th>Location</th>
                <th>IP</th>
                <th>Last active</th>
                <th aria-label="row actions" />
              </tr>
            </thead>
            <tbody>
              {user.devices.map((d) => {
                const deviceIcon: ObsidianIconName =
                  d.os.includes('iOS') || d.os.includes('Android')
                    ? 'Smartphone'
                    : d.os.includes('macOS')
                      ? 'Laptop'
                      : 'Monitor';
                return (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          aria-hidden="true"
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--fg2)',
                          }}
                        >
                          <ObsidianIcon name={deviceIcon} size={14} />
                        </span>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {d.name}{' '}
                            {d.current && (
                              <ObsidianBadge kind="bull" dot>
                                This device
                              </ObsidianBadge>
                            )}
                          </div>
                          <div
                            className="mono"
                            style={{ fontSize: 10, color: 'var(--fg3)', marginTop: 2 }}
                          >
                            {d.os} · {d.browser}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{d.location}</td>
                    <td className="mono">{d.ip}</td>
                    <td
                      className="mono"
                      style={{
                        color: d.lastSeen.includes('now') ? 'var(--bull)' : 'var(--fg2)',
                      }}
                    >
                      {d.lastSeen}
                    </td>
                    <td style={{ width: 1 }}>
                      {!d.current && (
                        <button
                          type="button"
                          className="btn sm ghost danger"
                          style={{ background: 'none' }}
                          onClick={() =>
                            toast.push({
                              kind: 'warn',
                              title: 'Device signed out',
                              detail: d.name,
                            })
                          }
                        >
                          <ObsidianIcon name="LogOut" size={12} />
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Recent sign-ins</h2>
          <div className="line" />
          <button type="button" className="btn sm ghost">
            Download CSV
            <ObsidianIcon name="Download" size={11} />
          </button>
        </div>
        <div className="card flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Time (UTC)</th>
                <th>IP</th>
                <th>Location</th>
                <th>Device</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {user.loginHistory.map((h, i) => (
                <tr key={`${h.ts}-${i}`}>
                  <td className="mono">{h.ts}</td>
                  <td className="mono">{h.ip}</td>
                  <td>{h.loc}</td>
                  <td>{h.device}</td>
                  <td>
                    <ObsidianBadge kind={h.status === 'ok' ? 'bull' : 'warn'} dot={h.status !== 'ok'}>
                      {h.status === 'ok' ? 'Approved' : 'Challenged'}
                    </ObsidianBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2 style={{ color: 'var(--bear)' }}>Danger zone</h2>
          <div className="line" />
        </div>
        <div className="card danger-zone">
          <FieldRow
            label="Close account"
            hint="Permanently delete account, withdraw any remaining balance first."
          >
            <button
              type="button"
              className="btn danger"
              onClick={() =>
                toast.push({
                  kind: 'warn',
                  title: 'Closure request opened',
                  detail: "We'll email you next steps within 1 business day",
                })
              }
            >
              <ObsidianIcon name="Trash2" size={12} />
              Request account closure
            </button>
          </FieldRow>
          <FieldRow
            label="Export all data"
            hint="GDPR / portability. We'll email a download link within 48h."
          >
            <button type="button" className="btn">
              <ObsidianIcon name="Download" size={12} />
              Request export
            </button>
          </FieldRow>
        </div>
      </section>

      <ConsoleModal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        title="Change password"
        icon="Key"
        footer={
          <>
            <button type="button" className="btn ghost" onClick={() => setPwOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={pwStrength < 3 || pw.new !== pw.conf || !pw.cur}
              onClick={submitPw}
            >
              Update password
            </button>
          </>
        }
      >
        <FieldRow label="Current password">
          <div className="ip">
            <input
              type="password"
              value={pw.cur}
              onChange={(e) => setPw((p) => ({ ...p, cur: e.target.value }))}
            />
          </div>
        </FieldRow>
        <FieldRow label="New password">
          <div className="ip">
            <input
              type="password"
              value={pw.new}
              onChange={(e) => setPw((p) => ({ ...p, new: e.target.value }))}
            />
          </div>
        </FieldRow>
        <div style={{ marginTop: 8 }}>
          <ObsidianProgress
            value={(pwStrength / 4) * 100}
            kind={pwKind}
            aria-label="Password strength"
          />
          <div
            style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}
          >
            <span
              style={{
                fontSize: 10,
                color: 'var(--fg3)',
                fontFamily: 'var(--font-data)',
                letterSpacing: '0.04em',
              }}
            >
              Strength
            </span>
            <span
              style={{
                fontSize: 10,
                color: `var(--${pwKind})`,
                fontFamily: 'var(--font-data)',
                fontWeight: 600,
              }}
            >
              {pwLabel}
            </span>
          </div>
        </div>
        <FieldRow label="Confirm password">
          <div
            className="ip"
            style={
              pw.conf && pw.conf !== pw.new ? { borderColor: 'var(--bear)' } : undefined
            }
          >
            <input
              type="password"
              value={pw.conf}
              onChange={(e) => setPw((p) => ({ ...p, conf: e.target.value }))}
            />
          </div>
        </FieldRow>
      </ConsoleModal>

      <ConsoleModal
        open={tfaOpen}
        onClose={() => setTfaOpen(false)}
        title="Set up authenticator app"
        icon="Smartphone"
        footer={
          <>
            <button type="button" className="btn ghost" onClick={() => setTfaOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn primary" onClick={submitTfa}>
              Confirm
            </button>
          </>
        }
      >
        <p
          style={{
            fontSize: 12,
            color: 'var(--fg2)',
            lineHeight: 1.5,
            marginBottom: 16,
          }}
        >
          Scan this QR with your authenticator app, then enter the 6-digit code below.
        </p>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <div
            aria-hidden="true"
            style={{
              width: 120,
              height: 120,
              background: '#fff',
              padding: 8,
              borderRadius: 8,
              flexShrink: 0,
            }}
          >
            <svg
              viewBox="0 0 21 21"
              style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
            >
              {Array.from({ length: 21 * 21 }, (_, i) => {
                const x = i % 21;
                const y = Math.floor(i / 21);
                const corner =
                  (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
                const cornerInner =
                  (x >= 1 && x <= 5 && y >= 1 && y <= 5) ||
                  (x >= 15 && x <= 19 && y >= 1 && y <= 5) ||
                  (x >= 1 && x <= 5 && y >= 15 && y <= 19);
                const cornerCenter =
                  (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
                  (x >= 16 && x <= 18 && y >= 2 && y <= 4) ||
                  (x >= 2 && x <= 4 && y >= 16 && y <= 18);
                let on: boolean;
                if (corner && !cornerInner) on = true;
                else if (cornerCenter) on = true;
                else if (corner) on = false;
                else on = (x * 7 + y * 13 + ((x ^ y) * 3)) % 2 === 0;
                return on ? <rect key={i} x={x} y={y} width="1" height="1" fill="#000" /> : null;
              })}
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--fg3)',
                marginBottom: 6,
              }}
            >
              Or enter manually
            </div>
            <div
              className="key"
              style={{ fontSize: 12, padding: '6px 10px', display: 'block', marginBottom: 14, wordSpacing: 6 }}
            >
              JBSW Y3DP EHPK 3PXP YT2A
            </div>
            <div
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--fg3)',
                marginBottom: 6,
              }}
            >
              Verify · 6-digit code
            </div>
            <div className="ip">
              <input type="text" placeholder="000 000" />
            </div>
          </div>
        </div>
      </ConsoleModal>
    </>
  );
}
