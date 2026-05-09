/**
 * File:        apps/platform-owner/src/features/revenue/invoice-table.tsx
 * Module:      platform-owner · Revenue Feature
 * Purpose:     Recent invoices table with status badges and tenant names
 *
 * Exports:
 *   - InvoiceTable(props) — server-compatible invoice table
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — cn()
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { cn } from '@obsidian/obsidian-ui';
import type { BillingInvoicePlaceholder, Broker } from '../../lib/types';

interface InvoiceTableProps {
  invoices: BillingInvoicePlaceholder[];
  brokers: Broker[];
}

const STATUS_STYLE: Record<string, string> = {
  PAID:    'bg-bull/10  text-bull  border-bull/25',
  DRAFT:   'bg-warn/10  text-warn  border-warn/25',
  OVERDUE: 'bg-bear/10  text-bear  border-bear/25',
};

export function InvoiceTable({ invoices, brokers }: InvoiceTableProps) {
  const brokerName = (id: string) => {
    const b = brokers.find((br) => br.id === Number(id.replace('t-', '')) || `t-00${br.id}` === id || id === `t-00${br.id}`);
    return b?.name ?? id;
  };

  const allInvoices = [
    ...invoices,
    { id: 'inv-003', tenantId: 't-001', invoiceNumber: 'INV-2026-003', amount: '8000.00', currency: 'USD', status: 'PAID',    createdAt: '2026-03-28T00:00:00.000Z', updatedAt: '2026-04-02T00:00:00.000Z' },
    { id: 'inv-004', tenantId: 't-002', invoiceNumber: 'INV-2026-004', amount: '2500.00', currency: 'USD', status: 'OVERDUE', createdAt: '2026-03-15T00:00:00.000Z', updatedAt: '2026-03-15T00:00:00.000Z' },
  ];

  return (
    <div className="overflow-x-auto rounded-r-lg border border-[var(--border)]">
      <table className="w-full text-left">
        <thead className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <tr>
            {['Invoice', 'Tenant', 'Amount', 'Currency', 'Status', 'Date'].map((h) => (
              <th key={h} className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.08em] text-fg3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)] bg-[var(--bg-panel)]">
          {allInvoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-[var(--bg-hover)] transition-colors">
              <td className="px-4 py-3 font-mono text-[12px] text-accent">{inv.invoiceNumber}</td>
              <td className="px-4 py-3 font-ui text-[13px] text-fg1">{brokerName(inv.tenantId)}</td>
              <td className="px-4 py-3 font-mono text-[13px] tabular-nums text-fg1">${Number(inv.amount).toLocaleString()}</td>
              <td className="px-4 py-3 font-mono text-[11px] text-fg3">{inv.currency}</td>
              <td className="px-4 py-3">
                <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase', STATUS_STYLE[inv.status] ?? 'text-fg3 border-[var(--border)]')}>
                  {inv.status}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-[11px] text-fg3">
                {new Date(inv.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
