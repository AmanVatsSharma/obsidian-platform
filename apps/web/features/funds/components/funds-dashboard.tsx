/**
 * @file funds-dashboard.tsx
 * @module web
 * @description Main funds view with balance cards, linked accounts, and transactions.
 *              - Balance cards:  live via usePortfolioEquity + useAccountUpdates (PranaStream)
 *              - Linked accounts: live via useBankAccounts (REST GET /accounts/bank-accounts)
 *              - Transactions:    live via useLedgerTransactions (REST GET /accounts/:id/ledger)
 *
 *              All four data sources are real backends. No mock fallbacks.
 *              Empty states, loading indicators, and error banners are rendered
 *              in the UI for each section.
 *
 * @author BharatERP
 * @created 2026-04-16
 * @last-updated 2026-06-12
 */

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@obsidian/obsidian-ui';
import { usePortfolioEquity, useAccountUpdates } from '@/lib/prana-stream';
import { useBankAccounts, type BankAccount as ApiBankAccount } from '@/lib/api/hooks/use-bank-accounts';
import { useLedgerTransactions, type LedgerEntry } from '@/lib/api/hooks/use-ledger-transactions';
import type {
  FundsSummary,
  FundTransaction,
  BankAccount,
  TransactionType,
} from '../lib/types';
import { BalanceCards } from './balance-cards';
import { LinkedAccounts } from './linked-accounts';
import { TransactionTable } from './transaction-table';

export function FundsDashboard() {
  const accountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID ?? '';

  // ── Live PranaStream data (equity / account snapshots) ─────────────────
  const equity = usePortfolioEquity(accountId || undefined);
  const accounts = useAccountUpdates();

  // ── REST-backed data (KYC / payment-rail) ─────────────────────────────
  const bankAccounts = useBankAccounts();
  const ledger = useLedgerTransactions(accountId || undefined, { limit: 50 });

  // Derive the live account snapshot. Same fallback logic as the
  // portfolio/orders pages — pick the requested account, else the most
  // recently updated one.
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

  const summary: FundsSummary = useMemo(
    () => ({
      balance: liveAccount?.totalCash ?? 0,
      availableForWithdrawal: liveAccount?.availableCash ?? 0,
      // Pending deposits/withdrawals come from the ledger (PENDING status).
      pendingDeposits: ledger.entries
        .filter((e) => e.type === 'CASH_DEPOSIT' && !e.balanceAfter)
        .reduce((sum, e) => sum + Math.abs(parseFloat(e.amount) || 0), 0),
      pendingWithdrawals: ledger.entries
        .filter((e) => e.type === 'CASH_WITHDRAWAL' && !e.balanceAfter)
        .reduce((sum, e) => sum + Math.abs(parseFloat(e.amount) || 0), 0),
    }),
    [liveAccount, ledger.entries],
  );

  // Map REST bank-account shape → UI BankAccount shape (UI type is a subset
  // of the API type; this normalises field names).
  const linkedAccounts: BankAccount[] = useMemo(
    () =>
      bankAccounts.accounts.map((a: ApiBankAccount) => ({
        id: a.id,
        bankName: a.bankName,
        accountNumber: a.accountNumber,
        isPrimary: a.isPrimary,
      })),
    [bankAccounts.accounts],
  );

  // Map REST ledger entries → UI FundTransaction shape.
  const transactions: FundTransaction[] = useMemo(
    () => ledger.entries.map((e: LedgerEntry) => ledgerEntryToTransaction(e)),
    [ledger.entries],
  );

  return (
    <div className="flex flex-col gap-6" data-testid="funds-dashboard">
      <BalanceCards summary={summary} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linked Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {bankAccounts.isLoading ? (
            <p className="py-6 text-center text-sm text-obsidian-faint" data-testid="linked-accounts-loading">
              Loading linked accounts…
            </p>
          ) : bankAccounts.error ? (
            <p className="py-6 text-center text-sm text-[var(--bear)]" data-testid="linked-accounts-error">
              Failed to load linked accounts: {bankAccounts.error}
            </p>
          ) : linkedAccounts.length === 0 ? (
            <p className="py-6 text-center text-sm text-obsidian-faint" data-testid="linked-accounts-empty">
              No linked bank accounts yet.
            </p>
          ) : (
            <LinkedAccounts accounts={linkedAccounts} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {ledger.isLoading ? (
            <p className="py-6 text-center text-sm text-obsidian-faint" data-testid="transactions-loading">
              Loading transactions…
            </p>
          ) : ledger.error ? (
            <p className="py-6 text-center text-sm text-[var(--bear)]" data-testid="transactions-error">
              Failed to load transactions: {ledger.error}
            </p>
          ) : transactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-obsidian-faint" data-testid="transactions-empty">
              No transactions yet.
            </p>
          ) : (
            <TransactionTable transactions={transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

/**
 * Map a REST LedgerEntry → the UI's FundTransaction shape.
 * Keeps the table component pure-presentational.
 */
function ledgerEntryToTransaction(e: LedgerEntry): FundTransaction {
  const amount = parseFloat(e.amount) || 0;
  return {
    id: e.id,
    date: e.createdAt,
    type: ledgerTypeToTransactionType(e.type),
    amount,
    status: e.balanceAfter ? 'COMPLETED' : 'PENDING',
    method: e.type === 'CASH_DEPOSIT' || e.type === 'CASH_WITHDRAWAL' ? 'Bank Transfer' : 'System',
    reference: e.reference,
  };
}

function ledgerTypeToTransactionType(t: LedgerEntry['type']): TransactionType {
  switch (t) {
    case 'CASH_DEPOSIT':
      return 'DEPOSIT';
    case 'CASH_WITHDRAWAL':
      return 'WITHDRAWAL';
    case 'TRADE_SETTLEMENT':
      return 'TRANSFER';
    case 'FEE':
      return 'FEE';
    case 'REBATE':
      return 'REBATE';
    case 'ADJUSTMENT':
    default:
      return 'TRANSFER';
  }
}

