/**
 * File:        apps/web/gql/hooks/useAccountBalance.ts
 * Module:      web · GraphQL · Hooks
 * Purpose:     React hooks for fetching account balance and equity.
 *
 * Exports:
 *   - useAccountBalance    — fetch balance for a specific account
 *   - AccountBalance       — balance data type
 *
 * Depends on:
 *   - @apollo/client              — Apollo client types
 *   - @/gql/generated/graphql      — generated GQL types
 *   - @/gql/generated/hooks        — useGetAccountBalanceQuery
 *
 * Side-effects:
 *   - none (read-only query)
 *
 * Key invariants:
 *   - accountId is required — the query won't execute without it
 *   - Query uses cache-and-network for real-time equity updates
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-30
 */

import { useGetAccountBalanceQuery } from '../generated/hooks';
import type { GetAccountBalanceQuery, GetAccountBalanceQueryVariables } from '../generated/hooks';
import type { ApolloQueryResult } from '@apollo/client';

// Re-export for use in other hooks
export { GetAccountBalanceDocument } from '../generated/hooks';

/**
 * AccountBalance
 * Complete balance snapshot for a trading account.
 */
export interface AccountBalance {
  totalCash: string;
  lockedCash: string;
  availableCash: string;
  positionsValue: string;
  unrealizedPnl: string;
  equity: string;
  buyingPower: string;
  currency: string;
}

/**
 * Parsed numeric value from balance string
 */
export interface ParsedBalance extends AccountBalance {
  numericEquity: number;
  numericBuyingPower: number;
  numericUnrealizedPnl: number;
  numericAvailableCash: number;
}

/**
 * useAccountBalance options
 */
export interface UseAccountBalanceOptions {
  accountId: string;
  currency?: string;
  skip?: boolean;
}

/**
 * useAccountBalance result
 */
export interface UseAccountBalanceResult {
  balance: AccountBalance | null;
  parsedBalance: ParsedBalance | null;
  loading: boolean;
  error?: Error;
  refetch: () => Promise<ApolloQueryResult<GetAccountBalanceQuery>>;
}

function parseBalance(balance: GetAccountBalanceQuery['accountBalance'] | null): ParsedBalance | null {
  if (!balance) return null;

  const parseNum = (val: string): number => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  return {
    totalCash: balance.totalCash,
    lockedCash: balance.lockedCash,
    availableCash: balance.availableCash,
    positionsValue: balance.positionsValue,
    unrealizedPnl: balance.unrealizedPnl,
    equity: balance.equity,
    buyingPower: balance.buyingPower,
    currency: balance.currency,
    numericEquity: parseNum(balance.equity),
    numericBuyingPower: parseNum(balance.buyingPower),
    numericUnrealizedPnl: parseNum(balance.unrealizedPnl),
    numericAvailableCash: parseNum(balance.availableCash),
  };
}

export function useAccountBalance(options: UseAccountBalanceOptions): UseAccountBalanceResult {
  const { accountId, currency, skip = false } = options;

  const variables: GetAccountBalanceQueryVariables = {
    accountId,
    currency: currency ?? undefined,
  };

  const { data, loading, error, refetch } = useGetAccountBalanceQuery({
    variables,
    skip: skip || !accountId,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const balance: AccountBalance | null = data?.accountBalance ?? null;
  const parsedBalance = parseBalance(data?.accountBalance ?? null);

  return {
    balance,
    parsedBalance,
    loading,
    error: error ? new Error(error.message) : undefined,
    refetch,
  };
}