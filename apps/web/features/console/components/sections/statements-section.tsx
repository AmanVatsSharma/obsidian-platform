/**
 * File:        apps/web/features/console/components/sections/statements-section.tsx
 * Module:      web · Console · Statements & Tax
 * Purpose:     /console/statements — generate-statement form, recent-statements
 *              table, tax-document tiles, and scheduled-email-report toggles.
 *
 * Exports:
 *   - default StatementsSection
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — ObsidianBadge, ObsidianIcon, ObsidianSegmented, ObsidianSelect, ObsidianToggle, useToast
 *   - ../../lib/use-console-user, ../../lib/formatters
 *
 * Side-effects:
 *   - Local React state. Toast on Generate.
 *   - [SonuRamTODO] Wire to backend: POST /v1/statements/generate, GET /v1/statements/{id}.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as React from 'react';

import {
  ObsidianBadge,
  ObsidianIcon,
  ObsidianSegmented,
  ObsidianSelect,
  ObsidianToggle,
  useToast,
} from '@obsidian/obsidian-ui';

import { fmtSign } from '../../lib/formatters';
import { useConsoleUser } from '../../lib/use-console-user';

const RECENT: ReadonlyArray<readonly [string, string, number, number]> = [
  ['April 2026',    'ML-441829', 184,    887.56],
  ['April 2026',    'ML-441830',   0,      0],
  ['March 2026',    'ML-441829', 211,   1124.40],
  ['February 2026', 'ML-441829', 178,   -312.20],
  ['January 2026',  'ML-441829', 244,   2515.04],
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

function TaxCard({
  title,
  year,
  detail,
  status,
}: {
  title: string;
  year: string;
  detail: string;
  status: 'Available' | 'Not applicable';
}) {
  const isAvail = status === 'Available';
  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--fg3)',
          }}
        >
          FY {year}
        </span>
        <ObsidianBadge kind={isAvail ? 'bull' : 'muted'} dot={isAvail}>
          {status}
        </ObsidianBadge>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div className="muted small" style={{ marginBottom: 14 }}>
        {detail}
      </div>
      <button type="button" className="btn sm" disabled={!isAvail}>
        <ObsidianIcon name="Download" size={11} />
        Download
      </button>
    </div>
  );
}

export default function StatementsSection() {
  const user = useConsoleUser();
  const toast = useToast();
  const [account, setAccount] = React.useState<string>('All');
  const [period, setPeriod] = React.useState<string>('2026-05');
  const [format, setFormat] = React.useState<'PDF' | 'CSV' | 'JSON'>('PDF');
  const [daily, setDaily] = React.useState(true);
  const [weekly, setWeekly] = React.useState(true);
  const [monthly, setMonthly] = React.useState(true);

  return (
    <>
      <section className="sec">
        <div className="sec-hd">
          <h2>Statements</h2>
          <div className="line" />
          <span className="muted small">Generated nightly · UTC</span>
        </div>
        <div className="card">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 14,
              marginBottom: 18,
            }}
          >
            <FieldRow label="Account">
              <ObsidianSelect
                value={account}
                onChange={setAccount}
                options={['All', ...user.accounts.map((a) => a.id)]}
              />
            </FieldRow>
            <FieldRow label="Period">
              <ObsidianSelect
                value={period}
                onChange={setPeriod}
                options={['2026-05', '2026-04', '2026-03', '2026-02', 'Custom range']}
              />
            </FieldRow>
            <FieldRow label="Format">
              <ObsidianSegmented
                value={format}
                onChange={setFormat}
                options={['PDF', 'CSV', 'JSON'] as const}
              />
            </FieldRow>
            <FieldRow label="&nbsp;">
              <button
                type="button"
                className="btn primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() =>
                  toast.push({
                    kind: 'accent',
                    title: 'Statement queued',
                    detail: 'Email link in ~30s',
                  })
                }
              >
                <ObsidianIcon name="Download" size={12} />
                Generate
              </button>
            </FieldRow>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Recent statements</h2>
          <div className="line" />
        </div>
        <div className="card flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Period</th>
                <th>Account</th>
                <th className="num">Trades</th>
                <th className="num">Net P&amp;L</th>
                <th>Generated</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {RECENT.map(([p, a, t, pl], i) => (
                <tr key={`${p}-${a}-${i}`}>
                  <td style={{ fontWeight: 600 }}>{p}</td>
                  <td className="mono">{a}</td>
                  <td className="num">{t}</td>
                  <td
                    className="num"
                    style={{
                      color: pl >= 0 ? 'var(--bull)' : 'var(--bear)',
                      fontWeight: 600,
                    }}
                  >
                    {fmtSign(pl)}
                  </td>
                  <td className="mono">{p.split(' ')[0].slice(0, 3)} 01 · 03:00 UTC</td>
                  <td style={{ width: 1 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button type="button" className="btn sm" aria-label="Preview">
                        <ObsidianIcon name="Eye" size={12} />
                      </button>
                      <button type="button" className="btn sm" aria-label="Download">
                        <ObsidianIcon name="Download" size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Tax documents</h2>
          <div className="line" />
        </div>
        <div className="grid g3">
          <TaxCard
            title="Annual P&amp;L summary"
            year="2025"
            detail="Itemized realized gains/losses, fees, swaps."
            status="Available"
          />
          <TaxCard
            title="Form 1042-S"
            year="2025"
            detail="US-source income · for non-US persons."
            status="Not applicable"
          />
          <TaxCard
            title="MiFID II ex-post cost report"
            year="2025"
            detail="Costs and charges · EU regulatory."
            status="Available"
          />
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Scheduled email reports</h2>
          <div className="line" />
        </div>
        <div className="card">
          <FieldRow
            label="Daily summary"
            hint="Sent at 00:30 UTC after end-of-day reconciliation."
          >
            <ObsidianToggle on={daily} onChange={setDaily} aria-label="Daily summary email" />
          </FieldRow>
          <FieldRow label="Weekly performance">
            <ObsidianToggle
              on={weekly}
              onChange={setWeekly}
              aria-label="Weekly performance email"
            />
          </FieldRow>
          <FieldRow label="Monthly statement">
            <ObsidianToggle
              on={monthly}
              onChange={setMonthly}
              aria-label="Monthly statement email"
            />
          </FieldRow>
          <FieldRow label="Send to additional email">
            <div className="ip-row">
              <div className="ip">
                <input type="email" placeholder="accountant@example.com" />
              </div>
              <button type="button" className="btn">
                Add
              </button>
            </div>
          </FieldRow>
        </div>
      </section>
    </>
  );
}
