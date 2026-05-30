/**
 * File:        apps/web/gql/hooks/useCancelOrder.ts
 * Module:      web · GraphQL · Hooks
 * Purpose:     React hooks for cancelling orders via GraphQL mutation.
 *
 * Exports:
 *   - useCancelOrder       — mutation hook for order cancellation
 *   - CancelOrderResult    — result type after cancellation
 *   - UseCancelOrderResult — hook return type
 *
 * Depends on:
 *   - @apollo/client              — useMutation
 *   - ../operations/oms/cancelOrder — generated useCancelOrderMutation hook
 *
 * Side-effects:
 *   - Network I/O via Apollo Client
 *
 * Key invariants:
 *   - Mutation refetches orders after successful cancellation
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-30
 */

import { useCancelOrderMutation } from '../operations/oms/cancelOrder';
import type { CancelOrderMutation, CancelOrderMutationVariables } from '../operations/oms/cancelOrder';
import type { FetchResult } from '@apollo/client';

// Re-export document for external use
export { CancelOrderDocument } from '../operations/oms/cancelOrder';

/**
 * CancelOrderResult
 * Response from a successful order cancellation.
 */
export interface CancelOrderResult {
  id: string;
  clientOrderId: string;
  status: string;
  message?: string;
  updatedAt: string;
}

/**
 * UseCancelOrderResult
 * Return type for the useCancelOrder hook.
 */
export interface UseCancelOrderResult {
  cancelOrder: (options?: { variables?: CancelOrderMutationVariables }) => Promise<FetchResult<CancelOrderMutation>>;
  loading: boolean;
  error?: import('@apollo/client').ApolloError;
  data?: CancelOrderMutation | null;
  reset: () => void;
}

export function useCancelOrder(): UseCancelOrderResult {
  const [cancelOrderMutation, { loading, error, data, reset }] = useCancelOrderMutation({
    refetchQueries: ['GetOrders', 'GetAccountBalance', 'GetPositions'],
    awaitRefetchQueries: true,
  });

  return {
    cancelOrder: cancelOrderMutation,
    loading,
    error,
    data,
    reset,
  };
}