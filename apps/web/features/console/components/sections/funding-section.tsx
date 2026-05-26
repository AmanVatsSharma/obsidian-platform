/**
 * File:        apps/web/features/console/components/sections/funding-section.tsx
 * Module:      web · Console · Funding
 * Purpose:     /console/funding — Deposit/Withdraw/Transfer 3-tab interface,
 *              method selector, summary box, side-rail with limits + processing
 *              times, transaction history table, and an Add-payment-method modal.
 *
 * Exports:
 *   - default FundingSection
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — ObsidianBadge, ObsidianIcon, ObsidianSelect, ObsidianSegmented, useToast
 *   - ../local/console-modal
 *   - ../../lib/use-console-user, ../../lib/formatters
 *
 * Side-effects:
 *   - Local React state. Toasts on submit. No real fund movement.
 *   - [SonuRamTODO] Wire to backend: POST /v1/funding/deposit, /withdraw, /transfer.
 *
 * Key invariants:
 *   - When KYC isn't approved, withdraw and transfer tabs render the locked banner
 *     and the submit button is disabled. Deposits remain available (with limit caps).
 *   - The summary box recalculates on every keystroke; fees are mock-static.
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

import { ccy, fmt, fmtSign } from '../../lib/formatters';
import { useConsoleUser } from '../../lib/use-console-user';
import { ConsoleModal } from '../local/console-modal';

type Tab = 'deposit' | 'withdraw' | 'transfer';

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

function ProcRow({
  icon,
  label,
  time,
}: {
  icon: ObsidianIconName;
  label: string;
  time: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <ObsidianIcon name={icon} size={13} />
      <span style={{ flex: 1, fontSize: 11 }}>{label}</span>
      <span className="mono" style={{ fontSize: 10, color: 'var(--fg2)' }}>
        {time}
      </span>
    </div>
  );
}

const TABS: ReadonlyArray<{ id: Tab; label: string; icon: ObsidianIconName }> = [
  { id: 'deposit',  label: 'Deposit',  icon: 'ArrowDownLeft' },
  { id: 'withdraw', label: 'Withdraw', icon: 'ArrowUpRight' },
  { id: 'transfer', label: 'Transfer', icon: 'ArrowLeftRight' },
];

export default function FundingSection() {
  const user = useConsoleUser();
  const toast = useToast();
  const kycApproved = user.kycState === 'approved';

  const [tab, setTab] = React.useState<Tab>('deposit');
  const [amount, setAmount] = React.useState('');
  const [method, setMethod] = React.useState(user.paymentMethods[0]?.id ?? '');
  const [from, setFrom] = React.useState(user.accounts[0]?.id ?? '');
  const [to, setTo] = React.useState(user.accounts[1]?.id ?? user.accounts[0]?.id ?? '');
  const [addOpen, setAddOpen] = React.useState(false);

  const locked = !kycApproved && tab !== 'deposit';
  const canSubmit = !!amount && parseFloat(amount) > 0 && !locked;
  const baseCurrency = user.accounts[0]?.currency ?? 'USD';

  const submit = () => {
    const titles: Record<Tab, string> = {
      deposit: 'Deposit initiated',
      withdraw: 'Withdrawal pending review',
      transfer: 'Transfer complete',
    };
    const sign = tab === 'deposit' ? '+' : tab === 'withdraw' ? '−' : '↔';
    toast.push({
      kind: 'bull',
      title: titles[tab],
      detail: `${sign}$${amount}`,
    });
    setAmount('');
  };

  return (
    <>
      <section className="sec">
        <div className="grid" style={{ gridTemplateColumns: '1fr 320px' }}>
          <div className="card flush">
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    background: tab === t.id ? 'var(--bg-elevated)' : 'transparent',
                    border: 'none',
                    borderRight: '1px solid var(--border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontFamily: 'var(--font-display)',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: tab === t.id ? 'var(--accent)' : 'var(--fg3)',
                    borderBottom:
                      tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                    marginBottom: -1,
                  }}
                >
                  <ObsidianIcon name={t.icon} size={13} />
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ padding: 22 }}>
              {locked && (
                <div
                  role="alert"
                  style={{
                    background: 'var(--warn-dim)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 6,
                    padding: 12,
                    marginBottom: 18,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <ObsidianIcon name="ShieldAlert" size={16} style={{ color: 'var(--warn)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--warn)' }}>
                      {tab === 'withdraw' ? 'Withdrawals' : 'Transfers'} require verified identity
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg2)', marginTop: 2 }}>
                      Complete KYC verification to unlock this feature.
                    </div>
                  </div>
                </div>
              )}

              {tab !== 'transfer' && (
                <FieldRow label={tab === 'deposit' ? 'Funding source' : 'Destination'}>
                  {user.paymentMethods.length === 0 ? (
                    <button type="button" className="btn" onClick={() => setAddOpen(true)}>
                      <ObsidianIcon name="Plus" size={12} />
                      Add payment method
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {user.paymentMethods.map((pm) => {
                        const selected = method === pm.id;
                        const methodIcon: ObsidianIconName =
                          pm.kind === 'bank'
                            ? 'Building2'
                            : pm.kind === 'card'
                              ? 'CreditCard'
                              : 'Bitcoin';
                        return (
                          <label
                            key={pm.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '10px 12px',
                              background: selected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                              border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                              borderRadius: 6,
                              cursor: 'pointer',
                              boxShadow: selected ? '0 0 0 3px var(--accent-dim)' : 'none',
                            }}
                          >
                            <input
                              type="radio"
                              checked={selected}
                              onChange={() => setMethod(pm.id)}
                              style={{ accentColor: 'var(--accent)' }}
                              aria-label={pm.label}
                            />
                            <span
                              aria-hidden="true"
                              style={{
                                width: 32,
                                height: 22,
                                borderRadius: 4,
                                background: 'var(--bg-base)',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--fg2)',
                                flexShrink: 0,
                              }}
                            >
                              <ObsidianIcon name={methodIcon} size={12} />
                            </span>
                            <span style={{ flex: 1, fontFamily: 'var(--font-data)', fontSize: 12 }}>
                              {pm.label}
                            </span>
                            {pm.primary && <ObsidianBadge kind="accent">Primary</ObsidianBadge>}
                          </label>
                        );
                      })}
                      <button
                        type="button"
                        className="btn sm ghost"
                        style={{ alignSelf: 'flex-start' }}
                        onClick={() => setAddOpen(true)}
                      >
                        <ObsidianIcon name="Plus" size={11} />
                        Add method
                      </button>
                    </div>
                  )}
                </FieldRow>
              )}

              {tab === 'transfer' && (
                <>
                  <FieldRow label="From">
                    <ObsidianSelect
                      value={from}
                      onChange={setFrom}
                      options={user.accounts.map((a) => ({
                        value: a.id,
                        label: `${a.id} · ${a.type} · ${ccy(a.balance, a.currency)}`,
                      }))}
                    />
                  </FieldRow>
                  <FieldRow label="To">
                    <ObsidianSelect
                      value={to}
                      onChange={setTo}
                      options={user.accounts
                        .filter((a) => a.id !== from)
                        .map((a) => ({ value: a.id, label: `${a.id} · ${a.type} · ${a.currency}` }))}
                    />
                  </FieldRow>
                </>
              )}

              <FieldRow label="Amount">
                <div className="ip-row">
                  <div className="ip">
                    <span className="pre">{baseCurrency}</span>
                    <input
                      type="text"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <button type="button" className="btn ghost sm" onClick={() => setAmount('100')}>
                    $100
                  </button>
                  <button type="button" className="btn ghost sm" onClick={() => setAmount('500')}>
                    $500
                  </button>
                  <button type="button" className="btn ghost sm" onClick={() => setAmount('5000')}>
                    $5k
                  </button>
                </div>
              </FieldRow>

              {tab === 'deposit' && (
                <FieldRow label="Trading account">
                  <ObsidianSelect
                    value={user.accounts.find((a) => a.type === 'Live')?.id ?? user.accounts[0].id}
                    onChange={() => undefined}
                    options={user.accounts.map((a) => ({
                      value: a.id,
                      label: `${a.id} · ${a.type}`,
                    }))}
                  />
                </FieldRow>
              )}

              <div
                style={{
                  marginTop: 22,
                  padding: 14,
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    fontSize: 12,
                  }}
                >
                  <span className="muted">Amount</span>
                  <span className="mono">
                    {amount ? ccy(parseFloat(amount), 'USD') : '—'}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    fontSize: 12,
                  }}
                >
                  <span className="muted">
                    {tab === 'deposit'
                      ? 'Deposit fee (covered by Obsidian)'
                      : tab === 'withdraw'
                        ? 'Withdrawal fee'
                        : 'Transfer fee'}
                  </span>
                  <span
                    className="mono"
                    style={{ color: tab === 'deposit' ? 'var(--bull)' : 'var(--fg1)' }}
                  >
                    {tab === 'deposit' ? '$0.00' : tab === 'withdraw' ? '$2.50' : '$0.00'}
                  </span>
                </div>
                {tab === 'withdraw' && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      fontSize: 12,
                    }}
                  >
                    <span className="muted">FX conversion</span>
                    <span className="mono">@ 1.0824</span>
                  </div>
                )}
                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    marginTop: 8,
                    paddingTop: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600 }}>
                    You'll {tab === 'deposit' ? 'receive' : tab === 'withdraw' ? 'get' : 'move'}
                  </span>
                  <span className="mono" style={{ fontWeight: 700, fontSize: 14 }}>
                    {amount
                      ? ccy(parseFloat(amount) - (tab === 'withdraw' ? 2.5 : 0), 'USD')
                      : '—'}
                  </span>
                </div>
              </div>

              <div
                style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 8 }}
              >
                <button type="button" className="btn ghost" onClick={() => setAmount('')}>
                  Clear
                </button>
                <button
                  type="button"
                  className="btn primary lg"
                  disabled={!canSubmit}
                  onClick={submit}
                >
                  {tab === 'deposit'
                    ? 'Deposit funds'
                    : tab === 'withdraw'
                      ? 'Request withdrawal'
                      : 'Transfer now'}
                  <ObsidianIcon name="ArrowRight" size={13} />
                </button>
              </div>
            </div>
          </div>

          <div className="col" style={{ gap: 14 }}>
            <div className="card">
              <div className="card-hd">
                <h3>Available to {tab}</h3>
              </div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                ${fmt(user.balanceTotal)}
              </div>
              <div className="muted small">
                Free margin across {user.accounts.filter((a) => a.type === 'Live').length} live
                accounts
              </div>
              <div className="hr" />
              <Stat
                label="Daily deposit limit"
                value={kycApproved ? 'Unlimited' : '$2,000'}
              />
              <div style={{ marginTop: 10 }}>
                <Stat
                  label="Daily withdrawal limit"
                  value={kycApproved ? '$100,000' : 'Locked'}
                />
              </div>
              <div style={{ marginTop: 10 }}>
                <Stat label="Used today" value="$0 / —" />
              </div>
            </div>
            <div className="card" style={{ background: 'var(--bg-base)' }}>
              <div className="card-hd">
                <h3 style={{ fontSize: 11 }}>Processing times</h3>
              </div>
              <ProcRow icon="Building2" label="Bank wire" time="1–3 business days" />
              <ProcRow icon="CreditCard" label="Card" time="Instant" />
              <ProcRow icon="Bitcoin" label="Crypto (USDT, USDC)" time="~5 minutes" />
              <ProcRow icon="ArrowLeftRight" label="Internal transfer" time="Instant" />
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Transaction history</h2>
          <div className="line" />
          <button type="button" className="btn sm">
            <ObsidianIcon name="Download" size={11} />
            Export CSV
          </button>
        </div>
        <div className="card flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Method</th>
                <th className="num">Amount</th>
                <th>Status</th>
                <th aria-label="row actions" />
              </tr>
            </thead>
            <tbody>
              {user.transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: 'center', padding: 30, color: 'var(--fg3)' }}
                  >
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                user.transactions.map((t, i) => (
                  <tr key={`${t.ts}-${i}`}>
                    <td className="mono">{t.ts}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ObsidianIcon
                          name={t.amount >= 0 ? 'ArrowDownLeft' : 'ArrowUpRight'}
                          size={12}
                        />
                        {t.type}
                      </div>
                    </td>
                    <td>{t.method}</td>
                    <td
                      className="num"
                      style={{
                        color: t.amount >= 0 ? 'var(--bull)' : 'var(--fg1)',
                        fontWeight: 600,
                      }}
                    >
                      {fmtSign(t.amount)} {t.ccy}
                    </td>
                    <td>
                      <ObsidianBadge
                        kind={t.status === 'completed' ? 'bull' : 'warn'}
                        dot={t.status !== 'completed'}
                      >
                        {t.status}
                      </ObsidianBadge>
                    </td>
                    <td style={{ width: 1 }}>
                      <button type="button" className="btn sm ghost" aria-label="Receipt">
                        <ObsidianIcon name="Receipt" size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConsoleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add payment method"
        icon="Plus"
        footer={
          <>
            <button type="button" className="btn ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setAddOpen(false);
                toast.push({
                  kind: 'warn',
                  title: 'Method pending verification',
                  detail: 'Micro-deposit sent · check your bank in 1–2 days',
                });
              }}
            >
              Add method
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
          {(
            [
              { i: 'Building2', l: 'Bank account', selected: true },
              { i: 'CreditCard', l: 'Card', selected: false },
              { i: 'Bitcoin', l: 'Crypto wallet', selected: false },
            ] as const
          ).map((opt) => (
            <div
              key={opt.l}
              style={{
                padding: 14,
                border: `1px solid ${opt.selected ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 6,
                background: opt.selected ? 'var(--bg-active)' : 'var(--bg-elevated)',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <ObsidianIcon name={opt.i} size={20} />
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6 }}>{opt.l}</div>
            </div>
          ))}
        </div>
        <FieldRow label="Account holder name">
          <div className="ip">
            <input type="text" placeholder="As shown on bank statement" />
          </div>
        </FieldRow>
        <FieldRow label="IBAN">
          <div className="ip">
            <input type="text" placeholder="ES00 0000 0000 0000" />
          </div>
        </FieldRow>
        <FieldRow label="BIC / SWIFT">
          <div className="ip">
            <input type="text" placeholder="BBVAESMM" />
          </div>
        </FieldRow>
      </ConsoleModal>
    </>
  );
}
