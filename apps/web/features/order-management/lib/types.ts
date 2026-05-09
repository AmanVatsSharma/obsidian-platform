/**
 * @file types.ts
 * @module web
 * @description Order management types for extended history statuses.
 * @author BharatERP
 * @created 2026-04-16
 */

export type OrderStatus = 'FILLED' | 'CANCELLED' | 'PARTIALLY_FILLED' | 'EXPIRED';

export type ExtendedHistoryRow = {
  id: string;
  symbol: string;
  type: string;
  lots: number;
  openPrice: number;
  closePrice: number;
  pnl: number;
  openTime: string;
  closeTime: string;
  duration: string;
  status: OrderStatus;
};
