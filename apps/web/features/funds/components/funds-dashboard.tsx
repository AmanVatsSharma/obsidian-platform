/**
 * @file funds-dashboard.tsx
 * @module web
 * @description Main funds view with balance cards, linked accounts, and transactions.
 * @author BharatERP
 * @created 2026-04-16
 */

import { Card, CardHeader, CardTitle, CardContent } from '@obsidian/obsidian-ui';
import { BANK_ACCOUNTS, FUNDS_SUMMARY, TRANSACTIONS } from '../lib/mock-data';
import { BalanceCards } from './balance-cards';
import { LinkedAccounts } from './linked-accounts';
import { TransactionTable } from './transaction-table';

export function FundsDashboard() {
  return (
    <div className="flex flex-col gap-6" data-testid="funds-dashboard">
      <BalanceCards summary={FUNDS_SUMMARY} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linked Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedAccounts accounts={BANK_ACCOUNTS} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTable transactions={TRANSACTIONS} />
        </CardContent>
      </Card>
    </div>
  );
}
