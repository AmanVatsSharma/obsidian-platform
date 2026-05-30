/**
 * @file pending-orders-table.tsx
 * @module web
 * @description Pending orders table with cancel action for the orders page.
 * @author BharatERP
 * @created 2026-04-16
 */

import { Button } from '@obsidian/obsidian-ui';
import type { PendingOrder } from '../../trading-terminal/lib/types';

export interface PendingOrdersTableProps {
  /** Optional accountId — when provided, component fetches pending orders via useOrders */
  accountId?: string;
  /** Orders passed in directly (e.g. from mock data or parent state) */
  orders?: PendingOrder[];
  /** Loading state (used when parent manages orders) */
  isLoading?: boolean;
  /** Called when an order is cancelled */
  onCancel?: (orderId: string) => void;
}

export function PendingOrdersTable({
  accountId,
  orders: pendingOrders,
  isLoading = false,
  onCancel,
}: PendingOrdersTableProps) {
  const orders = pendingOrders ?? [];

  if (isLoading) {
    return <p className="py-6 text-center text-sm text-obsidian-faint">Loading...</p>;
  }

  if (orders.length === 0) {
    return <p className="py-6 text-center text-sm text-obsidian-faint">No pending orders.</p>;
  }

  return (
    <div className="overflow-x-auto" data-testid="pending-orders-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-obsidian-border text-left text-xs uppercase tracking-wider text-obsidian-faint">
            <th className="px-3 py-2">Symbol</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2 text-right">Lots</th>
            <th className="px-3 py-2 text-right">Price</th>
            <th className="px-3 py-2 text-right">SL</th>
            <th className="px-3 py-2 text-right">TP</th>
            <th className="px-3 py-2">Created</th>
            <th className="px-3 py-2">Expiry</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-obsidian-border/50 hover:bg-obsidian-muted/50" data-testid={`pending-row-${o.id}`}>
              <td className="px-3 py-2 font-mono font-medium">{o.symbol}</td>
              <td className="px-3 py-2">
                <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${
                  o.side === 'BUY' ? 'bg-[var(--bull)]/10 text-[var(--bull)]' : 'bg-[var(--bear)]/10 text-[var(--bear)]'
                }`}>
                  {o.type}
                </span>
              </td>
              <td className="px-3 py-2 text-right font-mono">{o.lots}</td>
              <td className="px-3 py-2 text-right font-mono">{o.price}</td>
              <td className="px-3 py-2 text-right font-mono text-obsidian-secondary">{o.sl}</td>
              <td className="px-3 py-2 text-right font-mono text-obsidian-secondary">{o.tp}</td>
              <td className="px-3 py-2 text-xs text-obsidian-secondary">{o.created}</td>
              <td className="px-3 py-2 text-xs text-obsidian-secondary">{o.expiry}</td>
              <td className="px-3 py-2">
                <Button variant="destructive" size="sm" onClick={() => onCancel?.(o.id)} data-testid={`cancel-${o.id}`}>
                  Cancel
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
