/**
 * @file linked-accounts.tsx
 * @module web
 * @description Linked bank account cards with primary badge.
 * @author BharatERP
 * @created 2026-04-16
 */

import { Card, CardContent } from '@obsidian/obsidian-ui';
import type { BankAccount } from '../lib/types';

export function LinkedAccounts({ accounts }: { accounts: BankAccount[] }) {
  return (
    <div className="flex gap-3" data-testid="linked-accounts">
      {accounts.map((a) => (
        <Card key={a.id} className="min-w-[200px]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{a.bankName}</p>
              {a.isPrimary && (
                <span className="rounded bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                  PRIMARY
                </span>
              )}
            </div>
            <p className="mt-1 font-mono text-sm text-obsidian-secondary">{a.accountNumber}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
