/**
 * @file mock-data.ts
 * @module web
 * @description Mock transactions, bank accounts, and balance summary for funds page.
 * @author BharatERP
 * @created 2026-04-16
 */

import type { BankAccount, FundsSummary, FundTransaction } from './types';

export const BANK_ACCOUNTS: BankAccount[] = [
  { id: 'BA001', bankName: 'HDFC Bank', accountNumber: '****4821', isPrimary: true },
  { id: 'BA002', bankName: 'ICICI Bank', accountNumber: '****7319', isPrimary: false },
];

export const FUNDS_SUMMARY: FundsSummary = {
  balance: 124856.78,
  availableForWithdrawal: 87234.12,
  pendingDeposits: 5000.0,
  pendingWithdrawals: 0,
};

export const TRANSACTIONS: FundTransaction[] = [
  { id: 'T001', date: '2026-04-15', type: 'DEPOSIT', amount: 25000, status: 'COMPLETED', method: 'Bank Transfer', reference: 'DEP-20260415-001' },
  { id: 'T002', date: '2026-04-14', type: 'FEE', amount: -45.5, status: 'COMPLETED', method: 'System', reference: 'FEE-20260414-SWAP' },
  { id: 'T003', date: '2026-04-13', type: 'WITHDRAWAL', amount: -10000, status: 'COMPLETED', method: 'Bank Transfer', reference: 'WDR-20260413-001' },
  { id: 'T004', date: '2026-04-12', type: 'REBATE', amount: 128.4, status: 'COMPLETED', method: 'Commission Rebate', reference: 'RBT-20260412-001' },
  { id: 'T005', date: '2026-04-11', type: 'DEPOSIT', amount: 5000, status: 'PENDING', method: 'Bank Transfer', reference: 'DEP-20260411-001' },
  { id: 'T006', date: '2026-04-10', type: 'FEE', amount: -12.0, status: 'COMPLETED', method: 'System', reference: 'FEE-20260410-DATA' },
  { id: 'T007', date: '2026-04-09', type: 'DEPOSIT', amount: 50000, status: 'COMPLETED', method: 'Wire Transfer', reference: 'DEP-20260409-001' },
  { id: 'T008', date: '2026-04-08', type: 'WITHDRAWAL', amount: -15000, status: 'COMPLETED', method: 'Bank Transfer', reference: 'WDR-20260408-001' },
  { id: 'T009', date: '2026-04-07', type: 'FEE', amount: -67.8, status: 'COMPLETED', method: 'System', reference: 'FEE-20260407-SWAP' },
  { id: 'T010', date: '2026-04-05', type: 'TRANSFER', amount: -5000, status: 'COMPLETED', method: 'Internal Transfer', reference: 'TRF-20260405-001' },
  { id: 'T011', date: '2026-04-04', type: 'DEPOSIT', amount: 30000, status: 'COMPLETED', method: 'UPI', reference: 'DEP-20260404-001' },
  { id: 'T012', date: '2026-04-03', type: 'REBATE', amount: 96.2, status: 'COMPLETED', method: 'Volume Rebate', reference: 'RBT-20260403-001' },
  { id: 'T013', date: '2026-04-02', type: 'WITHDRAWAL', amount: -8000, status: 'FAILED', method: 'Bank Transfer', reference: 'WDR-20260402-001' },
  { id: 'T014', date: '2026-04-01', type: 'DEPOSIT', amount: 20000, status: 'COMPLETED', method: 'Bank Transfer', reference: 'DEP-20260401-001' },
  { id: 'T015', date: '2026-03-30', type: 'FEE', amount: -34.5, status: 'COMPLETED', method: 'System', reference: 'FEE-20260330-SWAP' },
];
