/**
 * File:        apps/web/lib/prana-stream/hooks/use-order-updates.ts
 * Module:      web/prana-stream/hooks
 * Purpose:     Subscribe to live order updates from PranaStream.
 *              Returns a Map keyed by order ID → OrderUpdatePayload.
 *              Also reconciles the optimistic orders store so server-issued
 *              `order.updated` events always win over local pending state.
 *
 * Exports:
 *   - useOrderUpdates() — Map<orderId, OrderUpdatePayload>
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

'use client';

import { useEffect, useState } from 'react';
import { usePranaStream } from '../prana-provider';
import type { OrderUpdatePayload, RealtimeEvent } from '../types';
import { useOptimisticOrdersStore } from '../stores/optimistic-orders';

export function useOrderUpdates(): Map<string, OrderUpdatePayload> {
  const { client, isReady } = usePranaStream();
  const [orders, setOrders] = useState<Map<string, OrderUpdatePayload>>(new Map());
  const applyServerUpdate = useOptimisticOrdersStore((s) => s.applyServerUpdate);

  useEffect(() => {
    if (!isReady) return;
    client.subscribe({ orders: true });

    const unsub = client.on<RealtimeEvent<OrderUpdatePayload>>('order.updated', (event) => {
      // Server is the source of truth — reconcile optimistic store.
      applyServerUpdate(event.data);
      setOrders((prev) => {
        const next = new Map(prev);
        next.set(event.data.id, event.data);
        return next;
      });
    });

    return () => {
      unsub();
      client.unsubscribe({ orders: true });
    };
  }, [isReady, client, applyServerUpdate]);

  return orders;
}
