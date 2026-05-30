/**
 * File:        apps/web/gql/hooks/useOrders.ts
 * Module:      web · GraphQL · Hooks
 * Purpose:     Typed React hooks for fetching orders.
 *
 * Exports:
 *   - useOrders           — fetch orders with optional filters and pagination
 *   - OrderFilters        — input params type
 *   - Order               — single order type
 *   - UseOrdersResult     — result shape
 *
 * Depends on:
 *   - @apollo/client              — Apollo client types
 *   - ../operations/oms/getOrders — generated useGetOrdersQuery hook + types
 *
 * Side-effects:
 *   - none (read-only query)
 *
 * Key invariants:
 *   - Query uses network-only fetchPolicy for fresh order status
 *   - Pagination via limit/offset (no cursor-based pagination)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-30
 */

import { useGetOrdersQuery } from '../operations/oms/getOrders';
import type { GetOrdersQuery, GetOrdersQueryVariables } from '../operations/oms/getOrders';
import type { ApolloQueryResult } from '@apollo/client';

// Re-export document for external use (e.g., refetch)
export { GetOrdersDocument } from '../operations/oms/getOrders';

/**
 * OrderFilters
 * Optional filters for the orders query.
 */
export interface OrderFilters {
  /** Filter by account ID */
  accountId?: string;
  /** Filter by order status (e.g., 'PENDING', 'FILLED', 'CANCELLED') */
  status?: string;
  /** Filter by side ('BUY' or 'SELL') */
  side?: string;
  /** Filter by instrument/symbol */
  symbol?: string;
  /** Filter orders from this date (ISO string) */
  from?: string;
  /** Filter orders to this date (ISO string) */
  to?: string;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

/**
 * Order
 * Represents a single order with full lifecycle data.
 */
export interface Order {
  id: string;
  clientOrderId: string;
  externalRefId: string;
  instrumentId: string;
  side: string;
  type: string;
  quantity: number;
  filledQty: number;
  remainingQty: number;
  price: number | null;
  slPrice: number | null;
  tpPrice: number | null;
  status: string;
  timeInForce: string;
  createdAt: string;
  updatedAt: string;
  triggerPrice: number | null;
  triggerCondition: string | null;
  algoType: string | null;
}

/**
 * UseOrdersResult
 * Result shape for the useOrders hook.
 */
export interface UseOrdersResult {
  /** All orders from the current query */
  orders: Order[];
  /** Total count of orders matching filters */
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
  refetch: () => Promise<ApolloQueryResult<GetOrdersQuery>>;
}

/**
 * useOrders
 *
 * Fetches orders for the given filters with pagination support.
 * Uses network-only to ensure fresh order status data.
 */
export function useOrders(filters?: OrderFilters): UseOrdersResult {
  const variables: GetOrdersQueryVariables = {
    accountId: filters?.accountId,
    status: filters?.status,
    side: filters?.side,
    limit: filters?.limit,
    offset: filters?.offset,
  };

  const { data, loading, error, refetch } = useGetOrdersQuery({
    variables,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const orders: Order[] = data?.orders?.data?.map((o) => ({
    id: o.id,
    clientOrderId: o.clientOrderId,
    externalRefId: o.externalRefId ?? '',
    instrumentId: o.instrumentId,
    side: o.side,
    type: o.type,
    quantity: o.quantity,
    filledQty: o.filledQty,
    remainingQty: o.remainingQty,
    price: o.price ?? null,
    slPrice: o.slPrice ?? null,
    tpPrice: o.tpPrice ?? null,
    status: o.status,
    timeInForce: o.timeInForce,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    triggerPrice: o.triggerPrice ?? null,
    triggerCondition: o.triggerCondition ?? null,
    algoType: o.algoType ?? null,
  })) ?? [];

  return {
    orders,
    total: data?.orders?.total ?? 0,
    limit: data?.orders?.limit ?? 0,
    offset: data?.orders?.offset ?? 0,
    loading,
    error: error ? new Error(error.message) : undefined,
    refetch,
  };
}