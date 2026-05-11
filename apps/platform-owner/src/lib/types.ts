/**
 * File:        apps/platform-owner/src/lib/types.ts
 * Module:      platform-owner · Data Types
 * Purpose:     Shared types aligned with backend entities and extended with UI-only models
 *
 * Exports:
 *   - TenantStatus, Tenant, TenantProvisioning, EntitlementPlan, etc. — legacy entity shapes
 *   - BrokerPlan, BrokerStatus, Broker                                — rich broker record for UI
 *   - ServiceStatus, InfraService, InfraNode, LiquidityProvider       — platform health types
 *   - RevenuePoint, PlanRevenueSplit                                   — revenue chart types
 *   - NavItem, NavGroup                                                — sidebar navigation types
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface Tenant {
  id: string;
  code: string;
  displayName: string;
  timezone: string;
  jurisdictionProfile: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TenantProvisioning {
  id: string;
  tenantId: string;
  requestedBy: string;
  status: string;
  resources: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EntitlementPlan {
  id: string;
  tenantId: string;
  planCode: string;
  entitlements: Record<string, unknown>;
  featureFlags: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface BillingInvoicePlaceholder {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportImpersonationAudit {
  id: string;
  tenantId: string;
  actorUserId: string;
  targetUserId: string;
  reason: string;
  action: string;
  createdAt: string;
}

/** DTO shape for creating a tenant (aligned with backend CreateTenantDto) */
export interface CreateTenantInput {
  code: string;
  displayName: string;
  timezone?: string;
  jurisdictionProfile?: string;
  status?: TenantStatus;
}

/** DTO shape for upserting entitlement (aligned with backend UpsertEntitlementPlanDto) */
export interface UpsertEntitlementInput {
  tenantId: string;
  planCode: string;
  entitlements: Record<string, unknown>;
  featureFlags: Record<string, boolean>;
}

/** DTO shape for creating billing placeholder (aligned with backend CreateBillingInvoicePlaceholderDto) */
export interface CreateBillingInput {
  tenantId: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
}

/* ── Rich Broker types ─────────────────────────────────────────────────────── */

export type BrokerPlan = 'STARTER' | 'GROWTH' | 'PRO' | 'ENTERPRISE';
export type BrokerStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'PENDING';

export interface Broker {
  id: string;
  name: string;
  plan: BrokerPlan;
  country: string;
  flag: string;
  clients: number;
  aum: number;
  volumeMTD: number;
  rev: number;
  growth: number;
  status: BrokerStatus;
  since: string;
  am: string;
  contact: string;
  trades: number;
  api: number;
  wsConn: number;
  healthScore: number;
  allTimeRev: number;
  subFee: number;
  city: string;
}

/* ── Infrastructure types ──────────────────────────────────────────────────── */

export type ServiceStatus = 'OPERATIONAL' | 'WARNING' | 'DEGRADED' | 'DOWN';

export interface InfraService {
  name: string;
  status: ServiceStatus;
  uptime: string;
  latency: string;
  description: string;
}

export interface InfraNode {
  id: string;
  location: string;
  load: number;
  memory: number;
  status: ServiceStatus;
  tenants: number;
}

export interface LiquidityProvider {
  id: number;
  name: string;
  type: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED';
  latency: number;
  instruments: number;
  uptime: string;
  creditLimit: number;
  creditUsed: number;
}

/* ── Revenue types ─────────────────────────────────────────────────────────── */

export interface RevenuePoint {
  month: string;
  mrr: number;
  newBusiness: number;
  churn: number;
}

export interface PlanRevenueSplit {
  plan: BrokerPlan;
  amount: number;
  tenants: number;
}

/* ── Navigation types ──────────────────────────────────────────────────────── */

export interface NavItem {
  id: string;
  label: string;
  href: string;
  badge?: string;
  badgeWarn?: boolean;
}

export interface NavGroup {
  section: string;
  items: NavItem[];
}
