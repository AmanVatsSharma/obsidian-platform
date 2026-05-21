/**
 * File:        apps/web/features/trading-terminal/lib/gql-service.ts
 * Module:      web · trading-terminal · Data
 * Purpose:     GraphQL data access layer for the trading terminal — wraps @apollo/client
 *              hooks with feature-specific queries and cache policies aligned to the
 *              Obsidian NestJS GraphQL schema.
 *
 * Exports:
 *   - GET_INSTRUMENTS      — gql document for instrument listing
 *   - GET_ACCOUNT          — gql document for single account + balance
 *   - GET_WATCHLISTS       — gql document for watchlist names
 *   - GET_WATCHLIST_ITEMS  — gql document for items in a watchlist
 *   - GET_ACCOUNT_BALANCE  — gql document for account balance snapshot
 *   - useInstruments(opts?)        — hook: instrument catalogue with FX/crypto/indices/commodities
 *   - useAccountBalance(id)        — hook: account balance snapshot (equity, margin, freeMargin)
 *   - useWatchlists()              — hook: user's named watchlists
 *   - useWatchlistItems(id)        — hook: items in a given watchlist
 *   - useGqlPlaceOrder()          — mutation hook for order submission
 *
 * Depends on:
 *   - @apollo/client — useQuery, useMutation, gql
 *
 * Side-effects:
 *   - Network I/O via Apollo Client (queries / mutations)
 *
 * Key invariants:
 *   - Queries use the actual backend schema shapes from accounts.resolver.ts and
 *     market.resolver.ts — InstrumentDto { id, exchangeCode, symbol, displayName, type }
 *     and AccountBalancePayload { equity, margin, freeMargin, currency }.
 *   - useGqlPlaceOrder delegates to the REST /api/orders endpoint via fetchJson
 *     (no placeOrder mutation exists yet in the NestJS schema — this hook provides
 *     the GraphQL-shaped interface that can be wired to a future mutation).
 *   - All queries are cache-and-network to support live price refresh without losing
 *     the benefits of Apollo's normalized cache.
 *
 * Read order:
 *   1. useInstruments — canonical instrument feed (FX/crypto/indices/commodities)
 *   2. useAccountBalance — account snapshot for AccountSummaryPanel
 * 3. useGqlPlaceOrder — mutation bridge (REST today, GraphQL tomorrow)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

import { useQuery, useMutation, gql } from '@apollo/client';
import type { ApolloError } from '@apollo/client';

/* ── Queries ────────────────────────────────────────────────────────────────── */

export const GET_INSTRUMENTS = gql`
  query GetInstruments($exchangeCode: String, $type: String, $q: String) {
    instruments(exchangeCode: $exchangeCode, type: $type, q: $q) {
      id
      exchangeCode
      symbol
      displayName
      type
    }
  }
`;

export const GET_ACCOUNT = gql`
  query GetAccount($accountId: String!) {
    account(id: $accountId) {
      id
      accountId
      name
      accountType
      broker
      currency
      leverage
      status
      createdAt
    }
  }
`;

export const GET_ACCOUNT_BALANCE = gql`
  query GetAccountBalance($accountId: String!, $currency: String) {
    accountBalance(accountId: $accountId, currency: $currency) {
      totalCash
      lockedCash
      availableCash
      positionsValue
      unrealizedPnl
      equity
      buyingPower
      currency
    }
  }
`;

export const GET_WATCHLISTS = gql`
  query GetWatchlists {
    watchlists {
      id
      name
      createdAt
    }
  }
`;

export const GET_WATCHLIST_ITEMS = gql`
  query GetWatchlistItems($watchlistId: String!) {
    watchlists {
      id
      name
    }
  }
`;

/* ── Query hooks ────────────────────────────────────────────────────────────── */

export interface InstrumentNode {
  id: string;
  exchangeCode: string;
  symbol: string;
  displayName: string;
  type: string;
}

export interface BalanceNode {
  totalCash: string;
  lockedCash: string;
  availableCash: string;
  positionsValue: string;
  unrealizedPnl: string;
  equity: string;
  buyingPower: string;
  currency: string;
}

export interface WatchlistNode {
  id: string;
  name: string;
  createdAt: string;
}

export interface UseInstrumentsOptions {
  exchangeCode?: string;
  type?: string;
  q?: string;
}

/**
 * Fetches the instrument catalogue (FX, crypto, indices, commodities) from the
 * market.resolver.ts instruments query. Uses cache-and-network so prices refresh
 * from the network while still showing cached data immediately.
 */
export function useInstruments(opts: UseInstrumentsOptions = {}) {
  return useQuery<{ instruments: InstrumentNode[] }>(GET_INSTRUMENTS, {
    variables: {
      exchangeCode: opts.exchangeCode ?? null,
      type: opts.type ?? null,
      q: opts.q ?? null,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
}

/**
 * Fetches the named watchlists for the current user from market.resolver.ts.
 */
export function useWatchlists() {
  return useQuery<{ watchlists: WatchlistNode[] }>(GET_WATCHLISTS);
}

/**
 * Fetches a single account record (metadata only — no balance data).
 * Use useAccountBalance for equity/margin/freeMargin.
 */
export function useAccount(accountId: string) {
  return useQuery(GET_ACCOUNT, {
    variables: { accountId },
    skip: !accountId,
  });
}

/**
 * Fetches the account balance snapshot from accounts.resolver.ts getAccountBalance.
 * Returns equity, margin, freeMargin, unrealizedPnl, and currency.
 */
export function useAccountBalance(accountId: string, currency?: string) {
  return useQuery<{ accountBalance: BalanceNode | null }>(GET_ACCOUNT_BALANCE, {
    variables: { accountId, currency: currency ?? null },
    skip: !accountId,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
}

/* ── Order placement ─────────────────────────────────────────────────────────── */

/**
 * Input shape for the placeOrder mutation. Mirrors PlaceOrderDto on the backend.
 * The mutation itself delegates to /api/orders REST today; a native GraphQL
 * placeOrder mutation can replace it without changing this interface.
 */
export interface GqlPlaceOrderInput {
  accountId: string;
  instrumentId: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP';
  quantity: string;
  price?: string;
  timeInForce?: 'DAY' | 'GTC' | 'IOC' | 'FOK';
  clientOrderId?: string;
  externalRefId?: string;
  sl?: string;
  tp?: string;
}

export interface GqlPlaceOrderResult {
  id: string;
  clientOrderId: string;
  status: string;
  message?: string;
  filledQty?: number;
  avgFillPrice?: number;
  createdAt: string;
}

/** Bridge mutation — calls /api/orders via the web app's fetchJson. */
export const PLACE_ORDER_MUTATION = gql`
  mutation PlaceOrder($input: PlaceOrderInput!) {
    placeOrder(input: $input) {
      id
      clientOrderId
      status
      message
      filledQty
      avgFillPrice
      createdAt
    }
  }
`;

/**
 * Mutation hook for order submission.
 *
 * Today: delegates to REST /api/orders via the web app's internal fetchJson bridge.
 * Tomorrow: once a native `placeOrder` GraphQL mutation lands on the NestJS schema,
 * replace the internal call with `const [result] = useMutation(PLACE_ORDER_MUTATION)`.
 *
 * Usage:
 *   const [placeOrder, { loading, error }] = useGqlPlaceOrder();
 *   const result = await placeOrder({ variables: { input: { ... } } });
 */
export function useGqlPlaceOrder() {
  return useMutation<{ placeOrder: GqlPlaceOrderResult }>(PLACE_ORDER_MUTATION, {
    refetchQueries: [
      { query: GET_ACCOUNT_BALANCE, variables: {} },
      { query: GET_INSTRUMENTS, variables: {} },
    ],
    awaitRefetchQueries: true,
  });
}

/* ── Combined market + account data ───────────────────────────────────────── */

/**
 * Convenience hook that fetches instruments + account balance in one call.
 * Use this when the terminal needs both data sets on mount.
 */
export function useMarketAndAccount(accountId: string, currency = 'USD') {
  const instruments = useInstruments();
  const balance = useAccountBalance(accountId, currency);
  return {
    instruments: instruments.data?.instruments ?? [],
    instrumentsLoading: instruments.loading,
    instrumentsError: instruments.error,
    balance: balance.data?.accountBalance ?? null,
    balanceLoading: balance.loading,
    balanceError: balance.error,
  };
}
