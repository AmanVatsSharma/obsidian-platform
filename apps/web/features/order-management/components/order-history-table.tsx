/**
 * @file order-history-table.tsx
 * @module web
 * @description Order history table with status badges for the orders page.
 * @author BharatERP
 * @created 2026-04-16
 */

import type { ExtendedHistoryRow, OrderStatus } from '../lib/types';
import { fmt, pnlSign } from '../../trading-terminal/lib/format-utils';

const STATUS_STYLES: Record<OrderStatus, string> = {
  FILLED: 'bg-[var(--bull)]/10 text-[var(--bull)]',
  CANCELLED: 'bg-[var(--bear)]/10 text-[var(--bear)]',
  PARTIALLY_FILLED: 'bg-[var(--accent)]/10 text-[var(--accent)]',
  EXPIRED: 'bg-obsidian-muted text-obsidian-faint',
};

function pnlColor(n: number) {
  return n >= 0 ? 'text-[var(--bull)]' : 'text-[var(--bear)]';
}

export function OrderHistoryTable({ orders }: { orders: ExtendedHistoryRow[] }) {
  if (orders.length === 0) {
    return <p className="py-6 text-center text-sm text-obsidian-faint">No order history.</p>;
  }

  return (
    <div className="overflow-x-auto" data-testid="order-history-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-obsidian-border text-left text-xs uppercase tracking-wider text-obsidian-faint">
            <th className="px-3 py-2">Symbol</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2 text-right">Lots</th>
            <th className="px-3 py-2 text-right">Open</th>
            <th className="px-3 py-2 text-right">Close</th>
            <th className="px-3 py-2 text-right">P&L</th>
            <th className="px-3 py-2">Duration</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-obsidian-border/50 hover:bg-obsidian-muted/50" data-testid={`history-row-${o.id}`}>
              <td className="px-3 py-2 font-mono font-medium">{o.symbol}</td>
              <td className="px-3 py-2 text-xs text-obsidian-secondary">{o.type}</td>
              <td className="px-3 py-2 text-right font-mono">{o.lots}</td>
              <td className="px-3 py-2 text-right font-mono">{o.openPrice || '—'}</td>
              <td className="px-3 py-2 text-right font-mono">{o.closePrice || '—'}</td>
              <td className={`px-3 py-2 text-right font-mono font-medium ${o.pnl !== 0 ? pnlColor(o.pnl) : 'text-obsidian-faint'}`}>
                {o.pnl !== 0 ? `${pnlSign(o.pnl)}$${fmt(Math.abs(o.pnl))}` : '—'}
              </td>
              <td className="px-3 py-2 text-xs text-obsidian-secondary">{o.duration}</td>
              <td className="px-3 py-2">
                <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[o.status]}`}>
                  {o.status.replace('_', ' ')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
