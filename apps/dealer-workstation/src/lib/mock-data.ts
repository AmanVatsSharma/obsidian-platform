/**
 * File:        apps/dealer-workstation/src/lib/mock-data.ts
 * Module:      dealer-workstation · Mock Data
 * Purpose:     Seed data for all dealer terminal panels — instruments, orders, clients, executions, alerts, etc.
 *              Ported from legacy/obsidian-desk.html demo constants with full TypeScript types.
 *
 * Exports:
 *   - INSTRUMENTS            — 6 tradeable instruments with live bid/ask seed values
 *   - BOOK_POSITIONS         — dealer book per symbol (long/short lots, limits, bBook/aBook)
 *   - PENDING_ORDERS         — 14 orders awaiting dealer decision
 *   - CLIENTS                — 28 client accounts (VIP/PRO/RETAIL, with margin status)
 *   - EXECUTIONS             — 21 recent fill records
 *   - SURVEILLANCE_ALERTS    — 8 AML / compliance alerts
 *   - LP_PROVIDERS           — 3 liquidity providers
 *   - ECONOMIC_EVENTS        — 5 macro calendar events
 *   - NEWS_ITEMS             — 5 market news headlines
 *   - CHAT_MESSAGES          — 8 internal comms messages
 *   - WATCHLIST_CLIENT_IDS   — 7 IDs pinned to the left-rail watchlist
 *   - CHAT_CHANNELS          — 5 channel definitions
 *   - TEAM_MEMBERS           — online team presence for chat sidebar (with role)
 *   - DIRECT_CONTACTS        — direct message contacts for chat DIRECT section
 *   - ACTIVE_RESTRICTIONS    — clients currently under compliance restrictions
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import type {
  Instrument, BookPosition, PendingOrder, Client, Execution,
  SurveillanceAlert, LpProvider, EconomicEvent, NewsItem, ChatMessage,
} from './types';

export const INSTRUMENTS: Instrument[] = [
  { symbol: 'EUR/USD', pip: 0.0001, digits: 5, bid: 1.08452, ask: 1.08458, high: 1.09012, low: 1.08012, change: 0.11,  volume: 12400, avgVolume: 15000, routing: 'STP', bookRouting: 'B' },
  { symbol: 'GBP/USD', pip: 0.0001, digits: 5, bid: 1.26812, ask: 1.26821, high: 1.27450, low: 1.26340, change: -0.23, volume: 8700,  avgVolume: 9200,  routing: 'STP', bookRouting: 'B' },
  { symbol: 'USD/JPY', pip: 0.01,   digits: 3, bid: 149.842, ask: 149.851, high: 150.234, low: 149.512, change: 0.34,  volume: 18200, avgVolume: 16000, routing: 'STP', bookRouting: 'A' },
  { symbol: 'XAU/USD', pip: 0.01,   digits: 2, bid: 2318.45, ask: 2319.15, high: 2341.20, low: 2298.80, change: 0.87,  volume: 4100,  avgVolume: 5500,  routing: 'B',   bookRouting: 'B' },
  { symbol: 'BTC/USD', pip: 1,      digits: 1, bid: 67841.0, ask: 67891.0, high: 69200.0, low: 66400.0, change: -1.42, volume: 820,   avgVolume: 1100,  routing: 'STP', bookRouting: 'A' },
  { symbol: 'US500',   pip: 0.1,    digits: 1, bid: 5241.8,  ask: 5242.3,  high: 5289.0,  low: 5198.0,  change: 0.52,  volume: 3400,  avgVolume: 4200,  routing: 'B',   bookRouting: 'B' },
];

export const BOOK_POSITIONS: BookPosition[] = [
  { symbol: 'EUR/USD', longLots: 68.4, shortLots: 23.2, avgOpen: 1.08210, current: 1.08452, limit: 100, hedged: 0,  lpExposure: 0,  clients: 14, bBook: 60, aBook: 40 },
  { symbol: 'GBP/USD', longLots: 8.1,  shortLots: 20.2, avgOpen: 1.26990, current: 1.26812, limit: 80,  hedged: 5,  lpExposure: 5,  clients: 8,  bBook: 55, aBook: 45 },
  { symbol: 'USD/JPY', longLots: 31.5, shortLots: 29.7, avgOpen: 149.910, current: 149.842, limit: 120, hedged: 0,  lpExposure: 0,  clients: 11, bBook: 70, aBook: 30 },
  { symbol: 'XAU/USD', longLots: 12.3, shortLots: 4.0,  avgOpen: 2301.50, current: 2318.45, limit: 30,  hedged: 3,  lpExposure: 3,  clients: 6,  bBook: 45, aBook: 55 },
  { symbol: 'BTC/USD', longLots: 0.65, shortLots: 0.20, avgOpen: 66200.0, current: 67841.0, limit: 2,   hedged: 0,  lpExposure: 0,  clients: 4,  bBook: 40, aBook: 60 },
  { symbol: 'US500',   longLots: 4.0,  shortLots: 26.0, avgOpen: 5260.0,  current: 5241.8,  limit: 50,  hedged: 10, lpExposure: 10, clients: 7,  bBook: 50, aBook: 50 },
];

export const PENDING_ORDERS: PendingOrder[] = [
  { id: 'ORD-4721', clientId: 4721, clientName: 'James Morrison',  tier: 'VIP',    side: 'BUY',  symbol: 'EUR/USD', lots: 5.00,  type: 'MARKET', time: '14:23:07.441', notional: 543250,  age: 1.2, marketPrice: 1.08456, clientPrice: 1.08458, slippage: 0.2 },
  { id: 'ORD-3891', clientId: 3891, clientName: 'Sarah Chen',      tier: 'PRO',    side: 'SELL', symbol: 'GBP/USD', lots: 2.50,  type: 'MARKET', time: '14:23:05.112', notional: 317053,  age: 3.4, marketPrice: 1.26818, clientPrice: 1.26812, slippage: -0.6 },
  { id: 'ORD-2241', clientId: 2241, clientName: 'Viktor Petrov',   tier: 'PRO',    side: 'BUY',  symbol: 'XAU/USD', lots: 10.00, type: 'MARKET', time: '14:23:04.891', notional: 2319150, age: 4.2, marketPrice: 2319.15, clientPrice: 2319.35, slippage: 0.2 },
  { id: 'ORD-6612', clientId: 6612, clientName: 'Mei Tanaka',      tier: 'RETAIL', side: 'BUY',  symbol: 'USD/JPY', lots: 0.50,  type: 'LIMIT',  time: '14:23:08.003', notional: 74926,   age: 0.8, marketPrice: 149.851, clientPrice: 149.800, slippage: 0 },
  { id: 'ORD-5503', clientId: 5503, clientName: 'Omar Al-Rashid',  tier: 'VIP',    side: 'SELL', symbol: 'EUR/USD', lots: 20.00, type: 'MARKET', time: '14:23:06.220', notional: 2169040, age: 2.1, marketPrice: 1.08452, clientPrice: 1.08448, slippage: -0.4 },
  { id: 'ORD-7841', clientId: 7841, clientName: 'Anna Kowalski',   tier: 'RETAIL', side: 'BUY',  symbol: 'BTC/USD', lots: 0.10,  type: 'MARKET', time: '14:23:09.112', notional: 6789,    age: 0.5, marketPrice: 67891.0, clientPrice: 67901.0, slippage: 1.0 },
  { id: 'ORD-3312', clientId: 3312, clientName: 'David Park',      tier: 'PRO',    side: 'SELL', symbol: 'US500',   lots: 5.00,  type: 'MARKET', time: '14:23:07.881', notional: 26212,   age: 1.8, marketPrice: 5242.3,  clientPrice: 5241.8,  slippage: -0.5 },
  { id: 'ORD-9001', clientId: 9001, clientName: 'Elena Vasquez',   tier: 'RETAIL', side: 'BUY',  symbol: 'GBP/USD', lots: 1.00,  type: 'MARKET', time: '14:23:08.441', notional: 126821,  age: 0.9, marketPrice: 1.26821, clientPrice: 1.26825, slippage: 0.4 },
  { id: 'ORD-4450', clientId: 4450, clientName: 'Chen Wei',        tier: 'PRO',    side: 'BUY',  symbol: 'EUR/USD', lots: 8.00,  type: 'MARKET', time: '14:23:06.780', notional: 867664,  age: 2.9, marketPrice: 1.08458, clientPrice: 1.08462, slippage: 0.4 },
  { id: 'ORD-1192', clientId: 1192, clientName: 'Marcus Webb',     tier: 'RETAIL', side: 'SELL', symbol: 'XAU/USD', lots: 0.50,  type: 'STOP',   time: '14:23:09.330', notional: 115958,  age: 0.4, marketPrice: 2318.45, clientPrice: 2318.00, slippage: 0 },
  { id: 'ORD-8823', clientId: 8823, clientName: 'Fatima Malik',    tier: 'PRO',    side: 'BUY',  symbol: 'USD/JPY', lots: 3.00,  type: 'MARKET', time: '14:23:05.991', notional: 299702,  age: 3.7, marketPrice: 149.851, clientPrice: 149.860, slippage: 0.9 },
  { id: 'ORD-6671', clientId: 6671, clientName: 'Thomas Brandt',   tier: 'RETAIL', side: 'SELL', symbol: 'BTC/USD', lots: 0.20,  type: 'MARKET', time: '14:23:08.771', notional: 13568,   age: 1.1, marketPrice: 67841.0, clientPrice: 67838.0, slippage: -0.3 },
  { id: 'ORD-2298', clientId: 2298, clientName: 'Isabella Russo',  tier: 'VIP',    side: 'BUY',  symbol: 'GBP/USD', lots: 15.00, type: 'MARKET', time: '14:23:07.002', notional: 1902315, age: 1.6, marketPrice: 1.26821, clientPrice: 1.26828, slippage: 0.7 },
  { id: 'ORD-5577', clientId: 5577, clientName: 'Robert Kim',      tier: 'PRO',    side: 'SELL', symbol: 'EUR/USD', lots: 4.00,  type: 'LIMIT',  time: '14:23:09.551', notional: 433808,  age: 0.3, marketPrice: 1.08452, clientPrice: 1.08500, slippage: 0 },
];

export const CLIENTS: Client[] = [
  { id: 4721, name: 'James Morrison',  type: 'VIP',    equity: 245000, balance: 250000, margin: 78, floatPnl: +4820,  positions: 7,  volumeToday: 142.5, lastTrade: '2m ago',  status: 'NORMAL' },
  { id: 5503, name: 'Omar Al-Rashid',  type: 'VIP',    equity: 189000, balance: 195000, margin: 65, floatPnl: -2340,  positions: 4,  volumeToday: 88.0,  lastTrade: '5m ago',  status: 'NORMAL' },
  { id: 2298, name: 'Isabella Russo',  type: 'VIP',    equity: 312000, balance: 308000, margin: 82, floatPnl: +8400,  positions: 11, volumeToday: 210.0, lastTrade: '1m ago',  status: 'NORMAL' },
  { id: 3891, name: 'Sarah Chen',      type: 'PRO',    equity: 54200,  balance: 58000,  margin: 44, floatPnl: -1240,  positions: 3,  volumeToday: 32.5,  lastTrade: '3m ago',  status: 'NORMAL' },
  { id: 4450, name: 'Chen Wei',        type: 'PRO',    equity: 38400,  balance: 42000,  margin: 38, floatPnl: -820,   positions: 5,  volumeToday: 67.0,  lastTrade: '2m ago',  status: 'MARGIN_WARNING' },
  { id: 8823, name: 'Fatima Malik',    type: 'PRO',    equity: 28100,  balance: 31500,  margin: 35, floatPnl: -1940,  positions: 4,  volumeToday: 45.5,  lastTrade: '4m ago',  status: 'MARGIN_WARNING' },
  { id: 2241, name: 'Viktor Petrov',   type: 'PRO',    equity: 92000,  balance: 95000,  margin: 68, floatPnl: +3120,  positions: 6,  volumeToday: 156.0, lastTrade: '1m ago',  status: 'NORMAL' },
  { id: 6612, name: 'Mei Tanaka',      type: 'RETAIL', equity: 12400,  balance: 15000,  margin: 27, floatPnl: -980,   positions: 2,  volumeToday: 8.5,   lastTrade: '8m ago',  status: 'MARGIN_CALL' },
  { id: 7841, name: 'Anna Kowalski',   type: 'RETAIL', equity: 8900,   balance: 10000,  margin: 22, floatPnl: -440,   positions: 1,  volumeToday: 5.0,   lastTrade: '12m ago', status: 'MARGIN_CALL' },
  { id: 9001, name: 'Elena Vasquez',   type: 'RETAIL', equity: 18200,  balance: 19500,  margin: 56, floatPnl: +420,   positions: 3,  volumeToday: 14.0,  lastTrade: '1m ago',  status: 'NORMAL' },
  { id: 3312, name: 'David Park',      type: 'PRO',    equity: 67800,  balance: 70000,  margin: 71, floatPnl: +1840,  positions: 5,  volumeToday: 78.5,  lastTrade: '3m ago',  status: 'NORMAL' },
  { id: 1192, name: 'Marcus Webb',     type: 'RETAIL', equity: 5600,   balance: 6200,   margin: 48, floatPnl: -210,   positions: 1,  volumeToday: 3.5,   lastTrade: '15m ago', status: 'NORMAL' },
  { id: 6671, name: 'Thomas Brandt',   type: 'RETAIL', equity: 9800,   balance: 10500,  margin: 42, floatPnl: -310,   positions: 2,  volumeToday: 6.0,   lastTrade: '6m ago',  status: 'MARGIN_WARNING' },
  { id: 5577, name: 'Robert Kim',      type: 'PRO',    equity: 44100,  balance: 46000,  margin: 62, floatPnl: +890,   positions: 4,  volumeToday: 55.0,  lastTrade: '2m ago',  status: 'NORMAL' },
  { id: 7721, name: 'Yuki Nakamura',   type: 'RETAIL', equity: 14200,  balance: 15000,  margin: 58, floatPnl: +320,   positions: 2,  volumeToday: 11.0,  lastTrade: '9m ago',  status: 'NORMAL' },
  { id: 2812, name: 'Carlos Mendez',   type: 'PRO',    equity: 51000,  balance: 54000,  margin: 66, floatPnl: -640,   positions: 3,  volumeToday: 42.5,  lastTrade: '7m ago',  status: 'NORMAL' },
  { id: 4190, name: 'Sophie Laurent',  type: 'RETAIL', equity: 7200,   balance: 8000,   margin: 39, floatPnl: -580,   positions: 2,  volumeToday: 4.5,   lastTrade: '18m ago', status: 'MARGIN_WARNING' },
  { id: 9312, name: 'Ahmed Hassan',    type: 'PRO',    equity: 35800,  balance: 38000,  margin: 53, floatPnl: -420,   positions: 3,  volumeToday: 31.0,  lastTrade: '5m ago',  status: 'NORMAL' },
  { id: 3441, name: 'Lisa Johansson',  type: 'RETAIL', equity: 22000,  balance: 23500,  margin: 61, floatPnl: +720,   positions: 4,  volumeToday: 18.5,  lastTrade: '3m ago',  status: 'NORMAL' },
  { id: 8102, name: 'Pavel Novak',     type: 'PRO',    equity: 48200,  balance: 51000,  margin: 67, floatPnl: +1120,  positions: 5,  volumeToday: 62.0,  lastTrade: '4m ago',  status: 'NORMAL' },
  { id: 5291, name: 'Grace Okonkwo',   type: 'RETAIL', equity: 16800,  balance: 18000,  margin: 54, floatPnl: +280,   positions: 2,  volumeToday: 12.5,  lastTrade: '11m ago', status: 'NORMAL' },
  { id: 7033, name: 'Henrik Berg',     type: 'PRO',    equity: 73400,  balance: 76000,  margin: 73, floatPnl: +2180,  positions: 6,  volumeToday: 94.0,  lastTrade: '2m ago',  status: 'NORMAL' },
  { id: 1841, name: 'Priya Sharma',    type: 'RETAIL', equity: 11200,  balance: 12500,  margin: 46, floatPnl: -390,   positions: 2,  volumeToday: 7.5,   lastTrade: '14m ago', status: 'NORMAL' },
  { id: 6240, name: 'Lucas Dubois',    type: 'PRO',    equity: 29800,  balance: 32000,  margin: 51, floatPnl: -620,   positions: 3,  volumeToday: 28.0,  lastTrade: '6m ago',  status: 'NORMAL' },
  { id: 4882, name: 'Nina Patel',      type: 'RETAIL', equity: 6100,   balance: 7000,   margin: 33, floatPnl: -780,   positions: 2,  volumeToday: 4.0,   lastTrade: '20m ago', status: 'MARGIN_WARNING' },
  { id: 3109, name: 'Felix Wagner',    type: 'PRO',    equity: 42500,  balance: 45000,  margin: 64, floatPnl: +940,   positions: 4,  volumeToday: 48.5,  lastTrade: '3m ago',  status: 'NORMAL' },
  { id: 9874, name: 'Aisha Oduya',     type: 'RETAIL', equity: 19400,  balance: 20500,  margin: 57, floatPnl: +340,   positions: 3,  volumeToday: 16.0,  lastTrade: '8m ago',  status: 'NORMAL' },
  { id: 2650, name: 'Marco Ricci',     type: 'PRO',    equity: 58700,  balance: 61000,  margin: 70, floatPnl: +1560,  positions: 5,  volumeToday: 72.0,  lastTrade: '4m ago',  status: 'NORMAL' },
];

export const EXECUTIONS: Execution[] = [
  { id: 'EX-10247', time: '14:23:01.441', clientId: 4721, clientType: 'VIP',    symbol: 'EUR/USD', side: 'BUY',  lots: 3.0,  fillPrice: 1.08462, marketPrice: 1.08460, slippage: 0.2,  pnlImpact: +124,  latency: 12,   route: 'MANUAL',  lp: 'LP1', dealer: 'M.Chen' },
  { id: 'EX-10246', time: '14:22:58.112', clientId: 3312, clientType: 'PRO',    symbol: 'US500',   side: 'SELL', lots: 2.0,  fillPrice: 5241.8,  marketPrice: 5241.9,  slippage: -0.1, pnlImpact: -22,   latency: 8,    route: 'AUTO',    lp: 'LP2', dealer: 'AUTO' },
  { id: 'EX-10245', time: '14:22:55.330', clientId: 8823, clientType: 'PRO',    symbol: 'USD/JPY', side: 'BUY',  lots: 1.5,  fillPrice: 149.862, marketPrice: 149.858, slippage: 0.4,  pnlImpact: +89,   latency: 34,   route: 'STP',     lp: 'LP1', dealer: 'AUTO' },
  { id: 'EX-10244', time: '14:22:52.881', clientId: 5503, clientType: 'VIP',    symbol: 'EUR/USD', side: 'SELL', lots: 10.0, fillPrice: 1.08448, marketPrice: 1.08452, slippage: -0.4, pnlImpact: +482,  latency: 15,   route: 'MANUAL',  lp: 'LP1', dealer: 'M.Chen' },
  { id: 'EX-10243', time: '14:22:49.002', clientId: 7841, clientType: 'RETAIL', symbol: 'BTC/USD', side: 'BUY',  lots: 0.05, fillPrice: 67915.0, marketPrice: 67891.0, slippage: 2.4,  pnlImpact: -12,   latency: 28,   route: 'AUTO',    lp: 'LP2', dealer: 'AUTO' },
  { id: 'EX-10242', time: '14:22:46.771', clientId: 2241, clientType: 'PRO',    symbol: 'XAU/USD', side: 'BUY',  lots: 5.0,  fillPrice: 2319.25, marketPrice: 2319.15, slippage: 0.1,  pnlImpact: +312,  latency: 19,   route: 'MANUAL',  lp: 'LP1', dealer: 'M.Chen' },
  { id: 'EX-10241', time: '14:22:43.991', clientId: 6612, clientType: 'RETAIL', symbol: 'USD/JPY', side: 'SELL', lots: 0.3,  fillPrice: 149.840, marketPrice: 149.842, slippage: -0.2, pnlImpact: +18,   latency: 7,    route: 'AUTO',    lp: 'LP2', dealer: 'AUTO' },
  { id: 'EX-10240', time: '14:22:41.220', clientId: 9001, clientType: 'RETAIL', symbol: 'GBP/USD', side: 'BUY',  lots: 0.5,  fillPrice: 1.26828, marketPrice: 1.26821, slippage: 0.7,  pnlImpact: +44,   latency: 22,   route: 'STP',     lp: 'LP1', dealer: 'AUTO' },
  { id: 'EX-10239', time: '14:22:38.441', clientId: 4450, clientType: 'PRO',    symbol: 'EUR/USD', side: 'BUY',  lots: 4.0,  fillPrice: 1.08465, marketPrice: 1.08458, slippage: 0.7,  pnlImpact: -184,  latency: 340,  route: 'MANUAL',  lp: 'LP1', dealer: 'M.Chen' },
  { id: 'EX-10238', time: '14:22:35.112', clientId: 3891, clientType: 'PRO',    symbol: 'GBP/USD', side: 'SELL', lots: 1.0,  fillPrice: 1.26808, marketPrice: 1.26812, slippage: -0.4, pnlImpact: +62,   latency: 11,   route: 'AUTO',    lp: 'LP2', dealer: 'AUTO' },
  { id: 'EX-10237', time: '14:22:32.881', clientId: 7033, clientType: 'PRO',    symbol: 'EUR/USD', side: 'BUY',  lots: 8.0,  fillPrice: 1.08460, marketPrice: 1.08458, slippage: 0.2,  pnlImpact: +218,  latency: 9,    route: 'STP',     lp: 'LP1', dealer: 'AUTO' },
  { id: 'EX-10236', time: '14:22:29.002', clientId: 1192, clientType: 'RETAIL', symbol: 'XAU/USD', side: 'SELL', lots: 0.2,  fillPrice: 2318.20, marketPrice: 2318.45, slippage: -2.5, pnlImpact: -28,   latency: 44,   route: 'AUTO',    lp: 'LP2', dealer: 'AUTO' },
  { id: 'EX-10235', time: '14:22:26.771', clientId: 2298, clientType: 'VIP',    symbol: 'GBP/USD', side: 'BUY',  lots: 8.0,  fillPrice: 1.26830, marketPrice: 1.26821, slippage: 0.9,  pnlImpact: +542,  latency: 16,   route: 'MANUAL',  lp: 'LP1', dealer: 'M.Chen' },
  { id: 'EX-10234', time: '14:22:23.441', clientId: 6671, clientType: 'RETAIL', symbol: 'BTC/USD', side: 'SELL', lots: 0.1,  fillPrice: 67832.0, marketPrice: 67841.0, slippage: -0.9, pnlImpact: +38,   latency: 31,   route: 'AUTO',    lp: 'LP2', dealer: 'AUTO' },
  { id: 'EX-10233', time: '14:22:20.112', clientId: 5577, clientType: 'PRO',    symbol: 'EUR/USD', side: 'SELL', lots: 2.0,  fillPrice: 1.08450, marketPrice: 1.08452, slippage: -0.2, pnlImpact: +124,  latency: 13,   route: 'AUTO',    lp: 'LP1', dealer: 'AUTO' },
  { id: 'EX-10232', time: '14:22:17.881', clientId: 4190, clientType: 'RETAIL', symbol: 'EUR/USD', side: 'BUY',  lots: 0.5,  fillPrice: null,    marketPrice: 1.08458, slippage: null, pnlImpact: 0,     latency: null, route: 'TIMEOUT', lp: '-',  dealer: 'AUTO' },
  { id: 'EX-10231', time: '14:22:14.002', clientId: 4882, clientType: 'RETAIL', symbol: 'GBP/USD', side: 'BUY',  lots: 0.2,  fillPrice: null,    marketPrice: 1.26821, slippage: null, pnlImpact: 0,     latency: null, route: 'TIMEOUT', lp: '-',  dealer: 'AUTO' },
  { id: 'EX-10230', time: '14:22:11.220', clientId: 8102, clientType: 'PRO',    symbol: 'USD/JPY', side: 'SELL', lots: 3.0,  fillPrice: 149.839, marketPrice: 149.842, slippage: -0.3, pnlImpact: +89,   latency: 18,   route: 'STP',     lp: 'LP2', dealer: 'AUTO' },
  { id: 'EX-10229', time: '14:22:08.441', clientId: 9312, clientType: 'PRO',    symbol: 'XAU/USD', side: 'SELL', lots: 2.0,  fillPrice: 2317.90, marketPrice: 2318.45, slippage: -0.6, pnlImpact: +156,  latency: 25,   route: 'AUTO',    lp: 'LP1', dealer: 'AUTO' },
  { id: 'EX-10228', time: '14:22:05.112', clientId: 3441, clientType: 'RETAIL', symbol: 'EUR/USD', side: 'BUY',  lots: 1.0,  fillPrice: 1.08461, marketPrice: 1.08458, slippage: 0.3,  pnlImpact: +78,   latency: 21,   route: 'AUTO',    lp: 'LP2', dealer: 'AUTO' },
  { id: 'EX-10227', time: '14:22:02.881', clientId: 2650, clientType: 'PRO',    symbol: 'US500',   side: 'BUY',  lots: 3.0,  fillPrice: 5242.5,  marketPrice: 5242.3,  slippage: 0.2,  pnlImpact: +62,   latency: 14,   route: 'STP',     lp: 'LP1', dealer: 'AUTO' },
];

export const SURVEILLANCE_ALERTS: SurveillanceAlert[] = [
  { id: 'ALT-001', severity: 'HIGH',   type: 'LATENCY ARBITRAGE',    clientId: 4450, clientName: 'Chen Wei',       detail: 'Trading at prices 340ms old — fill at 1.08465 vs market 1.08458', time: '14:22:38', status: 'ACTIVE' },
  { id: 'ALT-002', severity: 'HIGH',   type: 'ACCOUNT COORDINATION', clientId: 7841, clientName: 'Anna Kowalski',  detail: '2 accounts (7841, 7842) same IP 185.22.41.0, identical trades within 800ms', time: '14:21:12', status: 'ACTIVE' },
  { id: 'ALT-003', severity: 'MEDIUM', type: 'NEWS TRADING',         clientId: 8823, clientName: 'Fatima Malik',   detail: '6 trades placed within 45s of FOMC minutes release — 84% profitable', time: '14:20:15', status: 'FLAGGED' },
  { id: 'ALT-004', severity: 'MEDIUM', type: 'VOLUME SPIKE',         clientId: 3891, clientName: 'Sarah Chen',     detail: 'Volume 7.2x 30-day average today (32.5 vs avg 4.5 lots)', time: '14:19:44', status: 'ACTIVE' },
  { id: 'ALT-005', severity: 'MEDIUM', type: 'VOLUME SPIKE',         clientId: 2241, clientName: 'Viktor Petrov',  detail: 'Single order $2.3M notional — 8.4x client typical max trade size', time: '14:18:33', status: 'ACTIVE' },
  { id: 'ALT-006', severity: 'MEDIUM', type: 'NEWS TRADING',         clientId: 5503, clientName: 'Omar Al-Rashid', detail: 'Placed 3 SELL EUR/USD orders 28s before CPI release (14:23:07)', time: '14:23:07', status: 'ACTIVE' },
  { id: 'ALT-007', severity: 'LOW',    type: 'SCALPING PATTERN',     clientId: 9001, clientName: 'Elena Vasquez',  detail: '8 round-trips EUR/USD in 4 minutes, avg hold time 22 seconds', time: '14:17:55', status: 'DISMISSED' },
  { id: 'ALT-008', severity: 'LOW',    type: 'SCALPING PATTERN',     clientId: 6671, clientName: 'Thomas Brandt',  detail: '5 rapid BTC/USD trades in 3 minutes, all under 30s hold time', time: '14:16:22', status: 'ACTIVE' },
];

export const LP_PROVIDERS: LpProvider[] = [
  { id: 'LP1', name: 'LMAX',     status: 'CONNECTED',    latency: 8,   uptime: 99.94, executions: 142 },
  { id: 'LP2', name: 'Integral', status: 'CONNECTED',    latency: 12,  uptime: 99.87, executions: 89 },
  { id: 'LP3', name: 'Currenex', status: 'DISCONNECTED', latency: null, uptime: 98.12, executions: 0 },
];

export const ECONOMIC_EVENTS: EconomicEvent[] = [
  { id: 'EVT-001', country: 'US', flag: '🇺🇸', name: 'CPI YoY',          time: '14:30', impact: 'HIGH',   previous: '3.2%', forecast: '3.1%', actual: null,   minutesAway: 7 },
  { id: 'EVT-002', country: 'UK', flag: '🇬🇧', name: 'Retail Sales MoM', time: '15:00', impact: 'MEDIUM', previous: '0.3%', forecast: '0.5%', actual: null,   minutesAway: 37 },
  { id: 'EVT-003', country: 'EU', flag: '🇪🇺', name: 'ECB Speech',       time: '16:00', impact: 'HIGH',   previous: null,   forecast: null,   actual: null,   minutesAway: 97 },
  { id: 'EVT-004', country: 'US', flag: '🇺🇸', name: 'PPI MoM',          time: '13:30', impact: 'MEDIUM', previous: '0.2%', forecast: '0.3%', actual: '0.4%', minutesAway: -53 },
  { id: 'EVT-005', country: 'US', flag: '🇺🇸', name: 'Jobless Claims',   time: '13:30', impact: 'MEDIUM', previous: '217K', forecast: '215K', actual: '219K', minutesAway: -53 },
];

export const NEWS_ITEMS: NewsItem[] = [
  { id: 1, source: 'Reuters',   headline: 'Fed officials signal caution over rate cuts as inflation data awaited',  time: '3m ago',  sentiment: 'neutral' },
  { id: 2, source: 'Bloomberg', headline: 'EUR/USD steady ahead of key US CPI print due in 7 minutes',            time: '5m ago',  sentiment: 'neutral' },
  { id: 3, source: 'FXStreet',  headline: 'Gold rallies on dollar weakness, testing $2320 resistance',            time: '8m ago',  sentiment: 'bull' },
  { id: 4, source: 'CNBC',      headline: 'Bitcoin faces selling pressure below $68,000 technical level',         time: '12m ago', sentiment: 'bear' },
  { id: 5, source: 'Reuters',   headline: 'Bank of England Governor signals rate cut possible in summer',         time: '18m ago', sentiment: 'bear' },
];

export const CHAT_MESSAGES: ChatMessage[] = [
  { id: 1, channel: 'dealing-desk', author: 'Marcus Chen',  avatar: 'MC', time: '14:20', text: 'EUR/USD getting tight ahead of CPI. Widening spread to 1.2 in 5 mins.' },
  { id: 2, channel: 'dealing-desk', author: 'Priya Desai',  avatar: 'PD', time: '14:21', text: 'Agreed. Also flagging Viktor Petrov — large order just came in, running manual review.' },
  { id: 3, channel: 'risk-alerts',  author: 'Risk Mgmt',    avatar: 'RM', time: '14:21', text: 'B-BOOK EUR/USD exposure approaching 80% limit. Route next 10+ lot orders to LP1.' },
  { id: 4, channel: 'dealing-desk', author: 'Marcus Chen',  avatar: 'MC', time: '14:22', text: '@Risk Mgmt Acknowledged. Running partial hedge now. -20 lots EUR/USD → LP1.' },
  { id: 5, channel: 'risk-alerts',  author: 'System',       avatar: 'SY', time: '14:22', text: 'MARGIN CALL: Client 7841 Anna Kowalski — margin level 22%. Auto-close threshold at 20%.' },
  { id: 6, channel: 'dealing-desk', author: 'James Walker', avatar: 'JW', time: '14:22', text: 'Taking over from Marcus at 16:30. Any positions I need to know about going into close?' },
  { id: 7, channel: 'dealing-desk', author: 'Marcus Chen',  avatar: 'MC', time: '14:23', text: 'EUR/USD book heavy long. XAU looking OK. Watch Chen Wei — near margin + latency flag.' },
  { id: 8, channel: 'compliance',   author: 'Compliance',   avatar: 'CO', time: '14:23', text: 'Case ALT-002 (Account Coordination 7841/7842) escalated to L2 review. Restrict pending.' },
];

export const WATCHLIST_CLIENT_IDS = [4721, 5503, 2298, 8823, 6612, 7841, 4450];

export const CHAT_CHANNELS = [
  { id: 'general',      label: 'general' },
  { id: 'dealing-desk', label: 'dealing-desk' },
  { id: 'risk-alerts',  label: 'risk-alerts' },
  { id: 'compliance',   label: 'compliance' },
  { id: 'breaks',       label: 'breaks' },
];

export const TEAM_MEMBERS = [
  { name: 'Marcus Chen',  role: 'Head Dealer',  status: 'online'  as const },
  { name: 'Priya Desai',  role: 'Risk',         status: 'online'  as const },
  { name: 'James Walker', role: 'Dealer',        status: 'away'    as const },
  { name: 'Risk Mgmt',    role: 'Risk',          status: 'online'  as const },
  { name: 'Compliance',   role: 'Compliance',    status: 'offline' as const },
];

export const DIRECT_CONTACTS = [
  { id: 'sarah.thompson', name: 'Sarah Thompson', role: 'Risk Mgmt',   status: 'online'  as const, unread: 1 },
  { id: 'compliance.hq',  name: 'Compliance HQ',  role: 'Compliance',  status: 'online'  as const, unread: 0 },
  { id: 'ops.support',    name: 'Ops Support',     role: 'Ops',         status: 'away'    as const, unread: 0 },
];

export const ACTIVE_RESTRICTIONS: { id: string; clientName: string; clientId: number; reason: string; since: string }[] = [
  { id: 'RST-001', clientName: 'Anna Kowalski', clientId: 7841, reason: 'Account Coordination',  since: '14:21' },
  { id: 'RST-002', clientName: 'Chen Wei',       clientId: 4450, reason: 'Latency Arbitrage',    since: '14:22' },
];
