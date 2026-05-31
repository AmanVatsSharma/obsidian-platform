/**
 * File:        apps/web/features/trading-terminal/components/account-summary-panel.tsx
 * Module:      web-trading · trading-terminal
 * Purpose:     Account stats, margin meter, and live balance via codegen
 *              useGetAccountBalanceQuery hook. Sparkline removed — no P&L
 *              history field exists in the hook response.
 *
 * Exports:
 *   - AccountSummaryPanel — live account stats panel
 *
 * Depends on:
 *   - @/gql/hooks               — useGetAccountBalanceQuery (codegen)
 *   - @/gql/generated/graphql   — AccountBalancePayload type
 *   - ../lib/types               — AccountSnapshot interface
 *   - ../lib/format-utils        — fmt, pnlClass, pnlSign
 *
 * Side-effects: none (read-only query)
 *
 * Key invariants:
 *   - Shows snapshot prop when available, falls back to hook data
 *   - Sparkline removed — useGetAccountBalanceQuery has no P&L history field
 *   - Loading skeleton while balance loads
 *   - Error state shown without crashing
 *
 * Read order:
 *   1. AccountSummaryPanel  — entry, data wiring
 *   2. parseBalance         — string→numeric conversion
 *   3. SkeletonStat         — loading placeholder
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-30
 */

'use client';

import type { AccountSnapshot } from '../lib/types';
import { fmt, pnlClass, pnlSign } from '../lib/format-utils';
import { useGetAccountBalanceQuery } from '@/gql/hooks';
import type { AccountBalancePayload } from '@/gql/generated/graphql';

// ─── Local types (mirrored from codegen GetAccountBalanceQuery shape) ──────────

interface AccountBalance {
  totalCash: string;
  lockedCash: string;
  availableCash: string;
  positionsValue: string;
  unrealizedPnl: string;
  equity: string;
  buyingPower: string;
  currency: string;
}

interface ParsedBalance extends AccountBalance {
  numericEquity: number;
  numericBuyingPower: number;
  numericUnrealizedPnl: number;
  numericAvailableCash: number;
}

// ─── Parsing helper ───────────────────────────────────────────────────────────

function parseBalance(raw: AccountBalancePayload): ParsedBalance {
  const parseNum = (val: string): number => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };
  return {
    totalCash: raw.totalCash,
    lockedCash: raw.lockedCash,
    availableCash: raw.availableCash,
    positionsValue: raw.positionsValue,
    unrealizedPnl: raw.unrealizedPnl,
    equity: raw.equity,
    buyingPower: raw.buyingPower,
    currency: raw.currency,
    numericEquity: parseNum(raw.equity),
    numericBuyingPower: parseNum(raw.buyingPower),
    numericUnrealizedPnl: parseNum(raw.unrealizedPnl),
    numericAvailableCash: parseNum(raw.availableCash),
  };
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function SkeletonStat() {
  return (
    <div className="account-stat">
      <span className="account-stat-label" style={{ opacity: 0.4 }}>Loading…</span>
      <span className="account-stat-value" style={{ opacity: 0.2 }}>—</span>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function AccountSummaryPanel({ snapshot }: { snapshot?: AccountSnapshot }) {
  const accountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID ?? '';

  const { data, loading } = useGetAccountBalanceQuery({
    variables: { accountId },
    skip: !accountId,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const balance: AccountBalance | null = data?.accountBalance ?? null;
  const parsedBalance: ParsedBalance | null = data?.accountBalance ? parseBalance(data.accountBalance) : null;

  // Derive display values — prefer snapshot prop when available, else hook data.
  const accountIdDisplay  = snapshot?.accountId   ?? balance?.currency   ?? '—';
  const leverageDisplay   = snapshot?.leverage   ?? '1:100';
  const currency           = snapshot?.currency   ?? balance?.currency   ?? 'USD';
  const balanceDisplay     = snapshot?.balance   ?? ((parsedBalance?.numericEquity ?? 0) - (parsedBalance?.numericUnrealizedPnl ?? 0));
  const equityDisplay      = snapshot?.equity    ?? parsedBalance?.numericEquity ?? 0;
  const unrealizedPnl      = snapshot?.unrealizedPnl ?? parsedBalance?.numericUnrealizedPnl ?? 0;
  const realizedPnlToday   = snapshot?.realizedPnlToday ?? 0;
  const freeMargin        = snapshot?.freeMargin ?? parsedBalance?.numericBuyingPower ?? 0;
  const marginDisplay     = snapshot?.margin    ?? parseFloat(balance?.lockedCash ?? '0');
  const marginLevel       = snapshot?.marginLevel ?? 0;

  const marginPct = equityDisplay > 0 ? Math.min((marginDisplay / equityDisplay) * 100, 100) : 0;
  const riskColor = marginPct < 20 ? 'var(--bull)' : marginPct < 50 ? 'var(--warn)' : 'var(--bear)';

  return (
    <div className="account-panel">
      <div className="panel-header">
        <span className="panel-title">Account</span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {accountIdDisplay} · {leverageDisplay}
        </span>
      </div>

      <div className="account-grid">
        {loading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          <>
            {[
              { label: 'Balance',       value: `$${fmt(balanceDisplay)}`,       sub: currency },
              { label: 'Equity',         value: `$${fmt(equityDisplay)}`,         sub: snapshot?.accountType ?? 'Trading', cls: pnlClass(equityDisplay - balanceDisplay) },
              { label: 'Unrealized P&L', value: `${pnlSign(unrealizedPnl)}$${fmt(Math.abs(unrealizedPnl))}`, cls: pnlClass(unrealizedPnl) },
              { label: 'Today P&L',      value: `${pnlSign(realizedPnlToday)}$${fmt(Math.abs(realizedPnlToday))}`, cls: pnlClass(realizedPnlToday) },
              { label: 'Free Margin',    value: `$${fmt(freeMargin)}`,            sub: `Used: $${fmt(marginDisplay)}` },
              { label: 'Margin Level',   value: `${fmt(marginLevel)}%`,           sub: 'Safe', cls: 'bull' },
            ].map((s) => (
              <div key={s.label} className="account-stat">
                <span className="account-stat-label">{s.label}</span>
                <span className={`account-stat-value ${s.cls || ''}`}>{s.value}</span>
                {s.sub ? <span className="account-stat-sub">{s.sub}</span> : null}
              </div>
            ))}
          </>
        )}
      </div>

      <div className="risk-meter">
        <div className="risk-title">Margin Usage</div>
        <div className="risk-bar-bg">
          <div className="risk-bar" style={{ width: `${marginPct}%`, background: riskColor }} />
        </div>
        <div className="risk-labels">
          <span>0%</span>
          <span style={{ color: riskColor }}>{marginPct.toFixed(1)}%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
