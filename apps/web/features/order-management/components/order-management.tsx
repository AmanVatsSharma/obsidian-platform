/**
 * @file order-management.tsx
 * @module web
 * @description Tabbed order management view with pending orders and history.
 *              Pending orders are sourced live from PranaStream via useOpenOrders.
 *              Order history comes from the same order stream, filtered to terminal statuses.
 *              Cancellation goes through useCancelOrder (GraphQL) — the row drops out
 *              of the pending tab when the server pushes the `order.updated` event
 *              with status=CANCELLED.
 * @author BharatERP
 * @created 2026-04-16
 * @last-updated 2026-06-12
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@obsidian/obsidian-ui';
import { useOpenOrders, useOrderUpdates } from '@/lib/prana-stream';
import { useCancelOrder } from '@/gql/hooks/useCancelOrder';
import type { PendingOrder } from '../../trading-terminal/lib/types';
import { OrderHistoryTable } from './order-history-table';
import { PendingOrdersTable } from './pending-orders-table';

type Tab = 'pending' | 'history';

const TERMINAL_STATUSES = new Set(['FILLED', 'CANCELED', 'CANCELLED', 'REJECTED', 'EXPIRED']);

/**
 * Map a PranaStream OrderUpdatePayload → PendingOrder shape expected by
 * PendingOrdersTable. The OMS side doesn't currently ship SL/TP on the live
 * stream, so we backfill with safe defaults (0) and a "no expiry" string.
 */
function toPendingOrder(o: {
  id: string;
  accountId: string;
  instrumentId: string;
  side: string;
  type: string;
  quantity: string;
  price?: string;
  status: string;
  createdAt: string;
}): PendingOrder {
  return {
    id: o.id,
    symbol: o.instrumentId,
    type: o.type as PendingOrder['type'],
    orderRole: null,
    parentOrderId: null,
    side: o.side === 'BUY' ? 'BUY' : 'SELL',
    lots: parseFloat(o.quantity) || 0,
    price: parseFloat(o.price ?? '0') || 0,
    distance: 0,
    sl: 0,
    tp: 0,
    status: o.status,
    created: o.createdAt,
    expiry: undefined,
    algoMeta: undefined,
  };
}

export function OrderManagement() {
  const [tab, setTab] = useState<Tab>('pending');
  const accountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID ?? '';

  // ── Live PranaStream data ─────────────────────────────────────────────
  // Open orders — filtered to working statuses, optionally narrowed by account
  const openOrders = useOpenOrders(
    accountId ? { accountId } : {},
  );

  // All orders — for the history tab (terminal-status filter applied below)
  const allOrders = useOrderUpdates();

  // Map open orders → PendingOrder shape. Sorted newest first by useOpenOrders.
  const pendingOrders: PendingOrder[] = useMemo(
    () => openOrders.map(toPendingOrder),
    [openOrders],
  );

  // History = all orders whose status is terminal (FILLED / CANCELED / REJECTED / EXPIRED).
  // Sorted newest first; the table itself only needs the basic order fields.
  const orderHistory = useMemo(
    () =>
      Array.from(allOrders.values())
        .filter((o) => TERMINAL_STATUSES.has(o.status))
        .sort((a, b) =>
          b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0,
        )
        .map(toPendingOrder),
    [allOrders],
  );

  // ── Cancel mutation ──────────────────────────────────────────────────
  // The GraphQL mutation triggers a server-side cancel; the order will
  // then drop out of the PranaStream `useOpenOrders` slice on the next
  // `order.updated` event with status=CANCELLED (terminal status).
  const { cancelOrder, loading: cancelLoading, error: cancelError } = useCancelOrder();

  const handleCancel = useCallback(
    async (id: string) => {
      try {
        const result = await cancelOrder({ variables: { orderId: id } });
        if (result.errors?.length) {
          // eslint-disable-next-line no-console
          console.error('Cancel order failed:', result.errors[0]?.message);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Cancel order threw:', e);
      }
    },
    [cancelOrder],
  );

  return (
    <div className="flex flex-col gap-6" data-testid="order-management">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle className="text-base">Orders</CardTitle>
            <div className="flex gap-1 rounded-obs bg-obsidian-muted p-0.5">
              <button
                data-testid="tab-pending"
                onClick={() => setTab('pending')}
                className={`rounded-obs-sm px-3 py-1 text-xs font-medium transition-colors ${
                  tab === 'pending'
                    ? 'bg-obsidian-elevated text-obsidian-primary shadow-obs-sm'
                    : 'text-obsidian-secondary hover:text-obsidian-primary'
                }`}
              >
                Pending ({pendingOrders.length})
              </button>
              <button
                data-testid="tab-history"
                onClick={() => setTab('history')}
                className={`rounded-obs-sm px-3 py-1 text-xs font-medium transition-colors ${
                  tab === 'history'
                    ? 'bg-obsidian-elevated text-obsidian-primary shadow-obs-sm'
                    : 'text-obsidian-secondary hover:text-obsidian-primary'
                }`}
              >
                History ({orderHistory.length})
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tab === 'pending' ? (
            <PendingOrdersTable
              accountId={accountId || undefined}
              orders={pendingOrders}
              isLoading={cancelLoading}
              onCancel={handleCancel}
            />
          ) : (
            <OrderHistoryTable orders={orderHistory} />
          )}
          {cancelError && (
            <p className="mt-2 text-xs text-[var(--bear)]" data-testid="cancel-error">
              Cancel failed: {cancelError.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
