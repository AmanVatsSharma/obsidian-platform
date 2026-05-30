/**
 * @file mock-data.ts
 * @module web-trading
 * @description Typed mock catalogue and DOM helpers (parity with `apps/web/legacy/lib/mockData.js`).
 * @author BharatERP
 * @created 2026-04-03
 */

import type {
  AccountSnapshot,
  CalendarEvent,
  Instrument,
  NewsItem,
  OpenPosition,
  PendingOrder,
  TradeHistoryRow,
} from './types';

export function generateOHLCV(basePrice: number, count = 300, volatility = 0.0018) {
  const candles: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }> = [];
  let price = basePrice;
  const now = Math.floor(Date.now() / 1000);
  const interval = 60;
  let time = now - count * interval;

  for (let i = 0; i < count; i++) {
    const open = price;
    const drift = (Math.random() - 0.492) * volatility;
    const close = open * (1 + drift);
    const wick = Math.random() * volatility * 0.4;
    const high = Math.max(open, close) * (1 + wick);
    const low = Math.min(open, close) * (1 - wick);
    const volume = Math.floor(Math.random() * 800000 + 80000);
    candles.push({
      time,
      open: parseFloat(open.toFixed(5)),
      high: parseFloat(high.toFixed(5)),
      low: parseFloat(low.toFixed(5)),
      close: parseFloat(close.toFixed(5)),
      volume,
    });
    price = close;
    time += interval;
  }
  return candles;
}

export const INSTRUMENTS: Instrument[] = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', bid: 1.08452, ask: 1.08458, change: 0.0012, changePct: 0.11, high: 1.08891, low: 1.08123, spread: 0.6, pip: 0.0001, category: 'forex', digits: 5 },
  { symbol: 'GBP/USD', name: 'Pound / US Dollar', bid: 1.27234, ask: 1.27241, change: -0.0034, changePct: -0.27, high: 1.27891, low: 1.27012, spread: 0.7, pip: 0.0001, category: 'forex', digits: 5 },
  { symbol: 'USD/JPY', name: 'US Dollar / Yen', bid: 149.782, ask: 149.789, change: 0.234, changePct: 0.16, high: 150.234, low: 149.456, spread: 0.7, pip: 0.01, category: 'forex', digits: 3 },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', bid: 0.89234, ask: 0.89241, change: -0.0023, changePct: -0.26, high: 0.89678, low: 0.89012, spread: 0.7, pip: 0.0001, category: 'forex', digits: 5 },
  { symbol: 'AUD/USD', name: 'Aussie / US Dollar', bid: 0.65123, ask: 0.6513, change: 0.0008, changePct: 0.12, high: 0.65456, low: 0.64889, spread: 0.7, pip: 0.0001, category: 'forex', digits: 5 },
  { symbol: 'USD/CAD', name: 'US Dollar / CAD', bid: 1.35678, ask: 1.35686, change: 0.0015, changePct: 0.11, high: 1.36012, low: 1.35234, spread: 0.8, pip: 0.0001, category: 'forex', digits: 5 },
  { symbol: 'NZD/USD', name: 'Kiwi / US Dollar', bid: 0.60234, ask: 0.60241, change: -0.0011, changePct: -0.18, high: 0.60567, low: 0.59978, spread: 0.7, pip: 0.0001, category: 'forex', digits: 5 },
  { symbol: 'BTC/USD', name: 'Bitcoin', bid: 67834.5, ask: 67841.2, change: 1234.5, changePct: 1.85, high: 68901.0, low: 66234.0, spread: 6.7, pip: 1, category: 'crypto', digits: 1 },
  { symbol: 'ETH/USD', name: 'Ethereum', bid: 3456.78, ask: 3457.45, change: -45.23, changePct: -1.29, high: 3545.0, low: 3412.0, spread: 0.67, pip: 0.01, category: 'crypto', digits: 2 },
  { symbol: 'SOL/USD', name: 'Solana', bid: 178.45, ask: 178.58, change: 5.67, changePct: 3.28, high: 183.0, low: 172.0, spread: 0.13, pip: 0.01, category: 'crypto', digits: 2 },
  { symbol: 'XRP/USD', name: 'Ripple', bid: 0.6234, ask: 0.6238, change: 0.0123, changePct: 2.01, high: 0.645, low: 0.61, spread: 0.04, pip: 0.0001, category: 'crypto', digits: 4 },
  { symbol: 'US500', name: 'S&P 500', bid: 5234.5, ask: 5234.8, change: 23.45, changePct: 0.45, high: 5256.0, low: 5198.0, spread: 0.3, pip: 0.1, category: 'indices', digits: 2 },
  { symbol: 'US30', name: 'Dow Jones 30', bid: 39234.5, ask: 39235.8, change: -123.45, changePct: -0.31, high: 39456.0, low: 39123.0, spread: 1.3, pip: 1, category: 'indices', digits: 1 },
  { symbol: 'NAS100', name: 'NASDAQ 100', bid: 18234.5, ask: 18235.5, change: 145.0, changePct: 0.8, high: 18456.0, low: 18001.0, spread: 1.0, pip: 0.1, category: 'indices', digits: 1 },
  { symbol: 'GER40', name: 'DAX 40', bid: 18134.5, ask: 18135.5, change: 89.0, changePct: 0.49, high: 18345.0, low: 18023.0, spread: 1.0, pip: 0.1, category: 'indices', digits: 1 },
  { symbol: 'XAUUSD', name: 'Gold', bid: 2345.67, ask: 2345.97, change: 12.34, changePct: 0.53, high: 2356.0, low: 2334.0, spread: 0.3, pip: 0.01, category: 'commodities', digits: 2 },
  { symbol: 'XAGUSD', name: 'Silver', bid: 29.456, ask: 29.476, change: -0.234, changePct: -0.79, high: 29.789, low: 29.123, spread: 0.02, pip: 0.001, category: 'commodities', digits: 3 },
  { symbol: 'USOIL', name: 'Crude Oil WTI', bid: 78.234, ask: 78.264, change: 1.234, changePct: 1.6, high: 79.456, low: 77.234, spread: 0.03, pip: 0.001, category: 'commodities', digits: 3 },
  { symbol: 'NATGAS', name: 'Natural Gas', bid: 2.1234, ask: 2.1254, change: -0.0456, changePct: -2.1, high: 2.189, low: 2.0789, spread: 0.02, pip: 0.0001, category: 'commodities', digits: 4 },
];

export const OPEN_POSITIONS: OpenPosition[] = [
  { id: 'P001', symbol: 'EUR/USD', type: 'BUY', lots: 1.0, openPrice: 1.08234, currentPrice: 1.08452, sl: 1.078, tp: 1.09, pnl: 218.0, pnlPct: 0.2, swap: -2.4, commission: -7.0, openTime: '2026-03-15 08:23:14', margin: 1084.52 },
  { id: 'P002', symbol: 'GBP/USD', type: 'SELL', lots: 0.5, openPrice: 1.275, currentPrice: 1.27234, sl: 1.282, tp: 1.265, pnl: 133.0, pnlPct: 0.21, swap: -1.2, commission: -3.5, openTime: '2026-03-15 09:45:30', margin: 636.17 },
  { id: 'P003', symbol: 'XAUUSD', type: 'BUY', lots: 0.1, openPrice: 2340.0, currentPrice: 2345.67, sl: 2320.0, tp: 2380.0, pnl: 56.7, pnlPct: 0.24, swap: -0.8, commission: -5.0, openTime: '2026-03-14 14:12:05', margin: 234.57 },
  { id: 'P004', symbol: 'BTC/USD', type: 'BUY', lots: 0.01, openPrice: 66500.0, currentPrice: 67834.5, sl: 65000.0, tp: 70000.0, pnl: 133.45, pnlPct: 2.01, swap: 0.0, commission: -6.78, openTime: '2026-03-14 22:33:17', margin: 678.35 },
  { id: 'P005', symbol: 'US500', type: 'SELL', lots: 1.0, openPrice: 5260.0, currentPrice: 5234.5, sl: 5300.0, tp: 5180.0, pnl: 255.0, pnlPct: 0.49, swap: -3.1, commission: -5.0, openTime: '2026-03-15 10:01:44', margin: 523.45 },
  { id: 'P006', symbol: 'USD/JPY', type: 'BUY', lots: 0.3, openPrice: 149.5, currentPrice: 149.782, sl: 148.8, tp: 151.0, pnl: -56.4, pnlPct: -0.19, swap: -0.6, commission: -2.1, openTime: '2026-03-15 11:22:09', margin: 449.35 },
];

export const PENDING_ORDERS: PendingOrder[] = [
  { id: 'O001', symbol: 'EUR/USD', type: 'LIMIT', side: 'BUY', lots: 2.0, price: 1.078, sl: 1.072, tp: 1.09, distance: 0, status: 'PENDING', created: '2026-03-15 08:00:00', expiry: 'GTC' },
  { id: 'O002', symbol: 'GBP/USD', type: 'STOP', side: 'SELL', lots: 1.0, price: 1.268, sl: 1.275, tp: 1.255, distance: 0, status: 'PENDING', created: '2026-03-14 18:30:00', expiry: 'GTC' },
  { id: 'O003', symbol: 'XAUUSD', type: 'LIMIT', side: 'BUY', lots: 0.2, price: 2310.0, sl: 2290.0, tp: 2360.0, distance: 0, status: 'PENDING', created: '2026-03-15 07:45:00', expiry: '2026-03-16' },
  { id: 'O004', symbol: 'NAS100', type: 'LIMIT', side: 'SELL', lots: 0.5, price: 18400.0, sl: 18500.0, tp: 18100.0, distance: 0, status: 'PENDING', created: '2026-03-15 09:15:00', expiry: 'GTC' },
];

export const TRADE_HISTORY: TradeHistoryRow[] = [
  { id: 'H001', symbol: 'EUR/USD', type: 'BUY', lots: 1.0, openPrice: 1.07234, closePrice: 1.08123, pnl: 889.0, openTime: '2026-03-14 09:23', closeTime: '2026-03-14 16:45', duration: '7h 22m' },
  { id: 'H002', symbol: 'BTC/USD', type: 'BUY', lots: 0.02, openPrice: 65200.0, closePrice: 66800.0, pnl: 320.0, openTime: '2026-03-13 14:00', closeTime: '2026-03-14 08:30', duration: '18h 30m' },
  { id: 'H003', symbol: 'XAUUSD', type: 'SELL', lots: 0.1, openPrice: 2356.0, closePrice: 2341.0, pnl: 150.0, openTime: '2026-03-13 10:15', closeTime: '2026-03-13 15:22', duration: '5h 7m' },
  { id: 'H004', symbol: 'GBP/USD', type: 'SELL', lots: 1.0, openPrice: 1.281, closePrice: 1.2889, pnl: -790.0, openTime: '2026-03-12 08:00', closeTime: '2026-03-12 19:30', duration: '11h 30m' },
  { id: 'H005', symbol: 'US500', type: 'BUY', lots: 2.0, openPrice: 5189.0, closePrice: 5234.0, pnl: 900.0, openTime: '2026-03-11 15:00', closeTime: '2026-03-12 14:55', duration: '23h 55m' },
  { id: 'H006', symbol: 'ETH/USD', type: 'BUY', lots: 0.1, openPrice: 3380.0, closePrice: 3290.0, pnl: -900.0, openTime: '2026-03-11 09:30', closeTime: '2026-03-11 18:00', duration: '8h 30m' },
  { id: 'H007', symbol: 'USD/JPY', type: 'SELL', lots: 1.0, openPrice: 150.45, closePrice: 149.78, pnl: 447.0, openTime: '2026-03-10 07:45', closeTime: '2026-03-10 22:10', duration: '14h 25m' },
  { id: 'H008', symbol: 'USOIL', type: 'BUY', lots: 1.0, openPrice: 76.8, closePrice: 78.1, pnl: 130.0, openTime: '2026-03-09 11:00', closeTime: '2026-03-10 09:45', duration: '22h 45m' },
];

export const ACCOUNT: AccountSnapshot = {
  name: 'Alex Morgan',
  accountId: 'OB-84721',
  accountType: 'ECN Pro',
  broker: 'Obsidian Markets',
  currency: 'USD',
  leverage: '1:100',
  balance: 28450.0,
  equity: 29189.75,
  margin: 3606.41,
  freeMargin: 25583.34,
  marginLevel: 809.45,
  unrealizedPnl: 739.75,
  realizedPnlToday: 1245.8,
  drawdownPct: 3.24,
  server: 'OB-LIVE-01',
  ping: 12,
};

export function DOM_DATA(basePrice: number) {
  const levels = [];
  for (let i = 10; i >= 1; i--) {
    levels.push({
      price: parseFloat((basePrice - i * 0.0001).toFixed(5)),
      volume: Math.floor(Math.random() * 5000 + 500),
      type: 'bid' as const,
      depth: Math.floor(Math.random() * 30000 + 3000),
    });
  }
  for (let i = 1; i <= 10; i++) {
    levels.push({
      price: parseFloat((basePrice + i * 0.0001).toFixed(5)),
      volume: Math.floor(Math.random() * 5000 + 500),
      type: 'ask' as const,
      depth: Math.floor(Math.random() * 30000 + 3000),
    });
  }
  return levels;
}

export const ECONOMIC_CALENDAR: CalendarEvent[] = [
  { id: 'E001', time: '08:30', country: 'US', flag: '🇺🇸', event: 'CPI (YoY)', impact: 'high', forecast: '3.1%', previous: '3.2%', actual: null },
  { id: 'E002', time: '09:00', country: 'EU', flag: '🇪🇺', event: 'ECB Interest Rate Decision', impact: 'high', forecast: '4.50%', previous: '4.50%', actual: null },
  { id: 'E003', time: '10:00', country: 'US', flag: '🇺🇸', event: 'Core Retail Sales (MoM)', impact: 'medium', forecast: '0.4%', previous: '0.6%', actual: null },
  { id: 'E004', time: '12:30', country: 'UK', flag: '🇬🇧', event: 'BoE Governor Speech', impact: 'high', forecast: null, previous: null, actual: null },
  { id: 'E005', time: '14:30', country: 'US', flag: '🇺🇸', event: 'Initial Jobless Claims', impact: 'medium', forecast: '215K', previous: '219K', actual: '211K' },
  { id: 'E006', time: '15:00', country: 'CA', flag: '🇨🇦', event: 'BoC Rate Statement', impact: 'high', forecast: '5.00%', previous: '5.00%', actual: null },
  { id: 'E007', time: '16:00', country: 'US', flag: '🇺🇸', event: 'Fed Chair Powell Speech', impact: 'high', forecast: null, previous: null, actual: null },
  { id: 'E008', time: '00:30', country: 'AU', flag: '🇦🇺', event: 'Employment Change', impact: 'medium', forecast: '40.2K', previous: '38.5K', actual: '42.1K' },
];

export const NEWS: NewsItem[] = [
  { id: 'N001', time: '11:42', source: 'Reuters', sentiment: 'bullish', symbol: 'XAUUSD', headline: 'Gold surges to 3-week high as Fed rate cut bets increase amid cooling inflation data', category: 'commodities' },
  { id: 'N002', time: '11:28', source: 'Bloomberg', sentiment: 'bearish', symbol: 'GBP/USD', headline: 'Sterling retreats as UK growth data disappoints expectations for Q1 2026', category: 'forex' },
  { id: 'N003', time: '11:15', source: 'CNBC', sentiment: 'bullish', symbol: 'BTC/USD', headline: 'Bitcoin climbs above $68K as institutional inflows reach record monthly high', category: 'crypto' },
  { id: 'N004', time: '10:58', source: 'FT', sentiment: 'neutral', symbol: 'US500', headline: 'S&P 500 consolidates near highs ahead of key inflation print this afternoon', category: 'indices' },
  { id: 'N005', time: '10:33', source: 'Reuters', sentiment: 'bearish', symbol: 'USOIL', headline: 'Oil prices under pressure as OPEC+ signals potential output increase in Q2', category: 'commodities' },
  { id: 'N006', time: '10:12', source: 'Bloomberg', sentiment: 'bullish', symbol: 'EUR/USD', headline: 'Euro strengthens as ECB officials signal no rush to cut rates below neutral', category: 'forex' },
  { id: 'N007', time: '09:45', source: 'MarketWatch', sentiment: 'bullish', symbol: 'SOL/USD', headline: 'Solana DEX volumes hit all-time high, SOL outperforms crypto majors this week', category: 'crypto' },
  { id: 'N008', time: '09:22', source: 'WSJ', sentiment: 'neutral', symbol: 'USD/JPY', headline: 'BOJ officials remain divided on timeline for next rate hike amid wage data', category: 'forex' },
];

export const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M'] as const;

export const P_AND_L_HISTORY = [
  840, 1200, 950, 1450, 1100, 890, 1600, 1380, 1245, 1890, 1560, 2100, 1780, 2340, 2100, 1980, 2560, 2234, 1980, 2450, 2780, 2560, 2890, 2780, 3100, 2980, 3245, 3456, 3234, 3567,
];
