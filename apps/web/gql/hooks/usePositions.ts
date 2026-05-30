/**
 * File:        apps/web/gql/hooks/usePositions.ts
 * Module:      web · GraphQL · Hooks
 * Purpose:     React Query + Apollo hooks for fetching open positions.
 *              Positions include instrument, quantity, avg price, current price, and P&L.
 *
 * Exports:
 *   - usePositions        — fetch positions with optional filters
 *   - PositionFilters     — input params type
 *   - Position            — single position type
 *
 * Depends on:
 *   - @apollo/client              — useQuery
 *   - ../generated/graphql        — generated GQL types
 *   - ../generated/hooks          — generated hooks (extended below)
 *
 * Side-effects:
 *   - none (read-only query)
 *
 * Key invariants:
 *   - Query uses cache-and-network fetchPolicy for real-time P&L updates
 *   - Returns undefined for loading/error states for optional chaining
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-30
 */

import { useQuery } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import {
  GetPositionsDocument,
  GetPositionsQuery,
  GetPositionsQueryVariables,
} from '../operations/oms/getPositions';

// Re-export the generated hook for extension
export { GetPositionsDocument } from '../operations/oms/getPositions';

/**
 * PositionFilters
 * Optional filters for the positions query.
 */
export interface PositionFilters {
  accountId?: string;
  currency?: string;
  limit?: number;
  offset?: number;
}

/**
 * Position
 * Represents a single open position with P&L data.
 */
export interface Position {
  instrumentId: string;
  netQty: number;
  avgPrice: number;
  realizedPnl: number;
  lastPrice: number;
  mtmPnl: number;
  value: number;
}

/**
 * usePositions result shape
 */
export interface UsePositionsResult {
  /** All positions from the current query */
  positions: Position[];
  /** Total count of positions matching filters */
  total: number;
  /** Limit used in the query */
  limit: number;
  /** Offset used in the query */
  offset: number;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error?: Error;
  /** Refetch function for manual refresh */
  refetch: () => Promise<ApolloQueryResult<GetPositionsQuery>>;
}

// Type for Apollo query result
import type { ApolloQueryResult } from '@apollo/client';

/**
 * usePositions
 *
 * Fetches open positions for the given account with optional filtering.
 * Uses cache-and-network to ensure P&L data stays fresh.
 *
 * @param filters - Optional filters for accountId, currency, limit, offset
 * @returns Position data with loading/error states
 *
 * @example
 * ```tsx
 * const { positions, total, loading, error } = usePositions({
 *   accountId: 'acc-123',
 *   limit: 50,
 * });
 * ```
 */
export function usePositions(filters?: PositionFilters) {
  const { data, loading, error, refetch } = useQuery<
    GetPositionsQuery,
    GetPositionsQueryVariables
  >(GetPositionsDocument as TypedDocumentNode<GetPositionsQuery, GetPositionsQueryVariables>, {
    variables: {
      accountId: filters?.accountId ? (filters.accountId as any) : undefined,
      currency: filters?.currency ?? undefined,
      limit: filters?.limit ?? undefined,
      offset: filters?.offset ?? undefined,
    },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const positions: Position[] = data?.positions?.data?.map((p) => ({
    instrumentId: p.instrumentId,
    netQty: p.netQty,
    avgPrice: p.avgPrice,
    realizedPnl: p.realizedPnl,
    lastPrice: p.lastPrice,
    mtmPnl: p.mtmPnl,
    value: p.value,
  })) ?? [];

  const result: UsePositionsResult = {
    positions,
    total: data?.positions?.total ?? 0,
    limit: data?.positions?.limit ?? 0,
    offset: data?.positions?.offset ?? 0,
    loading,
    error: error ? new Error(error.message) : undefined,
    refetch,
  };

  return result;
}