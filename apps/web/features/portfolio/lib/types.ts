/**
 * @file types.ts
 * @module web
 * @description Portfolio-specific types for holdings, allocation, and summary display.
 * @author BharatERP
 * @created 2026-04-16
 */

export type Holding = {
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  allocationPct: number;
  changePct: number;
};

export type PortfolioSummary = {
  totalEquity: number;
  dayPnl: number;
  dayPnlPct: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  freeMargin: number;
  marginUsed: number;
};
