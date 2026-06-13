/**
 * @file use-ledger-transactions.ts
 * @module web · API Hook
 * Purpose:     Fetches the trading account's ledger transactions from
 *              GET /accounts/:accountId/ledger?limit=N. Used by the funds
 *              dashboard's "Transaction History" section.
 *
 *              In a follow-up this will be replaced with a GraphQL
 *              useTransactions query that the payments module will own.
 *              For now REST is the simplest path that produces real data.
 *
 * Exports:
 *   - LedgerEntry     — shape returned by the backend
 *   - useLedgerTransactions(accountId?, opts?) — { entries, isLoading, error, refetch }
 *
 * Depends on:
 *   - ../client — apiRequest (GET /accounts/:id/ledger)
 *
 * Side-effects:
 *   - Calls GET /accounts/:id/ledger on mount
 *
 * Key invariants:
 *   - 'use client' — only uses browser APIs via apiRequest
 *   - accountId is required; the hook is a no-op when it's empty
 *   - Empty array when account has no transactions; UI must render an empty state
 *   - isLoading=true until first response (or error) arrives
 *
 * Author:      BharatERP
 * @created     2026-06-12
 * @last-updated 2026-06-12
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../client';

export type LedgerEntryType =
  | 'CASH_DEPOSIT'
  | 'CASH_WITHDRAWAL'
  | 'TRADE_SETTLEMENT'
  | 'FEE'
  | 'REBATE'
  | 'ADJUSTMENT';

export type LedgerEntry = {
  id: string;
  accountId: string;
  type: LedgerEntryType;
  /** Signed amount in account currency — positive for credits, negative for debits */
  amount: string;
  currency: string;
  /** Free-text reference (e.g. "DEPOSIT-12345" or "TRADE-abc-789") */
  reference: string;
  /** When the ledger entry was created */
  createdAt: string;
  /** Optional balance after this entry was applied */
  balanceAfter?: string;
};

export type UseLedgerTransactionsOptions = {
  /** Max entries to return. Default 50. */
  limit?: number;
};

export function useLedgerTransactions(
  accountId: string | undefined,
  options: UseLedgerTransactionsOptions = {},
) {
  const { limit = 50 } = options;
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!accountId) {
      setEntries([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiRequest<LedgerEntry[]>(
        `accounts/${accountId}/ledger?limit=${limit}`,
        { method: 'GET' },
      );
      setEntries(Array.isArray(data) ? data : []);
    } catch (e) {
      setError((e as Error).message);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, limit]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { entries, isLoading, error, refetch };
}
