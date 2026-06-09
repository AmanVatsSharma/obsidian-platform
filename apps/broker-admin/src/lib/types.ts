/**
 * File:        apps/broker-admin/src/lib/types.ts
 * Module:      broker-admin · Domain Types
 * Purpose:     All entity TypeScript types for the Broker Admin app — used by mock data, context, and every module component
 *
 * Exports:
 *   - Client, KYCDocument, Note
 *   - IntroducingBroker, ClientGroup
 *   - Instrument, PricingRule, TradingSession, Order
 *   - RiskMetric, ExposureLimit, SurveillanceAlert, AMLCase
 *   - Transaction, IBCommission, Bonus, PnLEntry
 *   - ReportDefinition, ScheduledReport
 *   - TeamMember, Role, Permission, AuditLogEntry
 *   - Notification, BrokerConfig, SystemStatus
 *   - NavGroup, NavItem (sidebar navigation)
 *   - RevenuePoint, ActivityEvent (dashboard charts)
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

// ─── NAVIGATION ────────────────────────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  href: string;
  badge?: string;
  badgeWarn?: boolean;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export interface NavGroup {
  section: string;
  items: NavItem[];
}

// ─── BROKER CONFIG ─────────────────────────────────────────────────────────────

export interface BrokerConfig {
  name: string;
  legalName: string;
  jurisdiction: string;
  licenseNumber: string;
  currency: string;
  aum: number;
  totalClients: number;
  version: string;
  systemStatus: 'operational' | 'degraded' | 'down';
  adminUser: {
    name: string;
    role: string;
    lastLogin: string;
    avatar?: string;
  };
}

// ─── SYSTEM STATUS ─────────────────────────────────────────────────────────────

export interface SystemStatus {
  service: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  uptime?: number;
}

// ─── NOTIFICATION ──────────────────────────────────────────────────────────────

export type NotificationType = 'critical' | 'warning' | 'info' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  moduleId?: string;
}

// ─── NOTE ──────────────────────────────────────────────────────────────────────

export interface Note {
  author: string;
  time: string;
  text: string;
}

// ─── KYC DOCUMENT ─────────────────────────────────────────────────────────────

export type KYCLevel = 'Basic' | 'Standard' | 'Enhanced';
export type KYCStatus = 'Pending' | 'In Review' | 'Verified' | 'Rejected' | 'Expired';

export interface KYCDocument {
  id: string;
  clientId: string;
  clientName?: string;
  flag?: string;
  country?: string;
  clientType?: string;
  type: 'Passport' | 'ID Card' | 'Utility Bill' | 'Bank Statement' | 'Selfie';
  status: KYCStatus;
  level: KYCLevel;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  expiryDate?: string;
  notes?: string;
}

// ─── CLIENT ────────────────────────────────────────────────────────────────────

export type ClientType = 'Retail' | 'Pro' | 'VIP' | 'Institutional';
export type ClientStatus = 'Active' | 'Pending' | 'Suspended' | 'Dormant' | 'Closed';
export type RiskProfile = 'Conservative' | 'Moderate' | 'Aggressive';
export type Suitability = 'APPROPRIATE' | 'PENDING' | 'NOT_APPROPRIATE';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  flag: string;
  dob: string;
  nationality: string;
  address: string;
  type: ClientType;
  group: string;
  status: ClientStatus;
  kyc: KYCStatus;
  kycLevel: KYCLevel;
  kycExpiry: string | null;
  balance: number;
  equity: number;
  margin: number;
  marginPct: number | null;
  floatPnl: number;
  openPositions: number;
  totalDeposited: number;
  totalWithdrawn: number;
  bonusBalance: number;
  credit: number;
  leverage: string;
  accountCurrency: string;
  regDate: string;
  lastLogin: string;
  volumeMTD: number;
  platform: string[];
  suitability: Suitability;
  riskProfile: RiskProfile;
  ib: string | null;
  tags: string[];
  amlScore: number;
  amlStatus: 'Clear' | 'Review' | 'Flagged';
  notes: Note[];
}

// ─── INTRODUCING BROKER ────────────────────────────────────────────────────────

export interface IntroducingBroker {
  id: string;
  name: string;
  email: string;
  country: string;
  flag: string;
  status: 'Active' | 'Pending' | 'Suspended';
  clientCount: number;
  volumeMTD: number;
  commissionMTD: number;
  commissionTotal: number;
  commissionRate: number;
  tier: 'Standard' | 'Silver' | 'Gold' | 'Platinum';
  regDate: string;
  lastPayout: string;
  pendingPayout: number;
}

// ─── CLIENT GROUP ──────────────────────────────────────────────────────────────

export interface ClientGroup {
  id: string;
  name: string;
  description: string;
  clientCount: number;
  leverage: string;
  commissionType: 'Spread' | 'Per Lot' | 'Mixed';
  swapFree: boolean;
  bonusEligible: boolean;
  color: string;
}

// ─── INSTRUMENT ────────────────────────────────────────────────────────────────

export type AssetClass = 'Forex' | 'Indices' | 'Commodities' | 'Crypto' | 'Stocks' | 'ETF';

// New enterprise instrument types - supports multi-exchange, multi-segment, multi-provider
export type InstrumentStatus = 'Active' | 'Disabled' | 'Halted' | 'Archived';
export type InstrumentSegment = 'EQ' | 'FNO' | 'COM' | 'CDS' | 'FX' | 'CRYPTO' | 'INDEX';
export type InstrumentType = 'EQUITY' | 'FUTURE' | 'OPTION' | 'ETF' | 'FOREX' | 'CRYPTO' | 'INDEX';

export interface Instrument {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  // Extended fields for enterprise multi-exchange support
  exchange?: string;        // NSE, BSE, MCX, NASDAQ
  segment?: InstrumentSegment; // EQ, FNO, COM, CDS, FX, CRYPTO, INDEX
  type?: InstrumentType;
  status: InstrumentStatus;
  isTradingEnabled?: boolean;
  // Provider linkage
  providerCode?: string;    // KITE, ALPACA, BINANCE
  providerSymbol?: string;  // Provider's native symbol
  // Trading params
  spread: number;
  spreadType: 'Fixed' | 'Variable';
  spreadOverride?: number;
  minLot: number;
  maxLot: number;
  lotStep: number;
  lotOverride?: number;
  leverage: string;
  leverageOverride?: string;
  maxPositionOverride?: number;
  // Derivatives (F&O)
  baseSymbol?: string;
  expiry?: string;
  strike?: number;
  optionType?: 'CE' | 'PE';
  expiryLabel?: string;
  // Meta
  tickSize?: string;
  contractSize?: string;
  // Stats
  openPositions: number;
  volumeToday: number;
  // Swaps (forex)
  swapLong: number;
  swapShort: number;
  digits: number;
}

// ─── EXCHANGE ────────────────────────────────────────────────────────────────
export type ExchangeStatus = 'Active' | 'Maintenance' | 'Suspended';
export type ExchangeSegment = 'EQUITY' | 'FNO' | 'COM' | 'CDS' | 'ALL';

export interface Exchange {
  id: string;
  code: string;           // NSE, BSE, MCX
  name: string;
  country?: string;
  timezone?: string;
  segment: ExchangeSegment;
  status: ExchangeStatus;
  dataProviderCode?: string;   // KITE, ALPACA
  executionProviderCode?: string;
  regularOpen?: string;
  regularClose?: string;
  currency?: string;
  isDefault?: boolean;
}

// ─── DATA PROVIDER ────────────────────────────────────────────────────────────────
export type ProviderStatus = 'Connected' | 'Disconnected' | 'Error';

export interface DataProvider {
  id: string;
  code: string;           // KITE, ALPACA, BINANCE
  name: string;
  providerType: 'data' | 'execution' | 'both';
  exchanges: string[];     // Mapped exchanges
  status: ProviderStatus;
  lastHealthCheck?: string;
  latency?: number;
  instrumentCount?: number;
  errorMessage?: string;
}

// ─── PRICING RULE ─────────────────────────────────────────────────────────────

export interface PricingRule {
  id: string;
  name: string;
  instruments: string[];
  clientGroups: string[];
  markupBid: number;
  markupAsk: number;
  commissionPerLot: number;
  status: 'Active' | 'Inactive';
  priority: number;
}

// ─── TRADING SESSION ──────────────────────────────────────────────────────────

export interface TradingSession {
  id: string;
  name: string;
  instruments: string[];
  openTime: string;
  closeTime: string;
  timezone: string;
  days: string[];
  status: 'Open' | 'Closed' | 'Break' | 'Holiday';
  preMarket?: boolean;
  afterHours?: boolean;
}

// ─── ORDER ────────────────────────────────────────────────────────────────────

export type OrderType = 'Market' | 'Limit' | 'Stop' | 'Stop Limit' | 'BRACKET' | 'GTT' | 'TRAILING_STOP' | 'TWAP' | 'VWAP' | 'ICEBERG';
export type OrderSide = 'Buy' | 'Sell';
export type OrderStatus = 'Open' | 'Pending' | 'Filled' | 'Cancelled' | 'Rejected' | 'Expired' | 'PARTIALLY_FILLED';
export type OrderRole = 'PRIMARY' | 'TAKE_PROFIT' | 'STOP_LOSS';

/** Slice metadata for algo orders (TWAP, VWAP, ICEBERG) */
export interface AlgoMeta {
  totalSlices: number;
  completedSlices: number;
  sliceIntervalSec?: number;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  symbol: string;
  type: OrderType;
  /** Role within a bracket group: PRIMARY | TAKE_PROFIT | STOP_LOSS | undefined */
  orderRole?: OrderRole;
  /** Parent order ID for bracket children */
  parentOrderId?: string;
  side: OrderSide;
  status: OrderStatus;
  lots: number;
  openPrice: number;
  currentPrice?: number;
  closePrice?: number;
  sl?: number;
  tp?: number;
  commission: number;
  swap: number;
  floatPnl?: number;
  realizedPnl?: number;
  openTime: string;
  closeTime?: string;
  comment?: string;
  /** External reference for special order types (e.g. liq:...) */
  externalRefId?: string;
  /** Algo metadata for TWAP/VWAP/ICEBERG orders */
  algoMeta?: AlgoMeta;
}

// ─── RISK ─────────────────────────────────────────────────────────────────────

export interface RiskMetric {
  symbol: string;
  netExposure: number;
  grossExposure: number;
  longExposure: number;
  shortExposure: number;
  clientCount: number;
  maxDrawdown: number;
  hedgeRatio: number;
  bookType: 'A-Book' | 'B-Book' | 'Hybrid';
}

export interface ExposureLimit {
  id: string;
  symbol: string;
  maxNetExposure: number;
  currentNetExposure: number;
  utilizationPct: number;
  alertThreshold: number;
  hardLimit: number;
  status: 'Normal' | 'Warning' | 'Breach';
}

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type AlertPattern =
  | 'Layering'
  | 'Spoofing'
  | 'Wash Trading'
  | 'Front Running'
  | 'Churning'
  | 'Price Manipulation'
  | 'Account Takeover';

export interface SurveillanceAlert {
  id: string;
  clientId: string;
  clientName: string;
  pattern: AlertPattern;
  severity: AlertSeverity;
  status: 'Open' | 'Under Review' | 'Resolved' | 'Escalated';
  description: string;
  detectedAt: string;
  trades: string[];
  assignedTo?: string;
  resolution?: string;
}

export interface AMLCase {
  id: string;
  clientId: string;
  clientName: string;
  score: number;
  triggers: string[];
  status: 'Clear' | 'Review' | 'Suspicious' | 'Reported';
  lastChecked: string;
  flaggedTransactions: string[];
  notes: Note[];
}

// ─── FINANCE ──────────────────────────────────────────────────────────────────

export type TransactionType = 'Deposit' | 'Withdrawal' | 'Transfer' | 'Adjustment' | 'Bonus' | 'Commission';
export type TransactionStatus = 'Pending' | 'Processing' | 'Completed' | 'Rejected' | 'Cancelled' | 'On Hold';

export interface Transaction {
  id: string;
  clientId: string;
  clientName: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  method: string;
  reference: string;
  createdAt: string;
  processedAt?: string;
  notes?: string;
  flagged?: boolean;
}

export interface IBCommission {
  id: string;
  ibId: string;
  ibName: string;
  period: string;
  clientCount: number;
  volume: number;
  commissionEarned: number;
  status: 'Pending' | 'Approved' | 'Paid' | 'On Hold';
  payoutDate?: string;
  method: string;
}

export interface Bonus {
  id: string;
  name: string;
  type: 'Welcome' | 'Deposit' | 'No Deposit' | 'Loyalty' | 'Referral' | 'Cashback' | 'Contest';
  status: 'Active' | 'Inactive' | 'Expired' | 'Scheduled';
  amount: number;
  amountType: 'Fixed' | 'Percentage';
  minDeposit?: number;
  maxBonus?: number;
  turnoverMultiple: number;
  claimedCount: number;
  totalAwarded: number;
  startDate: string;
  endDate?: string;
  eligibleGroups: string[];
}

export interface PnLEntry {
  date: string;
  spread: number;
  commission: number;
  swap: number;
  bonusCost: number;
  ibCost: number;
  netRevenue: number;
  totalClients: number;
  newClients: number;
  deposits: number;
  withdrawals: number;
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  type: 'Client' | 'Trading' | 'Risk' | 'Finance' | 'Compliance' | 'Custom';
  columns: string[];
  filters: Record<string, unknown>;
  lastRun?: string;
  createdBy: string;
  format: 'CSV' | 'Excel' | 'PDF';
}

export interface ScheduledReport {
  id: string;
  reportId: string;
  reportName: string;
  schedule: 'Daily' | 'Weekly' | 'Monthly';
  nextRun: string;
  lastRun?: string;
  recipients: string[];
  status: 'Active' | 'Paused';
}

// ─── TEAM ─────────────────────────────────────────────────────────────────────

export interface Permission {
  module: string;
  actions: ('read' | 'write' | 'delete' | 'approve')[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  memberCount: number;
  isSystem: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Locked';
  lastLogin: string;
  createdAt: string;
  twoFAEnabled: boolean;
  ipRestricted: boolean;
  allowedIPs?: string[];
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  module: string;
  target?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip: string;
  timestamp: string;
  severity: 'Info' | 'Warning' | 'Critical';
}

// ─── CHARTS / DASHBOARD ────────────────────────────────────────────────────────

export interface RevenuePoint {
  label: string;
  spread: number;
  commission: number;
  swap: number;
  bonusCost: number;
  total: number;
}

export interface ActivityEvent {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'kyc' | 'alert' | 'login' | 'registration';
  message: string;
  clientName?: string;
  amount?: number;
  symbol?: string;
  time: string;
}

export interface HeatmapCell {
  hour: number;
  day: string;
  value: number;
}

// ─── RISK THRESHOLDS ──────────────────────────────────────────────────────────

export type RiskThresholdMetric = 'MARGIN_LEVEL' | 'EXPOSURE' | 'OPEN_ORDERS' | 'DELTA' | 'GAMMA' | 'POSITION_LIMIT';
export type RiskOperator = 'GT' | 'GTE' | 'LT' | 'LTE' | 'EQ';
export type RiskAction = 'ALERT' | 'FREEZE_ACCOUNT' | 'LIQUIDATE_ALL' | 'LIQUIDATE_BIGGEST' | 'CIRCUIT_BREAKER';

export interface RiskThreshold {
  id: string;
  tenantId: string;
  accountId?: string;
  metric: RiskThresholdMetric;
  operator: RiskOperator;
  thresholdValue: number;
  action: RiskAction;
  enabled: boolean;
  meta?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExposureSnapshot {
  brokerId: string;
  marginLevel: number;
  usedMargin: number;
  equity: number;
  exposurePerInstrument: {
    instrumentId: string;
    symbol: string;
    netExposure: number;
    maxExposure: number;
    utilizationPct: number;
  }[];
  openPositions: number;
  lastLiquidationEvent?: string;
}
