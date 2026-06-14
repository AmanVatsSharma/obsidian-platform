/**
 * File:        apps/web/lib/prana-stream/hooks/use-place-order-optimistic.ts
 * Module:      web/prana-stream/hooks
 * Purpose:     Optimistic order placement hook.
 *              Combines the GraphQL `placeOrder` mutation with the
 *              `useOptimisticOrdersStore` to provide a single call that:
 *                1. Adds a PENDING entry to the store immediately
 *                2. Fires the GraphQL mutation
 *                3. Reconciles on success / marks rejected on failure
 *              The user sees the order in their list in <50ms with a PENDING
 *              badge; the badge clears when the server confirms (or fills
 *              immediately).
 *
 * Exports:
 *   - usePlaceOrderOptimistic() — { placeOrderOptimistic, isPlacing, lastError }
 *   - PlaceOrderOptimisticInput — input shape (extends the GQL input)
 *
 * Depends on:
 *   - @/gql/hooks — usePlaceOrderMutation
 *   - ../stores/optimistic-orders — the zustand store
 *   - ../types — OrderUpdatePayload
 *
 * Side-effects:
 *   - Network I/O via Apollo
 *   - Updates the zustand optimistic-orders store
 *
 * Key invariants:
 *   - The returned clientOrderId is propagated to the mutation for idempotency
 *   - On Apollo network error OR GraphQL error → markRejected
 *   - On Apollo success → reconcile (status from server)
 *   - The server's `order.updated` event will further reconcile status
 *     transitions (PARTIAL, FILLED, CANCELLED, etc.)
 *
 * Read order:
 *   1. PlaceOrderOptimisticInput
 *   2. usePlaceOrderOptimistic — the hook
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

'use client';

import { useState, useCallback } from 'react';
import { usePlaceOrderMutation } from '@/gql/hooks';
import { useOptimisticOrdersStore } from '../stores/optimistic-orders';
import type { OrderUpdatePayload } from '../types';

export type PlaceOrderOptimisticInput = {
  accountId: string;
  instrumentId: string;
  side: 'BUY' | 'SELL';
  type: string;
  quantity: string;
  price?: string;
  slPrice?: string;
  tpPrice?: string;
  timeInForce?: string;
  triggerPrice?: string;
};

export type PlaceOrderOptimisticResult =
  | { ok: true; clientOrderId: string }
  | { ok: false; clientOrderId: string; error: string };

/**
 * Optimistic order placement hook.
 *
 * @example
 * ```tsx
 * const { placeOrderOptimistic, isPlacing } = usePlaceOrderOptimistic();
 *
 * const result = await placeOrderOptimistic({
 *   accountId: 'a1', instrumentId: 'i1', side: 'BUY', type: 'MARKET', quantity: '1.00',
 * });
 * if (!result.ok) toast.error(result.error);
 * ```
 */
export function usePlaceOrderOptimistic() {
  const [placeOrderMutation] = usePlaceOrderMutation();
  const [isPlacing, setIsPlacing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const addPending = useOptimisticOrdersStore((s) => s.addPending);
  const reconcile = useOptimisticOrdersStore((s) => s.reconcile);
  const markRejected = useOptimisticOrdersStore((s) => s.markRejected);

  const placeOrderOptimistic = useCallback(
    async (input: PlaceOrderOptimisticInput): Promise<PlaceOrderOptimisticResult> => {
      setIsPlacing(true);
      setLastError(null);

      // 1. Stage the optimistic entry FIRST so the UI shows the order
      //    immediately (sub-50ms perceived latency).
      const draft: Omit<OrderUpdatePayload, 'id' | 'status' | 'createdAt'> = {
        accountId: input.accountId,
        instrumentId: input.instrumentId,
        side: input.side,
        type: input.type,
        quantity: input.quantity,
        ...(input.price ? { price: input.price } : {}),
        ...(input.slPrice ? { slPrice: input.slPrice } : {}),
        ...(input.tpPrice ? { tpPrice: input.tpPrice } : {}),
      };
      const clientOrderId = addPending(draft);

      // 2. Fire the GraphQL mutation
      try {
        const result = await placeOrderMutation({
          variables: {
            input: {
              accountId: input.accountId,
              instrumentId: input.instrumentId,
              side: input.side,
              type: input.type,
              quantity: input.quantity,
              ...(input.price ? { price: input.price } : {}),
              ...(input.slPrice ? { slPrice: input.slPrice } : {}),
              ...(input.tpPrice ? { tpPrice: input.tpPrice } : {}),
              timeInForce: input.timeInForce ?? 'DAY',
              clientOrderId,
              // externalRefId is required by the schema but is not a
              // client-side concern (it identifies the upstream adapter
              // reference). Reuse the clientOrderId until the OMS allows
              // it to be omitted.
              externalRefId: clientOrderId,
            },
          },
        });

        if (result.errors && result.errors.length > 0) {
          const errMsg = result.errors[0].message;
          markRejected(clientOrderId, errMsg);
          setLastError(errMsg);
          setIsPlacing(false);
          return { ok: false, clientOrderId, error: errMsg };
        }

        const orderData = result.data?.placeOrder;
        if (!orderData) {
          const errMsg = 'Order submission returned no data.';
          markRejected(clientOrderId, errMsg);
          setLastError(errMsg);
          setIsPlacing(false);
          return { ok: false, clientOrderId, error: errMsg };
        }

        // 3. Reconcile the optimistic entry with the server response
        reconcile({
          clientOrderId,
          id: orderData.id,
          status: orderData.status,
        });
        setIsPlacing(false);
        return { ok: true, clientOrderId };
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        markRejected(clientOrderId, errMsg);
        setLastError(errMsg);
        setIsPlacing(false);
        return { ok: false, clientOrderId, error: errMsg };
      }
    },
    [placeOrderMutation, addPending, reconcile, markRejected],
  );

  return { placeOrderOptimistic, isPlacing, lastError };
}
