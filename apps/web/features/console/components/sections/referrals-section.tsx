/**
 * File:        apps/web/features/console/components/sections/referrals-section.tsx
 * Module:      web · Console · Referrals & IB
 * Purpose:     /console/referrals — referral hero with copy-link, per-user KPIs,
 *              optional IB sub-section (commission tier + sub-IB network +
 *              marketing materials), and a recent-referrals table.
 *
 * Exports:
 *   - default ReferralsSection
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — ObsidianBadge, ObsidianIcon, ObsidianProgress, useToast
 *   - ../../lib/use-console-user, ../../lib/formatters
 *
 * Side-effects:
 *   - navigator.clipboard?.writeText on copy. Toast on success.
 *   - [SonuRamTODO] Wire to backend: GET /v1/referrals, GET /v1/ib (when applicable).
 *
 * Key invariants:
 *   - The IB sub-section only renders when the user has an `ibCode`. Today the
 *     retail seed user has no IB code → that block hides. The pro persona (when
 *     wired) would expose it.
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
  type ObsidianIconName,
  useToast,
} from '@obsidian/obsidian-ui';

import { fmt } from '../../lib/formatters';
import { useConsoleUser } from '../../lib/use-console-user';

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="frow">
      <div className="lbl">{label}</div>
      <div>{children}</div>
    </div>
  );
}

const RETAIL_REFERRALS: ReadonlyArray<readonly [string, string, string, number, number]> = [
  ['2026-04-12', 'E. Garcia',   'Funded · $5k',     18.4, 50.00],
  ['2026-03-22', 'T. Nakamura', 'Awaiting deposit',  0,    0],
  ['2026-02-08', 'R. Ahmadi',   'Signed up',         0,    0],
];

const IB_REFERRALS: ReadonlyArray<readonly [string, string, string, number, number]> = [
  ['2026-05-06', 'H. Lindgren', 'Funded · $250k', 420.5,  3580.25],
  ['2026-05-04', 'M. Okafor',   'Funded · $50k',   84.0,   714.00],
  ['2026-05-01', 'P. Romanov',  'Awaiting deposit', 0,       0],
  ['2026-04-28', 'K. Larsen',   'Funded · $1.2M', 1840.0, 15640.00],
];

const SHARE_ICONS: ReadonlyArray<ObsidianIconName> = ['Twitter', 'Linkedin', 'Mail', 'MessageSquare'];

export default function ReferralsSection() {
  const user = useConsoleUser();
  const toast = useToast();

  const isIb = !!user.ibCode;
  const refLink = `https://obsidian.fx/r/${user.id.toLowerCase()}`;
  const referrals = isIb ? IB_REFERRALS : RETAIL_REFERRALS;

  const onCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(refLink).catch(() => undefined);
    }
    toast.push({ kind: 'accent', title: 'Link copied' });
  };

  return (
    <>
      <section className="sec">
        <div
          className="card"
          style={{ background: 'linear-gradient(180deg, rgba(168,85,247,0.05), transparent)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              aria-hidden="true"
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: 'rgba(168,85,247,0.12)',
                color: 'var(--purple)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ObsidianIcon name="Users" size={22} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
                Refer a friend · earn $50 per funded account
              </div>
              <div className="muted small" style={{ marginTop: 4 }}>
                Plus 10% revenue share for the first 12 months on all spread &amp; commission they
                pay.
              </div>
            </div>
          </div>
          <div className="hr" />
          <FieldRow label="Your referral link">
            <div className="ip-row">
              <div className="ip">
                <input type="text" value={refLink} readOnly />
              </div>
              <button type="button" className="btn" onClick={onCopy}>
                <ObsidianIcon name="Copy" size={12} />
                Copy
              </button>
              <button type="button" className="btn ghost" aria-label="QR code">
                <ObsidianIcon name="QrCode" size={12} />
              </button>
            </div>
          </FieldRow>
          <FieldRow label="Share on">
            <div style={{ display: 'flex', gap: 6 }}>
              {SHARE_ICONS.map((i) => (
                <button key={i} type="button" className="btn icon" aria-label={`Share via ${i}`}>
                  <ObsidianIcon name={i} size={13} />
                </button>
              ))}
            </div>
          </FieldRow>
        </div>
      </section>

      <section className="sec">
        <div className="grid g4">
          <div className="kpi">
            <div className="l">Referrals signed up</div>
            <div className="v tnum">{isIb ? '84' : '3'}</div>
            <div className="delta muted">all-time</div>
          </div>
          <div className="kpi bull">
            <div className="l">Funded accounts</div>
            <div className="v tnum">{isIb ? '61' : '1'}</div>
            <div className="delta muted">{isIb ? '73%' : '33%'} conversion</div>
          </div>
          <div className="kpi purple">
            <div className="l">Total earned</div>
            <div className="v tnum">{isIb ? '$24,128.40' : '$50.00'}</div>
            <div className="delta muted">{isIb ? 'lifetime' : '1 referral · paid'}</div>
          </div>
          <div className="kpi warn">
            <div className="l">Pending payout</div>
            <div className="v tnum">{isIb ? '$1,847.20' : '$0.00'}</div>
            <div className="delta muted">{isIb ? 'next: May 15' : '—'}</div>
          </div>
        </div>
      </section>

      {isIb && (
        <>
          <section className="sec">
            <div className="sec-hd">
              <h2>Introducing Broker — {user.ibCode}</h2>
              <div className="line" />
              <ObsidianBadge kind="warn">GOLD TIER</ObsidianBadge>
            </div>
            <div className="grid g2">
              <div className="card">
                <div className="card-hd">
                  <h3>Commission tier</h3>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <span className="mono" style={{ fontSize: 26, fontWeight: 700 }}>
                    $8.50
                  </span>
                  <span className="muted small">per round-turn lot · FX major</span>
                </div>
                <ObsidianProgress value={71} kind="warn" />
                <div className="muted small" style={{ marginTop: 6 }}>
                  71% to PLATINUM ($12.00/lot) · 1,420 lots needed
                </div>
              </div>
              <div className="card">
                <div className="card-hd">
                  <h3>Sub-IB network</h3>
                </div>
                <div style={{ fontSize: 24, fontFamily: 'var(--font-data)', fontWeight: 700 }}>
                  4 sub-IBs
                </div>
                <div className="muted small" style={{ marginBottom: 12 }}>
                  3 levels deep · 184 active referrals total
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn sm">
                    Manage tree
                  </button>
                  <button type="button" className="btn sm ghost">
                    Recruit
                  </button>
                </div>
              </div>
            </div>
          </section>
          <section className="sec">
            <div className="sec-hd">
              <h2>Marketing materials</h2>
              <div className="line" />
            </div>
            <div className="grid g4">
              {(['Banner kit · 6 sizes', 'Logo lockups', 'Social copy templates', 'Email funnel'] as const).map(
                (m) => (
                  <div key={m} className="card" style={{ padding: 14 }}>
                    <div
                      aria-hidden="true"
                      style={{
                        aspectRatio: '16/9',
                        background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                        borderRadius: 4,
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      <ObsidianIcon name="Image" size={20} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{m}</div>
                    <button
                      type="button"
                      className="btn sm ghost"
                      style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                    >
                      <ObsidianIcon name="Download" size={11} />
                      Download
                    </button>
                  </div>
                ),
              )}
            </div>
          </section>
        </>
      )}

      <section className="sec">
        <div className="sec-hd">
          <h2>Recent referrals</h2>
          <div className="line" />
        </div>
        <div className="card flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Joined</th>
                <th>Friend</th>
                <th>Status</th>
                <th className="num">Their volume</th>
                <th className="num">You earned</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(([d, friend, s, v, e], i) => (
                <tr key={`${d}-${i}`}>
                  <td className="mono">{d}</td>
                  <td>{friend}</td>
                  <td>
                    <ObsidianBadge
                      kind={s.startsWith('Funded') ? 'bull' : 'warn'}
                      dot={s.startsWith('Funded')}
                    >
                      {s}
                    </ObsidianBadge>
                  </td>
                  <td className="num">{v ? `${v.toLocaleString('en-US')} lots` : '—'}</td>
                  <td
                    className="num"
                    style={{ color: e ? 'var(--bull)' : 'var(--fg3)', fontWeight: 600 }}
                  >
                    {e ? `+$${fmt(e)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
