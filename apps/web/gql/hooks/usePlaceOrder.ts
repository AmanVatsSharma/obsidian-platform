/**
 * File:        apps/web/gql/hooks/usePlaceOrder.ts
 * Module:      web · GraphQL · Hooks
 * Purpose:     React hooks for placing orders via GraphQL mutation.
 *              Handles order submission, loading states, and error handling.
 *
 * Exports:
 *   - usePlaceOrder        — mutation hook for order submission
 *   - PlaceOrderInput      — input type for order placement
 *   - PlaceOrderResult     — result type after order placement
 *   - UsePlaceOrderResult  — hook return type
 *
 * Depends on:
 *   - @apollo/client              — useMutation
 *   - ../generated/graphql        — generated GQL types
 *
 * Side-effects:
 *   - Network I/O via Apollo Client (mutation submission)
 *
 * Key invariants:
 *   - Mutation refetches orders and account balance after successful placement
 *   - clientOrderId should be generated client-side for idempotency
 *   - All required fields must be provided; optional fields have defaults
 *
 * Read order:
 *   1. PlaceOrderInput — input shape
 *   2. PlaceOrderResult — response shape
 *   3. usePlaceOrder — main hook
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-30
 */

import { useMutation } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';
import {
  PlaceOrderDocument,
  PlaceOrderMutation,
  PlaceOrderMutationVariables,
} from '../operations/oms/placeOrder';

// Re-export document for external use
export { PlaceOrderDocument } from '../operations/oms/placeOrder';

/**
 * PlaceOrderInput
 * Input shape for the placeOrder mutation.
 * Mirrors PlaceOrderInput in the NestJS GraphQL schema.
 */
export interface PlaceOrderInput {
  /** Trading account ID */
  accountId: string;
  /** Instrument/security ID */
  instrumentId: string;
  /** Order side: 'BUY' or 'SELL' */
  side: 'BUY' | 'SELL';
  /** Order type: 'MARKET', 'LIMIT', 'STOP', 'GTT', etc. */
  type: string;
  /** Order quantity (as string per schema) */
  quantity: string;
  /** Optional limit price for LIMIT/STOP orders */
  price?: string;
  /** Optional stop-loss price */
  slPrice?: string;
  /** Optional take-profit price */
  tpPrice?: string;
  /** Time in force: 'DAY', 'GTC', 'IOC', 'FOK' */
  timeInForce?: string;
  /** Client-generated order ID for idempotency */
  clientOrderId?: string;
  /** External reference ID */
  externalRefId?: string;
}

/**
 * PlaceOrderResult
 * Response from a successful order placement.
 */
export interface PlaceOrderResult {
  /** Server-assigned order ID */
  id: string;
  /** Client-provided order ID (echoed back) */
  clientOrderId: string;
  /** Initial order status */
  status: string;
  /** Optional message (e.g., rejection reason) */
  message?: string;
  /** Timestamp of order creation */
  createdAt: string;
}

/**
 * UsePlaceOrderResult
 * Return type for the usePlaceOrder hook.
 */
export interface UsePlaceOrderResult {
  /** Mutation function — call with { variables: { input: PlaceOrderInput } } */
  placeOrder: (options?: {
    variables?: PlaceOrderMutationVariables;
  }) => Promise<import('@apollo/client').FetchResult<PlaceOrderMutation>>;
  /** Currently loading state */
  loading: boolean;
  /** Error state if mutation failed */
  error?: import('@apollo/client').ApolloError;
  /** Raw mutation result (contains data) */
  data?: PlaceOrderMutation | null;
  /** Reset mutation state */
  reset: () => void;
}

/**
 * usePlaceOrder
 *
 * Mutation hook for placing new orders.
 * After successful placement, refetches orders and account balance.
 *
 * @returns Mutation function and state
 *
 * @example
 * ```tsx
 * const [placeOrder, { loading, error, data, reset }] = usePlaceOrder();
 *
 * const handleSubmit = async (orderData: PlaceOrderInput) => {
 *   try {
 *     const result = await placeOrder({
 *       variables: { input: orderData }
 *     });
 *     if (result.data?.placeOrder) {
 *       console.log('Order placed:', result.data.placeOrder.id);
 *     }
 *   } catch (err) {
 *     console.error('Failed to place order:', err);
 *   }
 * };
 * ```
 */
export function usePlaceOrder(): UsePlaceOrderResult {
  const [placeOrderMutation, { loading, error, data, reset }] = useMutation<
    PlaceOrderMutation,
    PlaceOrderMutationVariables
  >(PlaceOrderDocument as TypedDocumentNode<PlaceOrderMutation, PlaceOrderMutationVariables>, {
    refetchQueries: ['GetOrders', 'GetAccountBalance', 'GetPositions'],
    awaitRefetchQueries: true,
  });

  return {
    placeOrder: placeOrderMutation,
    loading,
    error,
    data,
    reset,
  };
}