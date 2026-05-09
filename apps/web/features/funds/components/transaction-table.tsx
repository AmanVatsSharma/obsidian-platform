/**
 * @file transaction-table.tsx
 * @module web
 * @description Transaction history table with type and status badges.
 * @author BharatERP
 * @created 2026-04-16
 */

import type { FundTransaction, TransactionStatus, TransactionType } from '../lib/types';
import { fmt } from '../../trading-terminal/lib/format-utils';

const TYPE_STYLES: Record<TransactionType, string> = {
  DEPOSIT: 'bg-[var(--bull)]/10 text-[var(--bull)]',
  WITHDRAWAL: 'bg-[var(--bear)]/10 text-[var(--bear)]',
  TRANSFER: 'bg-[var(--accent)]/10 text-[var(--accent)]',
  FEE: 'bg-obsidian-muted text-obsidian-faint',
  REBATE: 'bg-[var(--bull)]/10 text-[var(--bull)]',
};

const STATUS_STYLES: Record<TransactionStatus, string> = {
  COMPLETED: 'text-[var(--bull)]',
  PENDING: 'text-[var(--accent)]',
  FAILED: 'text-[var(--bear)]',
};

export function TransactionTable({ transactions }: { transactions: FundTransaction[] }) {
  return (
    <div className="overflow-x-auto" data-testid="transaction-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-obsidian-border text-left text-xs uppercase tracking-wider text-obsidian-faint">
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2 text-right">Amount</th>
            <th className="px-3 py-2">Method</th>
            <th className="px-3 py-2">Reference</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-b border-obsidian-border/50 hover:bg-obsidian-muted/50" data-testid={`txn-row-${t.id}`}>
              <td className="px-3 py-2 text-xs text-obsidian-secondary">{t.date}</td>
              <td className="px-3 py-2">
                <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${TYPE_STYLES[t.type]}`}>
                  {t.type}
                </span>
              </td>
              <td className={`px-3 py-2 text-right font-mono font-medium ${t.amount >= 0 ? 'text-[var(--bull)]' : 'text-[var(--bear)]'}`}>
                {t.amount >= 0 ? '+' : ''}${fmt(Math.abs(t.amount))}
              </td>
              <td className="px-3 py-2 text-xs text-obsidian-secondary">{t.method}</td>
              <td className="px-3 py-2 font-mono text-xs text-obsidian-faint">{t.reference}</td>
              <td className="px-3 py-2">
                <span className={`text-xs font-semibold ${STATUS_STYLES[t.status]}`}>{t.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
