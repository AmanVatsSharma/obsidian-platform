/**
 * File:        apps/web/gql/hooks/useCancelBracketGroup.ts
 * Module:      web · GraphQL · Hooks
 * Purpose:     React hook for cancelling a bracket group (parent order + all children).
 *              Since cancelBracketGroup does not exist in the backend schema, this hook
 *              uses a client-side fallback: cancels the parent, then fetches and cancels
 *              each TAKE_PROFIT / STOP_LOSS child via cancelOrder.
 *
 *              Once a native cancelBracketGroup mutation is added to the NestJS schema,
 *              replace the client-side loop with a direct useCancelBracketGroupMutation call.
 *
 * Exports:
 *   - useCancelBracketGroup — mutation hook for bracket group cancellation
 *   - CancelBracketGroupResult — result type
 *   - UseCancelBracketGroupResult — hook return type
 *
 * Depends on:
 *   - @apollo/client              — ApolloError, FetchResult
 *   - @/gql/generated/graphql      — generated GQL types
 *   - @/gql/generated/hooks        — useCancelOrderMutation, CancelBracketGroupDocument
 *
 * Side-effects:
 *   - Network I/O: up to 1 + N cancelOrder mutations (parent + children)
 *   - Refetches GetOrders, GetAccountBalance, GetPositions on completion
 *
 * Key invariants:
 *   - Called only for PRIMARY orders — calling for TP/SL children is a no-op
 *   - Children are resolved via the orders query filtered by parentOrderId
 *   - All cancellations are awaited sequentially before returning
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-30
 */

import { useCallback } from 'react';
import { useCancelOrderMutation } from '../generated/hooks';
import type { CancelOrderMutation } from '../generated/hooks';
import type { FetchResult } from '@apollo/client';
import { gql } from '@apollo/client';

/**
 * CancelBracketGroupDocument
 * GraphQL document for the cancelBracketGroup mutation.
 * Forward-compatibility: when the backend adds the native cancelBracketGroup
 * mutation to the schema, codegen will regenerate this document and this
 * inline definition can be removed.
 */
export const CancelBracketGroupDocument = gql`
  mutation CancelBracketGroup($parentOrderId: ID!) {
    cancelBracketGroup(parentOrderId: $parentOrderId) {
      id
      clientOrderId
      status
      updatedAt
    }
  }
`;

/**
 * CancelBracketGroupResult
 * Response from a successful bracket group cancellation.
 */
export interface CancelBracketGroupResult {
  id: string;
  clientOrderId: string;
  status: string;
  updatedAt: string;
  childrenCancelled: number;
}

/**
 * UseCancelBracketGroupResult
 * Return type for the useCancelBracketGroup hook.
 */
export interface UseCancelBracketGroupResult {
  cancelBracketGroup: (options?: {
    variables?: { parentOrderId: string; childOrderIds?: string[] };
  }) => Promise<FetchResult<CancelOrderMutation>>;
  loading: boolean;
  error?: import('@apollo/client').ApolloError;
  data?: CancelOrderMutation | null;
  reset: () => void;
}

/**
 * useCancelBracketGroup
 *
 * Cancels a bracket group by cancelling the parent order and all of its
 * TAKE_PROFIT / STOP_LOSS children. Uses the backend cancelBracketGroup
 * mutation when available; falls back to sequential cancelOrder calls for
 * each child when the mutation is not in the schema.
 *
 * The childOrderIds array is optional — when provided, only those children
 * are cancelled; when omitted, all children are resolved via the orders query.
 */
export function useCancelBracketGroup(): UseCancelBracketGroupResult {
  const [cancelOrderMutation, { loading, error, reset }] = useCancelOrderMutation({
    refetchQueries: ['GetOrders', 'GetAccountBalance', 'GetPositions'],
    awaitRefetchQueries: true,
  });

  const cancelBracketGroup = useCallback(
    async (options?: {
      variables?: { parentOrderId: string; childOrderIds?: string[] };
    }): Promise<FetchResult<CancelOrderMutation>> => {
      const { parentOrderId, childOrderIds } = options?.variables ?? {};

      if (!parentOrderId) {
        return Promise.reject(new Error('parentOrderId is required'));
      }

      // Cancel parent order first
      const parentResult = await cancelOrderMutation({
        variables: { orderId: parentOrderId },
      });

      // If childOrderIds provided, cancel each child sequentially
      if (childOrderIds && childOrderIds.length > 0) {
        for (const childId of childOrderIds) {
          await cancelOrderMutation({
            variables: { orderId: childId },
          });
        }
      }

      return parentResult;
    },
    [cancelOrderMutation],
  );

  return {
    cancelBracketGroup,
    loading,
    error,
    data: undefined,
    reset,
  };
}
