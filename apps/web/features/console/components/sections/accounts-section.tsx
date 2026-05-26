/**
 * File:        apps/web/features/console/components/sections/accounts-section.tsx
 * Module:      web · Console · Trading Accounts
 * Purpose:     /console/accounts — 4 KPI tiles, segmented type filter (All/Live/Demo),
 *              cards grid with per-account actions, plus modals for opening a new
 *              account and revealing MT5 credentials.
 *
 * Exports:
 *   - default AccountsSection
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — ObsidianBadge, ObsidianIcon, ObsidianSegmented, ObsidianSelect, useToast
 *   - ../local/console-modal
 *   - ../../lib/use-console-user, ../../lib/formatters
 *
 * Side-effects:
 *   - Local React state. Toasts on actions.
 *   - [SonuRamTODO] Wire to: GET /v1/accounts, POST /v1/accounts, GET /v1/accounts/:id/credentials.
 *
 * Key invariants:
 *   - Demo accounts hide the Deposit / Withdraw buttons (mock balance).
 *   - The "Highest leverage" KPI parses 1:N strings; safe against malformed data
 *     because parseInt returns NaN and Math.max coerces NaN to NaN; we coerce empty → 0.
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
  type ObsidianIconName,
  useToast,
} from '@obsidian/obsidian-ui';

import { ccy, fmt } from '../../lib/formatters';
import type { TradingAccount } from '../../lib/seed-data';
import { useConsoleUser } from '../../lib/use-console-user';
import { ConsoleModal } from '../local/console-modal';

type FilterValue = 'All' | 'Live' | 'Demo';

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

function Cell({
  label,
  value,
  accent,
  good,
  warn,
}: {
  label: string;
  value: string;
  accent?: boolean;
  good?: boolean;
  warn?: boolean;
}) {
  const color = good
    ? 'var(--bull)'
    : warn
      ? 'var(--warn)'
      : accent
        ? 'var(--accent)'
        : 'var(--fg1)';
  return (
    <div
      style={{
        background: 'var(--bg-base)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '8px 10px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--fg3)',
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div className="mono" style={{ fontSize: 13, fontWeight: 600, color }}>
        {value}
      </div>
    </div>
  );
}

function AccountCard({
  a,
  onCreds,
  onAction,
}: {
  a: TradingAccount;
  onCreds: () => void;
  onAction: (label: string) => void;
}) {
  const isLive = a.type === 'Live';
  return (
    <div className="card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <span
          aria-hidden="true"
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: isLive ? 'var(--bull-dim)' : 'var(--bg-elevated)',
            color: isLive ? 'var(--bull)' : 'var(--fg2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: `1px solid ${isLive ? 'rgba(16,217,150,0.25)' : 'var(--border)'}`,
          }}
        >
          <ObsidianIcon name={isLive ? 'Wallet' : 'FlaskConical'} size={18} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}
            >
              {a.id}
            </span>
            <ObsidianBadge kind={isLive ? 'bull' : 'muted'} dot={isLive}>
              {a.type}
            </ObsidianBadge>
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: 'var(--fg3)',
              fontFamily: 'var(--font-data)',
            }}
          >
            {a.platform} · base {a.currency} · leverage {a.leverage}
          </div>
        </div>
        <button type="button" className="btn sm ghost" aria-label="Account menu">
          <ObsidianIcon name="MoreHorizontal" size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <Cell label="Balance" value={ccy(a.balance, a.currency)} />
        <Cell label="Equity" value={ccy(a.equity, a.currency)} accent={a.equity !== a.balance} />
        <Cell label="Used margin" value={ccy(a.margin, a.currency)} />
        <Cell
          label="Margin level"
          value={a.marginLevel ? `${a.marginLevel.toLocaleString('en-US')}%` : '—'}
          good={a.marginLevel > 1000}
          warn={a.marginLevel > 0 && a.marginLevel < 200}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {isLive && (
          <button
            type="button"
            className="btn sm primary"
            onClick={() => onAction(`Deposit · ${a.id}`)}
          >
            <ObsidianIcon name="ArrowDownLeft" size={11} />
            Deposit
          </button>
        )}
        {isLive && (
          <button
            type="button"
            className="btn sm"
            onClick={() => onAction(`Withdraw · ${a.id}`)}
          >
            <ObsidianIcon name="ArrowUpRight" size={11} />
            Withdraw
          </button>
        )}
        <button
          type="button"
          className="btn sm"
          onClick={() => onAction(`Transfer · ${a.id}`)}
        >
          <ObsidianIcon name="ArrowLeftRight" size={11} />
          Transfer
        </button>
        <button type="button" className="btn sm" onClick={onCreds}>
          <ObsidianIcon name="KeyRound" size={11} />
          Credentials
        </button>
        <button
          type="button"
          className="btn sm ghost"
          onClick={() => onAction(`Statement · ${a.id}`)}
        >
          <ObsidianIcon name="FileText" size={11} />
          Statement
        </button>
        {!isLive && (
          <button
            type="button"
            className="btn sm ghost danger"
            onClick={() => onAction(`Reset · ${a.id}`)}
          >
            <ObsidianIcon name="RefreshCw" size={11} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

export default function AccountsSection() {
  const user = useConsoleUser();
  const toast = useToast();
  const [filter, setFilter] = React.useState<FilterValue>('All');
  const [newOpen, setNewOpen] = React.useState(false);
  const [creds, setCreds] = React.useState<TradingAccount | null>(null);

  const liveCount = user.accounts.filter((a) => a.type === 'Live').length;
  const demoCount = user.accounts.filter((a) => a.type === 'Demo').length;
  const liveCcyList = user.accounts
    .filter((a) => a.type === 'Live')
    .map((a) => a.currency)
    .join(' · ');
  const highestLeverage = user.accounts.reduce((m, a) => {
    const n = parseInt(a.leverage.split(':')[1] ?? '0', 10);
    return Math.max(m, Number.isFinite(n) ? n : 0);
  }, 0);

  const filtered =
    filter === 'All' ? user.accounts : user.accounts.filter((a) => a.type === filter);

  const onCreate = () => {
    setNewOpen(false);
    toast.push({
      kind: 'bull',
      title: 'Account created',
      detail: 'ML-441831 · funding instructions sent to email',
    });
  };

  const credsIcon: ObsidianIconName = 'KeyRound';

  return (
    <>
      <section className="sec">
        <div className="grid g4">
          <div className="kpi">
            <div className="l">Live accounts</div>
            <div className="v tnum">{liveCount}</div>
            <div className="delta muted">{liveCcyList || '—'}</div>
          </div>
          <div className="kpi bull">
            <div className="l">Total equity (USD eq.)</div>
            <div className="v tnum">${fmt(user.equityTotal)}</div>
            <div className="delta muted">across {user.accounts.length} accounts</div>
          </div>
          <div className="kpi purple">
            <div className="l">Demo accounts</div>
            <div className="v tnum">{demoCount}</div>
            <div className="delta muted">unlimited · resets weekly</div>
          </div>
          <div className="kpi warn">
            <div className="l">Highest leverage</div>
            <div className="v tnum">{highestLeverage > 0 ? `1:${highestLeverage}` : '—'}</div>
            <div className="delta muted">capped by your KYC tier</div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>All accounts</h2>
          <div className="line" />
          <ObsidianSegmented
            value={filter}
            onChange={setFilter}
            options={['All', 'Live', 'Demo'] as const}
          />
          <button type="button" className="btn primary" onClick={() => setNewOpen(true)}>
            <ObsidianIcon name="Plus" size={12} />
            New account
          </button>
        </div>
        <div className="grid g2">
          {filtered.map((a) => (
            <AccountCard
              key={a.id}
              a={a}
              onCreds={() => setCreds(a)}
              onAction={(label) =>
                toast.push({ kind: 'accent', title: label, detail: a.id })
              }
            />
          ))}
        </div>
      </section>

      <ConsoleModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Open new trading account"
        icon="Plus"
        width={520}
        footer={
          <>
            <button type="button" className="btn ghost" onClick={() => setNewOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn primary" onClick={onCreate}>
              Create account
            </button>
          </>
        }
      >
        <FieldRow label="Account type">
          <ObsidianSegmented
            value={'Live' as const}
            onChange={() => undefined}
            options={['Live', 'Demo'] as const}
          />
        </FieldRow>
        <FieldRow label="Platform">
          <ObsidianSegmented
            value={'MT5' as const}
            onChange={() => undefined}
            options={['MT5', 'MT4', 'FIX 4.4'] as const}
          />
        </FieldRow>
        <FieldRow label="Base currency">
          <ObsidianSelect
            value={'EUR' as const}
            onChange={() => undefined}
            options={['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'SGD'] as const}
          />
        </FieldRow>
        <FieldRow label="Leverage" hint="Capped to 1:30 for retail; raise via Pro tier.">
          <ObsidianSelect
            value={'1:30' as const}
            onChange={() => undefined}
            options={['1:5', '1:10', '1:30', '1:50', '1:100', '1:200', '1:500'] as const}
          />
        </FieldRow>
        <FieldRow label="Account nickname">
          <div className="ip">
            <input type="text" placeholder="Long-only swing" />
          </div>
        </FieldRow>
        <FieldRow label="Initial deposit (optional)">
          <div className="ip">
            <span className="pre">EUR</span>
            <input type="text" placeholder="0.00" />
          </div>
        </FieldRow>
      </ConsoleModal>

      <ConsoleModal
        open={!!creds}
        onClose={() => setCreds(null)}
        title={`MT5 credentials · ${creds?.id ?? ''}`}
        icon={credsIcon}
        footer={
          <button type="button" className="btn primary" onClick={() => setCreds(null)}>
            Done
          </button>
        }
      >
        <p style={{ fontSize: 12, color: 'var(--fg2)', marginBottom: 14, lineHeight: 1.5 }}>
          Use these in your MT5 desktop / mobile client. Investor password gives read-only
          access; share with auditors only.
        </p>
        <FieldRow label="Server">
          <div className="ip">
            <input type="text" value="Obsidian-Live" readOnly />
            <span className="post">
              <ObsidianIcon name="Copy" size={12} />
            </span>
          </div>
        </FieldRow>
        <FieldRow label="Login">
          <div className="ip">
            <input type="text" value={creds?.id ?? ''} readOnly />
            <span className="post">
              <ObsidianIcon name="Copy" size={12} />
            </span>
          </div>
        </FieldRow>
        <FieldRow label="Master password">
          <div className="ip">
            <input type="password" value="••••••••••••" readOnly />
            <span className="post">
              <button type="button" className="btn sm ghost">
                <ObsidianIcon name="Eye" size={11} />
                Reveal
              </button>
            </span>
          </div>
        </FieldRow>
        <FieldRow label="Investor password">
          <div className="ip">
            <input type="password" value="••••••••••••" readOnly />
            <span className="post">
              <button type="button" className="btn sm ghost">
                <ObsidianIcon name="Eye" size={11} />
                Reveal
              </button>
            </span>
          </div>
        </FieldRow>
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <button type="button" className="btn">
            <ObsidianIcon name="RefreshCw" size={12} />
            Reset master password
          </button>
          <button type="button" className="btn ghost">
            <ObsidianIcon name="Download" size={12} />
            Download .ini
          </button>
        </div>
      </ConsoleModal>
    </>
  );
}
