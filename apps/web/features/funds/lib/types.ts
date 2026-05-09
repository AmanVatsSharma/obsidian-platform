/**
 * @file types.ts
 * @module web
 * @description Funds feature types for transactions, bank accounts, and balances.
 * @author BharatERP
 * @created 2026-04-16
 */

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'FEE' | 'REBATE';

export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED';

export type FundTransaction = {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  method: string;
  reference: string;
};

export type BankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  isPrimary: boolean;
};

export type FundsSummary = {
  balance: number;
  availableForWithdrawal: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
};
