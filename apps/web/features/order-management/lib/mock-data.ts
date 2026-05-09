/**
 * @file mock-data.ts
 * @module web
 * @description Extended order history with varied statuses for the orders page.
 * @author BharatERP
 * @created 2026-04-16
 */

import type { ExtendedHistoryRow } from './types';

export const ORDER_HISTORY: ExtendedHistoryRow[] = [
  { id: 'H001', symbol: 'EUR/USD', type: 'BUY', lots: 1.0, openPrice: 1.07234, closePrice: 1.08123, pnl: 889.0, openTime: '2026-03-14 09:23', closeTime: '2026-03-14 16:45', duration: '7h 22m', status: 'FILLED' },
  { id: 'H002', symbol: 'BTC/USD', type: 'BUY', lots: 0.02, openPrice: 65200.0, closePrice: 66800.0, pnl: 320.0, openTime: '2026-03-13 14:00', closeTime: '2026-03-14 08:30', duration: '18h 30m', status: 'FILLED' },
  { id: 'H003', symbol: 'XAUUSD', type: 'SELL', lots: 0.1, openPrice: 2356.0, closePrice: 2341.0, pnl: 150.0, openTime: '2026-03-13 10:15', closeTime: '2026-03-13 15:22', duration: '5h 7m', status: 'FILLED' },
  { id: 'H004', symbol: 'GBP/USD', type: 'SELL', lots: 1.0, openPrice: 1.281, closePrice: 1.2889, pnl: -790.0, openTime: '2026-03-12 08:00', closeTime: '2026-03-12 19:30', duration: '11h 30m', status: 'FILLED' },
  { id: 'H005', symbol: 'US500', type: 'BUY', lots: 2.0, openPrice: 5189.0, closePrice: 5234.0, pnl: 900.0, openTime: '2026-03-11 15:00', closeTime: '2026-03-12 14:55', duration: '23h 55m', status: 'FILLED' },
  { id: 'H006', symbol: 'ETH/USD', type: 'BUY', lots: 0.1, openPrice: 3380.0, closePrice: 3290.0, pnl: -900.0, openTime: '2026-03-11 09:30', closeTime: '2026-03-11 18:00', duration: '8h 30m', status: 'FILLED' },
  { id: 'H007', symbol: 'USD/JPY', type: 'SELL', lots: 1.0, openPrice: 150.45, closePrice: 149.78, pnl: 447.0, openTime: '2026-03-10 07:45', closeTime: '2026-03-10 22:10', duration: '14h 25m', status: 'FILLED' },
  { id: 'H008', symbol: 'NAS100', type: 'BUY LIMIT', lots: 0.5, openPrice: 18100.0, closePrice: 0, pnl: 0, openTime: '2026-03-09 08:00', closeTime: '2026-03-09 20:00', duration: '12h', status: 'CANCELLED' },
  { id: 'H009', symbol: 'XAGUSD', type: 'SELL STOP', lots: 1.0, openPrice: 28.5, closePrice: 0, pnl: 0, openTime: '2026-03-08 14:30', closeTime: '2026-03-10 14:30', duration: '48h', status: 'EXPIRED' },
  { id: 'H010', symbol: 'USOIL', type: 'BUY', lots: 0.5, openPrice: 77.8, closePrice: 78.15, pnl: 87.5, openTime: '2026-03-07 16:00', closeTime: '2026-03-07 21:00', duration: '5h', status: 'PARTIALLY_FILLED' },
  { id: 'H011', symbol: 'EUR/USD', type: 'SELL LIMIT', lots: 2.0, openPrice: 1.092, closePrice: 0, pnl: 0, openTime: '2026-03-06 09:00', closeTime: '2026-03-07 09:00', duration: '24h', status: 'EXPIRED' },
  { id: 'H012', symbol: 'GER40', type: 'BUY', lots: 1.0, openPrice: 18023.0, closePrice: 18134.5, pnl: 111.5, openTime: '2026-03-05 08:00', closeTime: '2026-03-05 17:30', duration: '9h 30m', status: 'FILLED' },
];
