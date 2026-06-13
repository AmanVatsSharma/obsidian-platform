/**
 * @file funds-dashboard.tsx
 * @module web
 * @description Main funds view with balance cards, linked accounts, and transactions.
 *              Live data flows from PranaStream via usePortfolioEquity.
 *              Linked accounts and transactions remain mocked for now — those
 *              are KYC/payment-rail data, not market data, and require a
 *              separate GraphQL `useLinkedAccounts` / `useTransactions` query
 *              before they can go live. Leaving the seams in place so the
 *              swap is mechanical.
 * @author BharatERP
 * @created 2026-04-16
 * @last-updated 2026-06-12
 */

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@obsidian/obsidian-ui';
import { usePortfolioEquity, useAccountUpdates } from '@/lib/prana-stream';
import { BANK_ACCOUNTS, TRANSACTIONS } from '../lib/mock-data';
import type { FundsSummary } from '../lib/types';
import { BalanceCards } from './balance-cards';
import { LinkedAccounts } from './linked-accounts';
import { TransactionTable } from './transaction-table';

export function FundsDashboard() {
  const accountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID ?? '';

  // ── Live PranaStream data ─────────────────────────────────────────────
  const equity = usePortfolioEquity(accountId || undefined);
  const accounts = useAccountUpdates();

  // Pick the live account snapshot — same logic as usePortfolioEquity so the
  // two displays stay in sync. If no live snapshot yet, fall back to zeros.
  const liveAccount = useMemo(() => {
    if (equity) return equity;
    if (accounts.size === 0) return null;
    const target = accountId
      ? accounts.get(accountId)
      : [...accounts.values()].sort((a, b) => {
          const ta = a.ts ? Date.parse(a.ts) : 0;
          const tb = b.ts ? Date.parse(b.ts) : 0;
          return tb - ta;
        })[0];
    if (!target) return null;
    return {
      totalCash: parseFloat(target.totalCash) || 0,
      availableCash: parseFloat(target.availableCash) || 0,
      lockedCash: parseFloat(target.lockedCash) || 0,
    };
  }, [equity, accounts, accountId]);

  // Map the live equity → BalanceCards' FundsSummary shape.
  // Available for withdrawal = availableCash (the cash that can be moved out).
  // Pending deposits/withdrawals stay 0 — the account stream doesn't carry
  // those values; they come from the payments module via a separate hook
  // (out of scope for D3).
  const summary: FundsSummary = useMemo(
    () => ({
      balance: liveAccount?.totalCash ?? 0,
      availableForWithdrawal: liveAccount?.availableCash ?? 0,
      pendingDeposits: 0,
      pendingWithdrawals: liveAccount?.lockedCash ?? 0,
    }),
    [liveAccount],
  );

  return (
    <div className="flex flex-col gap-6" data-testid="funds-dashboard">
      <BalanceCards summary={summary} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linked Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedAccounts accounts={BANK_ACCOUNTS} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTable transactions={TRANSACTIONS} />
        </CardContent>
      </Card>
    </div>
  );
}
