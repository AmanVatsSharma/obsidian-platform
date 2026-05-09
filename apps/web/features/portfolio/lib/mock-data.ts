/**
 * @file mock-data.ts
 * @module web
 * @description Mock holdings and portfolio summary for the portfolio dashboard.
 * @author BharatERP
 * @created 2026-04-16
 */

import type { Holding, PortfolioSummary } from './types';

export const HOLDINGS: Holding[] = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', quantity: 100000, avgCost: 1.08234, currentPrice: 1.08452, value: 108452, allocationPct: 28.4, changePct: 0.2 },
  { symbol: 'XAUUSD', name: 'Gold', quantity: 10, avgCost: 2340.0, currentPrice: 2345.67, value: 23456.7, allocationPct: 6.1, changePct: 0.24 },
  { symbol: 'BTC/USD', name: 'Bitcoin', quantity: 0.01, avgCost: 66500.0, currentPrice: 67834.5, value: 678.35, allocationPct: 0.2, changePct: 2.01 },
  { symbol: 'GBP/USD', name: 'Pound / US Dollar', quantity: 50000, avgCost: 1.275, currentPrice: 1.27234, value: 63617, allocationPct: 16.7, changePct: -0.21 },
  { symbol: 'US500', name: 'S&P 500', quantity: 100, avgCost: 5260.0, currentPrice: 5234.5, value: 523450, allocationPct: 37.2, changePct: -0.49 },
  { symbol: 'USD/JPY', name: 'US Dollar / Yen', quantity: 30000, avgCost: 149.5, currentPrice: 149.782, value: 44934.6, allocationPct: 11.4, changePct: 0.19 },
];

export const PORTFOLIO_SUMMARY: PortfolioSummary = {
  totalEquity: 124856.78,
  dayPnl: 1234.56,
  dayPnlPct: 1.0,
  unrealizedPnl: 739.75,
  unrealizedPnlPct: 0.59,
  freeMargin: 87234.12,
  marginUsed: 3606.41,
};
