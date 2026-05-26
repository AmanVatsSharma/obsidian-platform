/**
 * File:        apps/web/features/console/components/sections/overview-section.tsx
 * Module:      web · Console · Overview
 * Purpose:     Renders the /console (Overview) page — 4 KPI tiles, equity sparkline,
 *              account-setup checklist, accounts table, recent activity feed,
 *              and a security-checks summary card.
 *
 * Exports:
 *   - default OverviewSection — section component (mounted by app/console/page.tsx)
 *
 * Depends on:
 *   - next/link                     — deep-links into other sections
 *   - @obsidian/obsidian-ui         — ObsidianBadge, ObsidianIcon, ObsidianProgress, ObsidianSparkline
 *   - ../../lib/use-console-user, ../../lib/formatters
 *
 * Side-effects:
 *   - none (pure read-only display)
 *
 * Key invariants:
 *   - Checklist completion percentage is derived from user state — when all 5 boxes
 *     are checked, the bar turns bull-coloured.
 *   - All numbers use font-mono via .tnum / formatter helpers.
 *   - Negative deltas render as bear-coloured with a leading '−' (typographic minus).
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import Link from 'next/link';
import * as React from 'react';

import {
  ObsidianBadge,
  ObsidianIcon,
  ObsidianProgress,
  ObsidianSparkline,
} from '@obsidian/obsidian-ui';

import { ccy, fmt, fmtSign } from '../../lib/formatters';
import { useConsoleSpark, useConsoleUser } from '../../lib/use-console-user';

type SecRowState = 'ok' | 'warn' | 'bear';

function SecRow({
  icon,
  label,
  detail,
  state,
}: {
  icon: 'ShieldCheck' | 'Key' | 'Monitor' | 'Globe';
  label: string;
  detail: string;
  state: SecRowState;
}) {
  const colorVar =
    state === 'ok' ? 'var(--bull)' : state === 'warn' ? 'var(--warn)' : 'var(--bear)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--fg2)',
        }}
      >
        <ObsidianIcon name={icon} size={14} />
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
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
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: colorVar,
          boxShadow: `0 0 8px ${colorVar}`,
        }}
      />
    </div>
  );
}

export default function OverviewSection() {
  const user = useConsoleUser();
  const spark = useConsoleSpark();

  const checklist = [
    { id: 'email', label: 'Email verified', done: true, target: '/console/profile' },
    { id: 'phone', label: 'Phone verified', done: true, target: '/console/profile' },
    {
      id: 'kyc',
      label: 'Identity verification',
      done: user.kycState === 'approved',
      target: '/console/verification',
    },
    {
      id: '2fa',
      label: 'Two-factor authentication',
      done: user.twoFA.app || user.twoFA.sms,
      target: '/console/security',
    },
    {
      id: 'fund',
      label: 'First deposit',
      done: user.balanceTotal > 0,
      target: '/console/funding',
    },
  ] as const;
  const completion = (checklist.filter((c) => c.done).length / checklist.length) * 100;

  const liveCount = user.accounts.filter((a) => a.type === 'Live').length;
  const demoCount = user.accounts.filter((a) => a.type === 'Demo').length;
  const challengedLogin = user.loginHistory.find((h) => h.status === 'challenge');

  return (
    <>
      <section className="sec">
        <div className="sec-hd">
          <h2>At a glance</h2>
          <div className="line" />
        </div>
        <div className="grid g4">
          <article className="kpi bull">
            <div className="l">Total equity</div>
            <div className="v tnum">${fmt(user.equityTotal)}</div>
            <div className="delta">
              <span className="bull" style={{ color: 'var(--bull)' }}>
                ▲ {fmtSign(user.pnlMTD)}
              </span>
              <span className="muted">MTD</span>
            </div>
          </article>
          <article className="kpi">
            <div className="l">Cash balance</div>
            <div className="v tnum">${fmt(user.balanceTotal)}</div>
            <div className="delta muted">
              {liveCount} live · {demoCount} demo
            </div>
          </article>
          <article className="kpi purple">
            <div className="l">P&L · year-to-date</div>
            <div
              className="v tnum"
              style={{ color: user.pnlYTD >= 0 ? 'var(--bull)' : 'var(--bear)' }}
            >
              {fmtSign(user.pnlYTD)}
            </div>
            <div className="delta muted">{user.accounts.length} accounts aggregated</div>
          </article>
          <article className="kpi warn">
            <div className="l">Account tier</div>
            <div
              className="v"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {user.tier}
            </div>
            <div className="delta muted">
              KYC level {user.kycLevel} · joined {user.joined}
            </div>
          </article>
        </div>
      </section>

      <section className="sec">
        <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
          <div className="card">
            <div className="card-hd">
              <h3>Equity · 30 days</h3>
              <ObsidianBadge kind="muted">{user.accounts[0]?.currency ?? 'USD'}</ObsidianBadge>
              <div className="meta tnum">
                last tick {user.balanceTotal > 0 ? '+0.14%' : '—'}
              </div>
            </div>
            <ObsidianSparkline data={spark} color="var(--bull)" height={120} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 8,
                fontFamily: 'var(--font-data)',
                fontSize: 10,
                color: 'var(--fg3)',
                letterSpacing: '0.04em',
              }}
            >
              <span>Apr 09</span>
              <span>Apr 23</span>
              <span>May 08</span>
            </div>
          </div>
          <div className="card">
            <div className="card-hd">
              <h3>Account setup</h3>
              <div className="meta tnum">{Math.round(completion)}%</div>
            </div>
            <ObsidianProgress value={completion} kind={completion === 100 ? 'bull' : 'warn'} />
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {checklist.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: c.done ? 'var(--bull-dim)' : 'var(--bg-elevated)',
                      border:
                        '1px solid ' + (c.done ? 'rgba(16,217,150,0.3)' : 'var(--border)'),
                      color: c.done ? 'var(--bull)' : 'var(--fg3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ObsidianIcon name={c.done ? 'Check' : 'Circle'} size={11} />
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: c.done ? 'var(--fg2)' : 'var(--fg1)',
                      textDecoration: c.done ? 'line-through' : 'none',
                    }}
                  >
                    {c.label}
                  </span>
                  {!c.done && (
                    <Link href={c.target} className="btn sm ghost end" style={{ marginLeft: 'auto' }}>
                      Complete
                      <ObsidianIcon name="ArrowRight" size={11} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Trading accounts</h2>
          <div className="line" />
          <Link href="/console/accounts" className="btn sm">
            Manage
            <ObsidianIcon name="ArrowUpRight" size={11} />
          </Link>
        </div>
        <div className="card flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Account</th>
                <th>Type</th>
                <th>Platform</th>
                <th className="num">Balance</th>
                <th className="num">Equity</th>
                <th>Leverage</th>
                <th className="num">Margin level</th>
                <th aria-label="row actions" />
              </tr>
            </thead>
            <tbody>
              {user.accounts.map((a) => (
                <tr key={a.id}>
                  <td className="mono">{a.id}</td>
                  <td>
                    <ObsidianBadge kind={a.type === 'Live' ? 'bull' : 'muted'} dot={a.type === 'Live'}>
                      {a.type}
                    </ObsidianBadge>
                  </td>
                  <td className="mono">{a.platform}</td>
                  <td className="num">{ccy(a.balance, a.currency)}</td>
                  <td className="num">{ccy(a.equity, a.currency)}</td>
                  <td className="mono">{a.leverage}</td>
                  <td className="num">
                    {a.marginLevel ? `${a.marginLevel.toLocaleString('en-US')}%` : '—'}
                  </td>
                  <td style={{ width: 1 }}>
                    <button type="button" className="btn sm ghost" aria-label="Row actions">
                      <ObsidianIcon name="MoreHorizontal" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sec">
        <div className="grid g2">
          <div className="card">
            <div className="card-hd">
              <h3>Recent activity</h3>
              <Link href="/console/statements" className="btn sm ghost end" style={{ marginLeft: 'auto' }}>
                All transactions
                <ObsidianIcon name="ArrowRight" size={11} />
              </Link>
            </div>
            {user.transactions.length === 0 ? (
              <div
                style={{ padding: 20, color: 'var(--fg3)', fontSize: 12, textAlign: 'center' }}
              >
                No activity yet — make your first deposit to start trading.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {user.transactions.slice(0, 5).map((t, i, arr) => (
                  <div
                    key={`${t.ts}-${t.type}-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: t.amount >= 0 ? 'var(--bull-dim)' : 'var(--bear-dim)',
                        color: t.amount >= 0 ? 'var(--bull)' : 'var(--bear)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ObsidianIcon
                        name={t.amount >= 0 ? 'ArrowDownLeft' : 'ArrowUpRight'}
                        size={14}
                      />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{t.type}</div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--fg3)',
                          fontFamily: 'var(--font-data)',
                          marginTop: 2,
                        }}
                      >
                        {t.method} · {t.ts}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        className="tnum"
                        style={{
                          fontWeight: 600,
                          color: t.amount >= 0 ? 'var(--bull)' : 'var(--fg1)',
                          fontSize: 13,
                        }}
                      >
                        {fmtSign(t.amount)} {t.ccy}
                      </div>
                      <div style={{ marginTop: 2 }}>
                        <ObsidianBadge kind={t.status === 'completed' ? 'bull' : 'warn'}>
                          {t.status}
                        </ObsidianBadge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-hd">
              <h3>Security checks</h3>
              <ObsidianBadge kind="bull" dot>
                OK
              </ObsidianBadge>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SecRow
                icon="ShieldCheck"
                label="Two-factor authentication"
                detail={
                  user.twoFA.app
                    ? 'Authenticator app'
                    : user.twoFA.sms
                      ? 'SMS'
                      : 'Disabled'
                }
                state={user.twoFA.app || user.twoFA.sms ? 'ok' : 'warn'}
              />
              <SecRow
                icon="Key"
                label="Password"
                detail="Last changed 47 days ago"
                state="ok"
              />
              <SecRow
                icon="Monitor"
                label="Active sessions"
                detail={`${user.devices.length} devices`}
                state="ok"
              />
              <SecRow
                icon="Globe"
                label="Recent unusual sign-in"
                detail={
                  challengedLogin
                    ? `1 challenged login (${challengedLogin.loc})`
                    : 'No anomalies in 30 days'
                }
                state={challengedLogin ? 'warn' : 'ok'}
              />
            </div>
            <Link
              href="/console/security"
              className="btn sm"
              style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}
            >
              Open security center
              <ObsidianIcon name="ArrowRight" size={11} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
