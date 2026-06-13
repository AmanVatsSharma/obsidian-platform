/**
 * @file use-bank-accounts.ts
 * @module web · API Hook
 * @purpose     Fetches the user's linked bank accounts from
 *              GET /accounts/bank-accounts. Returns an array of accounts with
 *              masked account numbers + a primary flag. Used by the funds
 *              dashboard's "Linked Bank Accounts" section.
 *
 * Exports:
 *   - BankAccount    — shape returned by the backend
 *   - useBankAccounts() — { accounts, isLoading, error, refetch }
 *
 * Depends on:
 *   - ../client — apiRequest (GET /accounts/bank-accounts)
 *
 * Side-effects:
 *   - Calls GET /accounts/bank-accounts on mount
 *
 * Key invariants:
 *   - 'use client' — only uses browser APIs via apiRequest
 *   - Empty array when user has no linked accounts; UI must render an empty state
 *   - isLoading=true until first response (or error) arrives
 *
 * Author:      BharatERP
 * @created     2026-06-12
 * @last-updated 2026-06-12
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../client';

export type BankAccount = {
  id: string;
  /** Tenant-scoped owner — opaque ID */
  userId: string;
  /** Optional trading account this bank is linked to */
  accountId: string | null;
  holderName: string;
  bankName: string;
  /** Masked account number (e.g. "****1234") — never the full number on the wire */
  accountNumber: string;
  isPrimary: boolean;
  createdAt: string;
};

export function useBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiRequest<BankAccount[]>('accounts/bank-accounts', {
        method: 'GET',
      });
      setAccounts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError((e as Error).message);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { accounts, isLoading, error, refetch };
}
