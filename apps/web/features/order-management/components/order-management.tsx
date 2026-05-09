/**
 * @file order-management.tsx
 * @module web
 * @description Tabbed order management view with pending orders and history.
 * @author BharatERP
 * @created 2026-04-16
 */

'use client';

import { useCallback, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@obsidian/obsidian-ui';
import type { PendingOrder } from '../../trading-terminal/lib/types';
import { PENDING_ORDERS } from '../../trading-terminal/lib/mock-data';
import { ORDER_HISTORY } from '../lib/mock-data';
import { PendingOrdersTable } from './pending-orders-table';
import { OrderHistoryTable } from './order-history-table';

type Tab = 'pending' | 'history';

export function OrderManagement() {
  const [tab, setTab] = useState<Tab>('pending');
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>(PENDING_ORDERS);

  const handleCancel = useCallback((id: string) => {
    setPendingOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

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
                History ({ORDER_HISTORY.length})
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tab === 'pending' ? (
            <PendingOrdersTable orders={pendingOrders} onCancel={handleCancel} />
          ) : (
            <OrderHistoryTable orders={ORDER_HISTORY} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
