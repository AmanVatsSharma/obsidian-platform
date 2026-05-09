/**
 * File:        apps/dealer-workstation/src/lib/types.ts
 * Module:      dealer-workstation · Data Types
 * Purpose:     All TypeScript interfaces for the dealer terminal (instruments, orders, clients, executions, etc.)
 *
 * Exports:
 *   - Instrument        — live price + routing config for a tradeable symbol
 *   - BookPosition      — dealer's net book per symbol
 *   - PendingOrder      — an order awaiting dealer decision
 *   - Client            — client account summary
 *   - Execution         — a completed fill record
 *   - SurveillanceAlert — AML / compliance alert
 *   - LpProvider        — liquidity provider connection status
 *   - EconomicEvent     — macro event on the economic calendar
 *   - NewsItem          — market news headline
 *   - ChatMessage       — internal dealing desk chat message
 *   - ProcessedOrder    — a recently accepted/rejected order for the recent strip
 *   - Toast             — UI notification toast
 *   - DeskState         — top-level context state shape
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';
export type ClientTier = 'VIP' | 'PRO' | 'RETAIL';
export type ClientStatus = 'NORMAL' | 'MARGIN_WARNING' | 'MARGIN_CALL' | 'SUSPENDED';
export type ExecRoute = 'AUTO' | 'MANUAL' | 'STP' | 'TIMEOUT';
export type AlertSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertStatus = 'ACTIVE' | 'FLAGGED' | 'DISMISSED';
export type LpStatus = 'CONNECTED' | 'DISCONNECTED';
export type EventImpact = 'HIGH' | 'MEDIUM' | 'LOW';
export type NewsSentiment = 'bull' | 'bear' | 'neutral';
export type ToastType = 'accept' | 'reject' | 'warn' | 'info';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface Instrument {
  symbol: string;
  pip: number;
  digits: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  change: number;   // % day change
  volume: number;
  avgVolume: number;
  routing: 'STP' | 'B';
  bookRouting: 'A' | 'B';
}

export interface BookPosition {
  symbol: string;
  longLots: number;
  shortLots: number;
  avgOpen: number;
  current: number;
  limit: number;
  hedged: number;
  lpExposure: number;
  clients: number;
  bBook: number;   // % in B-book
  aBook: number;   // % in A-book
}

export interface PendingOrder {
  id: string;
  clientId: number;
  clientName: string;
  tier: ClientTier;
  side: OrderSide;
  symbol: string;
  lots: number;
  type: OrderType;
  time: string;
  notional: number;
  age: number;       // seconds since received
  marketPrice: number;
  clientPrice: number;
  slippage: number;
}

export interface Client {
  id: number;
  name: string;
  type: ClientTier;
  equity: number;
  balance: number;
  margin: number;    // margin level %
  floatPnl: number;
  positions: number;
  volumeToday: number;
  lastTrade: string;
  status: ClientStatus;
}

export interface Execution {
  id: string;
  time: string;
  clientId: number;
  clientType: ClientTier;
  symbol: string;
  side: OrderSide;
  lots: number;
  fillPrice: number | null;
  marketPrice: number;
  slippage: number | null;
  pnlImpact: number;
  latency: number | null;
  route: ExecRoute;
  lp: string;
  dealer: string;
}

export interface SurveillanceAlert {
  id: string;
  severity: AlertSeverity;
  type: string;
  clientId: number;
  clientName: string;
  detail: string;
  time: string;
  status: AlertStatus;
}

export interface LpProvider {
  id: string;
  name: string;
  status: LpStatus;
  latency: number | null;
  uptime: number;
  executions: number;
}

export interface EconomicEvent {
  id: string;
  country: string;
  flag: string;
  name: string;
  time: string;
  impact: EventImpact;
  previous: string | null;
  forecast: string | null;
  actual: string | null;
  minutesAway: number;
}

export interface NewsItem {
  id: number;
  source: string;
  headline: string;
  time: string;
  sentiment: NewsSentiment;
}

export interface ChatMessage {
  id: number;
  channel: string;
  author: string;
  avatar: string;
  time: string;
  text: string;
}

export interface ProcessedOrder {
  id: string;
  clientName: string;
  symbol: string;
  side: OrderSide;
  lots: number;
  action: 'ACCEPT' | 'REJECT';
}

export interface Toast {
  id: string;
  type: ToastType;
  icon: string;
  title: string;
  msg: string;
  exiting?: boolean;
}

export interface DeskState {
  instruments: Instrument[];
  bookPositions: BookPosition[];
  pendingOrders: PendingOrder[];
  clients: Client[];
  executions: Execution[];
  surveillanceAlerts: SurveillanceAlert[];
  lpProviders: LpProvider[];
  economicEvents: EconomicEvent[];
  newsItems: NewsItem[];
  chatMessages: ChatMessage[];
  processedOrders: ProcessedOrder[];
  toasts: Toast[];
  autoAccept: boolean;
  spreadMultiplier: number;
  haltTrading: boolean;
  focusedOrderIdx: number;
  activeTab: string;
  orderAges: Record<string, number>;
  acceptOrder: (id: string) => void;
  rejectOrder: (id: string) => void;
  requoteOrder: (id: string, newPrice: number) => void;
  dismissAlert: (id: string) => void;
  flagAlert: (id: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  setAutoAccept: (v: boolean) => void;
  setSpreadMultiplier: (v: number) => void;
  setHaltTrading: (v: boolean) => void;
  setFocusedOrderIdx: (idx: number) => void;
  setActiveTab: (tab: string) => void;
  sendChatMessage: (channel: string, text: string) => void;
}
