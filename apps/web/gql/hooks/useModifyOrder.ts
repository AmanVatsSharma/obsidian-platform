/**
 * File:        apps/web/gql/hooks/useModifyOrder.ts
 * Module:      web · GraphQL · Hooks
 * Purpose:     React hook for modifying pending orders via GraphQL mutation.
 *
 * Exports:
 *   - useModifyOrder        — mutation hook for order modification
 *   - ModifyOrderResult     — result type after successful modification
 *   - UseModifyOrderResult  — hook return type
 *
 * Depends on:
 *   - @apollo/client              — useMutation
 *   - @/gql/generated/graphql      — generated GQL types
 *   - @/gql/generated/hooks        — useModifyOrderMutation
 *
 * Side-effects:
 *   - Network I/O via Apollo Client
 *
 * Key invariants:
 *   - Mutation refetches orders after successful modification
 *   - Supports partial updates: only price and/or quantity can be modified
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-30
 */

import { useModifyOrderMutation } from '../generated/hooks';
import type { ModifyOrderMutation, ModifyOrderMutationVariables } from '../generated/hooks';
import type { FetchResult } from '@apollo/client';

// Re-export document for external use
export { ModifyOrderDocument } from '../generated/hooks';

/**
 * ModifyOrderResult
 * Response from a successful order modification.
 */
export interface ModifyOrderResult {
  id: string;
  clientOrderId: string;
  status: string;
  price?: number | null;
  quantity: number;
  filledQty: number;
  remainingQty: number;
  updatedAt: string;
  message?: string;
}

/**
 * UseModifyOrderResult
 * Return type for the useModifyOrder hook.
 */
export interface UseModifyOrderResult {
  modifyOrder: (options?: { variables?: ModifyOrderMutationVariables }) => Promise<FetchResult<ModifyOrderMutation>>;
  loading: boolean;
  error?: import('@apollo/client').ApolloError;
  data?: ModifyOrderMutation | null;
  reset: () => void;
}

export function useModifyOrder(): UseModifyOrderResult {
  const [modifyOrderMutation, { loading, error, data, reset }] = useModifyOrderMutation({
    refetchQueries: ['GetOrders', 'GetAccountBalance', 'GetPositions'],
    awaitRefetchQueries: true,
  });

  return {
    modifyOrder: modifyOrderMutation,
    loading,
    error,
    data,
    reset,
  };
}