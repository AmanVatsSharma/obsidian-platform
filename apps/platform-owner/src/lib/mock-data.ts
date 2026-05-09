/**
 * File:        apps/platform-owner/src/lib/mock-data.ts
 * Module:      platform-owner · Mock Data
 * Purpose:     Static mock data for Platform Owner UI; shapes aligned with backend entities
 *
 * Exports:
 *   - MOCK_TENANTS                — 3 legacy broker tenants
 *   - MOCK_PROVISIONING           — provisioning records
 *   - MOCK_ENTITLEMENT_PLANS      — entitlement plan records
 *   - MOCK_BILLING_INVOICES       — billing invoice placeholders
 *   - MOCK_IMPERSONATION_AUDITS   — impersonation audit log
 *   - MOCK_BROKERS                — 14 rich broker records (from legacy ObsidianHub)
 *   - MOCK_INFRA_SERVICES         — platform service health status
 *   - MOCK_INFRA_NODES            — 6 server nodes with load/memory
 *   - MOCK_LIQUIDITY_PROVIDERS    — LP connectivity records
 *   - MOCK_REVENUE_SERIES         — 12-month MRR time series
 *   - MOCK_PLAN_REVENUE           — plan-by-plan revenue split
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import type {
  Tenant,
  TenantProvisioning,
  EntitlementPlan,
  BillingInvoicePlaceholder,
  SupportImpersonationAudit,
  Broker,
  InfraService,
  InfraNode,
  LiquidityProvider,
  RevenuePoint,
  PlanRevenueSplit,
} from './types';

export const MOCK_TENANTS: Tenant[] = [
  {
    id: 't-001',
    code: 'broker-alpha',
    displayName: 'Broker Alpha Ltd',
    timezone: 'UTC',
    jurisdictionProfile: 'GLOBAL',
    status: 'ACTIVE',
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
  },
  {
    id: 't-002',
    code: 'broker-beta',
    displayName: 'Broker Beta Securities',
    timezone: 'America/New_York',
    jurisdictionProfile: 'US',
    status: 'ACTIVE',
    createdAt: '2026-02-15T09:00:00.000Z',
    updatedAt: '2026-03-10T14:00:00.000Z',
  },
  {
    id: 't-003',
    code: 'broker-gamma',
    displayName: 'Gamma Trading Co',
    timezone: 'Asia/Kolkata',
    jurisdictionProfile: 'IN',
    status: 'PENDING',
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
  },
];

export const MOCK_PROVISIONING: TenantProvisioning[] = [
  {
    id: 'pr-001',
    tenantId: 't-003',
    requestedBy: 'platform-owner-user',
    status: 'PENDING',
    resources: { region: 'ap-south-1', tier: 'standard' },
    createdAt: '2026-03-01T08:00:00.000Z',
    updatedAt: '2026-03-01T08:00:00.000Z',
  },
];

export const MOCK_ENTITLEMENT_PLANS: EntitlementPlan[] = [
  {
    id: 'ep-001',
    tenantId: 't-001',
    planCode: 'professional',
    entitlements: { maxAccounts: 10, apiRateLimit: 1000 },
    featureFlags: { advancedCharts: true, algoTrading: true },
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-03-01T12:00:00.000Z',
  },
  {
    id: 'ep-002',
    tenantId: 't-002',
    planCode: 'enterprise',
    entitlements: { maxAccounts: 500, apiRateLimit: 50000 },
    featureFlags: { advancedCharts: true, algoTrading: true, whiteLabel: true },
    createdAt: '2026-02-15T09:00:00.000Z',
    updatedAt: '2026-03-10T14:00:00.000Z',
  },
];

export const MOCK_BILLING_INVOICES: BillingInvoicePlaceholder[] = [
  {
    id: 'inv-001',
    tenantId: 't-001',
    invoiceNumber: 'INV-2026-001',
    amount: '2500.00',
    currency: 'USD',
    status: 'PAID',
    createdAt: '2026-02-28T00:00:00.000Z',
    updatedAt: '2026-03-05T00:00:00.000Z',
  },
  {
    id: 'inv-002',
    tenantId: 't-002',
    invoiceNumber: 'INV-2026-002',
    amount: '15000.00',
    currency: 'USD',
    status: 'DRAFT',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
];

export const MOCK_IMPERSONATION_AUDITS: SupportImpersonationAudit[] = [
  {
    id: 'aud-001',
    tenantId: 't-001',
    actorUserId: 'support-agent-1',
    targetUserId: 'user-abc',
    reason: 'Customer KYC verification',
    action: 'STARTED',
    createdAt: '2026-03-10T11:30:00.000Z',
  },
  {
    id: 'aud-002',
    tenantId: 't-002',
    actorUserId: 'support-agent-2',
    targetUserId: 'user-xyz',
    reason: 'Order dispute investigation',
    action: 'ENDED',
    createdAt: '2026-03-12T09:15:00.000Z',
  },
];

/* ── Rich Broker Dataset (14 tenants from legacy ObsidianHub) ──────────────── */

export const MOCK_BROKERS: Broker[] = [
  { id: 1,  name: 'ArcaFX Markets',    plan: 'PRO',        country: 'UK',             flag: '🇬🇧', clients: 1247, aum: 8200000,  volumeMTD: 124000000, rev: 12400, growth: 8.2,   status: 'ACTIVE',    since: 'Jan 2023', am: 'Sarah K.',  contact: 'james@arcafx.com',       trades: 45230, api: 892000,  wsConn: 1247, healthScore: 88, allTimeRev: 142000, subFee: 2500, city: 'London' },
  { id: 2,  name: 'GlobalFX Pro',      plan: 'ENTERPRISE', country: 'UAE',            flag: '🇦🇪', clients: 3400, aum: 18500000, volumeMTD: 380000000, rev: 38000, growth: 15.4,  status: 'ACTIVE',    since: 'Jun 2022', am: 'Mike R.',   contact: 'ops@globalfxpro.ae',     trades: 89450, api: 2100000, wsConn: 3400, healthScore: 94, allTimeRev: 392000, subFee: 8000, city: 'Dubai' },
  { id: 3,  name: 'NovaTrade',         plan: 'GROWTH',     country: 'Australia',      flag: '🇦🇺', clients: 412,  aum: 2800000,  volumeMTD: 42000000,  rev: 4200,  growth: 22.1,  status: 'ACTIVE',    since: 'Aug 2023', am: 'Sarah K.',  contact: 'hello@novatrade.au',     trades: 18920, api: 320000,  wsConn: 412,  healthScore: 79, allTimeRev: 28400,  subFee: 1200, city: 'Sydney' },
  { id: 4,  name: 'PeakFX',            plan: 'STARTER',    country: 'Seychelles',     flag: '🇸🇨', clients: 89,   aum: 420000,   volumeMTD: 8500000,   rev: 850,   growth: -2.3,  status: 'TRIAL',     since: 'Feb 2024', am: 'Tom L.',    contact: 'admin@peakfx.sc',        trades: 3240,  api: 48000,   wsConn: 89,   healthScore: 51, allTimeRev: 4250,   subFee: 500,  city: 'Victoria' },
  { id: 5,  name: 'AlphaStream',       plan: 'PRO',        country: 'Cyprus',         flag: '🇨🇾', clients: 890,  aum: 5400000,  volumeMTD: 87000000,  rev: 8700,  growth: 11.3,  status: 'ACTIVE',    since: 'Mar 2023', am: 'Mike R.',   contact: 'ops@alphastream.cy',     trades: 32100, api: 650000,  wsConn: 890,  healthScore: 82, allTimeRev: 94600,  subFee: 2500, city: 'Limassol' },
  { id: 6,  name: 'BlueSky Traders',   plan: 'GROWTH',     country: 'South Africa',   flag: '🇿🇦', clients: 234,  aum: 980000,   volumeMTD: 18000000,  rev: 1800,  growth: 31.2,  status: 'ACTIVE',    since: 'Jan 2024', am: 'Tom L.',    contact: 'info@bluesky.co.za',     trades: 8900,  api: 180000,  wsConn: 234,  healthScore: 73, allTimeRev: 10800,  subFee: 1200, city: 'Cape Town' },
  { id: 7,  name: 'SkyFX Ltd',         plan: 'PRO',        country: 'Cayman Islands', flag: '🇰🇾', clients: 567,  aum: 3100000,  volumeMTD: 0,         rev: 0,     growth: -100,  status: 'SUSPENDED', since: 'Nov 2022', am: 'Sarah K.',  contact: 'compliance@skyfx.ky',    trades: 0,     api: 0,       wsConn: 0,    healthScore: 12, allTimeRev: 67400,  subFee: 2500, city: 'George Town' },
  { id: 8,  name: 'TradeNest',         plan: 'GROWTH',     country: 'Nigeria',        flag: '🇳🇬', clients: 318,  aum: 1200000,  volumeMTD: 21000000,  rev: 2100,  growth: 44.7,  status: 'ACTIVE',    since: 'Nov 2023', am: 'Tom L.',    contact: 'hello@tradenest.ng',     trades: 11200, api: 240000,  wsConn: 318,  healthScore: 70, allTimeRev: 12600,  subFee: 1200, city: 'Lagos' },
  { id: 9,  name: 'MarketPulse FX',    plan: 'PRO',        country: 'Singapore',      flag: '🇸🇬', clients: 723,  aum: 4800000,  volumeMTD: 72000000,  rev: 7200,  growth: 9.8,   status: 'ACTIVE',    since: 'Sep 2022', am: 'Mike R.',   contact: 'ops@marketpulse.sg',     trades: 28900, api: 580000,  wsConn: 723,  healthScore: 86, allTimeRev: 84000,  subFee: 2500, city: 'Singapore' },
  { id: 10, name: 'OmegaTrade',        plan: 'ENTERPRISE', country: 'UK',             flag: '🇬🇧', clients: 1890, aum: 9200000,  volumeMTD: 195000000, rev: 19500, growth: 6.2,   status: 'ACTIVE',    since: 'Dec 2021', am: 'Sarah K.',  contact: 'admin@omegatrade.co.uk', trades: 67800, api: 1400000, wsConn: 1890, healthScore: 91, allTimeRev: 274000, subFee: 8000, city: 'London' },
  { id: 11, name: 'SwiftFX Global',    plan: 'STARTER',    country: 'Mauritius',      flag: '🇲🇺', clients: 145,  aum: 580000,   volumeMTD: 12000000,  rev: 1200,  growth: 18.9,  status: 'ACTIVE',    since: 'Mar 2024', am: 'Tom L.',    contact: 'info@swiftfx.mu',        trades: 5400,  api: 96000,   wsConn: 145,  healthScore: 65, allTimeRev: 3600,   subFee: 500,  city: 'Port Louis' },
  { id: 12, name: 'CrestCapital FX',   plan: 'GROWTH',     country: 'Bahrain',        flag: '🇧🇭', clients: 289,  aum: 1600000,  volumeMTD: 24000000,  rev: 2400,  growth: 27.5,  status: 'ACTIVE',    since: 'Jun 2023', am: 'Mike R.',   contact: 'ops@crestcapital.bh',    trades: 9800,  api: 210000,  wsConn: 289,  healthScore: 76, allTimeRev: 19200,  subFee: 1200, city: 'Manama' },
  { id: 13, name: 'ZenithFX',          plan: 'PRO',        country: 'New Zealand',    flag: '🇳🇿', clients: 456,  aum: 2400000,  volumeMTD: 38000000,  rev: 3800,  growth: 13.4,  status: 'ACTIVE',    since: 'May 2023', am: 'Sarah K.',  contact: 'info@zenithfx.nz',       trades: 16700, api: 340000,  wsConn: 456,  healthScore: 83, allTimeRev: 41800,  subFee: 2500, city: 'Auckland' },
  { id: 14, name: 'PrimeAxis',         plan: 'GROWTH',     country: 'Canada',         flag: '🇨🇦', clients: 203,  aum: 890000,   volumeMTD: 15000000,  rev: 1500,  growth: 35.8,  status: 'ACTIVE',    since: 'Feb 2024', am: 'Tom L.',    contact: 'hello@primeaxis.ca',     trades: 7200,  api: 156000,  wsConn: 203,  healthScore: 68, allTimeRev: 7500,   subFee: 1200, city: 'Toronto' },
];

/* ── Infrastructure Health ─────────────────────────────────────────────────── */

export const MOCK_INFRA_SERVICES: InfraService[] = [
  { name: 'API Gateway',        status: 'OPERATIONAL', uptime: '99.98%', latency: '12ms', description: 'REST + WebSocket ingress' },
  { name: 'Database Primary',   status: 'OPERATIONAL', uptime: '99.99%', latency: '2ms',  description: 'PostgreSQL primary node' },
  { name: 'Database Replica',   status: 'OPERATIONAL', uptime: '99.97%', latency: '4ms',  description: 'Read replica (US-East)' },
  { name: 'Redis Cluster',      status: 'OPERATIONAL', uptime: '99.95%', latency: '1ms',  description: 'Session + rate limit cache' },
  { name: 'Kafka Broker',       status: 'WARNING',     uptime: '99.82%', latency: '18ms', description: 'Event streaming — lag detected on topic order-events' },
  { name: 'Matching Engine',    status: 'OPERATIONAL', uptime: '99.96%', latency: '3ms',  description: 'Order matching + execution' },
];

export const MOCK_INFRA_NODES: InfraNode[] = [
  { id: 'node-01', location: 'London (EU-W)',    load: 42, memory: 61, status: 'OPERATIONAL', tenants: 5 },
  { id: 'node-02', location: 'New York (US-E)',  load: 78, memory: 84, status: 'WARNING',     tenants: 4 },
  { id: 'node-03', location: 'Singapore (AP)',   load: 35, memory: 48, status: 'OPERATIONAL', tenants: 3 },
  { id: 'node-04', location: 'Dubai (ME)',       load: 29, memory: 42, status: 'OPERATIONAL', tenants: 2 },
  { id: 'node-05', location: 'Sydney (AP-AU)',   load: 55, memory: 67, status: 'OPERATIONAL', tenants: 2 },
  { id: 'node-06', location: 'Toronto (US-CA)',  load: 18, memory: 31, status: 'OPERATIONAL', tenants: 1 },
];

export const MOCK_LIQUIDITY_PROVIDERS: LiquidityProvider[] = [
  { id: 1, name: 'LMAX Digital', type: 'Prime Broker', status: 'CONNECTED',    latency: 8,  instruments: 847, uptime: '99.94%', creditLimit: 10000000, creditUsed: 2400000 },
  { id: 2, name: 'Integral',     type: 'ECN',          status: 'CONNECTED',    latency: 12, instruments: 612, uptime: '99.87%', creditLimit: 8000000,  creditUsed: 1800000 },
  { id: 3, name: 'Currenex',     type: 'Prime Broker', status: 'DISCONNECTED', latency: 0,  instruments: 524, uptime: '97.20%', creditLimit: 5000000,  creditUsed: 0 },
];

/* ── Revenue Time Series (12 months) ──────────────────────────────────────── */

export const MOCK_REVENUE_SERIES: RevenuePoint[] = [
  { month: 'May 25',  mrr: 48200,  newBusiness: 4200,  churn: 1800 },
  { month: 'Jun 25',  mrr: 51400,  newBusiness: 5800,  churn: 2600 },
  { month: 'Jul 25',  mrr: 53900,  newBusiness: 4900,  churn: 2400 },
  { month: 'Aug 25',  mrr: 57100,  newBusiness: 6200,  churn: 3000 },
  { month: 'Sep 25',  mrr: 60800,  newBusiness: 7400,  churn: 3700 },
  { month: 'Oct 25',  mrr: 65200,  newBusiness: 8100,  churn: 3700 },
  { month: 'Nov 25',  mrr: 69400,  newBusiness: 6900,  churn: 2700 },
  { month: 'Dec 25',  mrr: 74100,  newBusiness: 8200,  churn: 3500 },
  { month: 'Jan 26',  mrr: 78300,  newBusiness: 7800,  churn: 3600 },
  { month: 'Feb 26',  mrr: 82500,  newBusiness: 8400,  churn: 4200 },
  { month: 'Mar 26',  mrr: 87250,  newBusiness: 9100,  churn: 4350 },
  { month: 'Apr 26',  mrr: 93150,  newBusiness: 10400, churn: 4500 },
];

export const MOCK_PLAN_REVENUE: PlanRevenueSplit[] = [
  { plan: 'ENTERPRISE', amount: 32000, tenants: 2 },
  { plan: 'PRO',        amount: 37200, tenants: 6 },
  { plan: 'GROWTH',     amount: 12000, tenants: 5 },
  { plan: 'STARTER',    amount: 1950,  tenants: 2 },
];
