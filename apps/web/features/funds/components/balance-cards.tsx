/**
 * @file balance-cards.tsx
 * @module web
 * @description Four balance summary cards for the funds dashboard.
 * @author BharatERP
 * @created 2026-04-16
 */

import { Card, CardContent } from '@obsidian/obsidian-ui';
import type { FundsSummary } from '../lib/types';
import { fmt } from '../../trading-terminal/lib/format-utils';

export function BalanceCards({ summary }: { summary: FundsSummary }) {
  const cards = [
    { label: 'Account Balance', value: `$${fmt(summary.balance)}` },
    { label: 'Available for Withdrawal', value: `$${fmt(summary.availableForWithdrawal)}` },
    { label: 'Pending Deposits', value: `$${fmt(summary.pendingDeposits)}`, accent: summary.pendingDeposits > 0 },
    { label: 'Pending Withdrawals', value: `$${fmt(summary.pendingWithdrawals)}` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="balance-cards">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-obsidian-faint">{c.label}</p>
            <p className={`mt-1 font-mono text-xl font-semibold ${c.accent ? 'text-[var(--accent)]' : 'text-obsidian-primary'}`}>
              {c.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
