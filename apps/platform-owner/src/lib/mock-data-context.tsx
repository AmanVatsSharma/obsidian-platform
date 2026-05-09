/**
 * File:        apps/platform-owner/src/lib/mock-data-context.tsx
 * Module:      platform-owner · Mock Data Context
 * Purpose:     React context for mock data state; allows read + create/upsert without backend
 *
 * Exports:
 *   - MockDataProvider(children) — context provider wrapping the app
 *   - useMockData()              — hook returning full mock data state + actions
 *
 * Side-effects:
 *   - In-memory React state only; resets on page reload
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  MOCK_BILLING_INVOICES,
  MOCK_BROKERS,
  MOCK_ENTITLEMENT_PLANS,
  MOCK_IMPERSONATION_AUDITS,
  MOCK_INFRA_NODES,
  MOCK_INFRA_SERVICES,
  MOCK_LIQUIDITY_PROVIDERS,
  MOCK_PLAN_REVENUE,
  MOCK_PROVISIONING,
  MOCK_REVENUE_SERIES,
  MOCK_TENANTS,
} from './mock-data';
import type {
  Broker,
  BillingInvoicePlaceholder,
  CreateBillingInput,
  CreateTenantInput,
  EntitlementPlan,
  InfraNode,
  InfraService,
  LiquidityProvider,
  PlanRevenueSplit,
  RevenuePoint,
  SupportImpersonationAudit,
  Tenant,
  UpsertEntitlementInput,
} from './types';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface MockDataState {
  tenants: Tenant[];
  provisioning: typeof MOCK_PROVISIONING;
  entitlementPlans: EntitlementPlan[];
  billingInvoices: BillingInvoicePlaceholder[];
  impersonationAudits: SupportImpersonationAudit[];
  brokers: Broker[];
  infraServices: InfraService[];
  infraNodes: InfraNode[];
  liquidityProviders: LiquidityProvider[];
  revenueSeries: RevenuePoint[];
  planRevenue: PlanRevenueSplit[];
}

interface MockDataActions {
  addTenant: (input: CreateTenantInput) => Tenant;
  upsertEntitlement: (input: UpsertEntitlementInput) => EntitlementPlan;
  addBillingInvoice: (input: CreateBillingInput) => BillingInvoicePlaceholder;
}

type MockDataContextValue = MockDataState & MockDataActions;

const MockDataContext = createContext<MockDataContextValue | null>(null);

export function MockDataProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [provisioning] = useState(MOCK_PROVISIONING);
  const [entitlementPlans, setEntitlementPlans] = useState<EntitlementPlan[]>(MOCK_ENTITLEMENT_PLANS);
  const [billingInvoices, setBillingInvoices] = useState<BillingInvoicePlaceholder[]>(MOCK_BILLING_INVOICES);
  const [impersonationAudits] = useState<SupportImpersonationAudit[]>(MOCK_IMPERSONATION_AUDITS);
  const [brokers] = useState<Broker[]>(MOCK_BROKERS);
  const [infraServices] = useState<InfraService[]>(MOCK_INFRA_SERVICES);
  const [infraNodes] = useState<InfraNode[]>(MOCK_INFRA_NODES);
  const [liquidityProviders] = useState<LiquidityProvider[]>(MOCK_LIQUIDITY_PROVIDERS);
  const [revenueSeries] = useState<RevenuePoint[]>(MOCK_REVENUE_SERIES);
  const [planRevenue] = useState<PlanRevenueSplit[]>(MOCK_PLAN_REVENUE);

  const addTenant = useCallback((input: CreateTenantInput): Tenant => {
    const now = new Date().toISOString();
    const newTenant: Tenant = {
      id: generateId('t'),
      code: input.code,
      displayName: input.displayName,
      timezone: input.timezone ?? 'UTC',
      jurisdictionProfile: input.jurisdictionProfile ?? 'GLOBAL',
      status: input.status ?? 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    setTenants((prev) => [...prev, newTenant]);
    return newTenant;
  }, []);

  const upsertEntitlement = useCallback((input: UpsertEntitlementInput): EntitlementPlan => {
    const now = new Date().toISOString();
    const newId = generateId('ep');
    setEntitlementPlans((prev) => {
      const idx = prev.findIndex(
        (e) => e.tenantId === input.tenantId && e.planCode === input.planCode
      );
      const planId = idx >= 0 ? prev[idx].id : newId;
      const plan: EntitlementPlan = {
        id: planId,
        tenantId: input.tenantId,
        planCode: input.planCode,
        entitlements: input.entitlements ?? {},
        featureFlags: input.featureFlags ?? {},
        createdAt: idx >= 0 ? prev[idx].createdAt : now,
        updatedAt: now,
      };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = plan;
        return next;
      }
      return [...prev, plan];
    });
    return {
      id: newId,
      tenantId: input.tenantId,
      planCode: input.planCode,
      entitlements: input.entitlements ?? {},
      featureFlags: input.featureFlags ?? {},
      createdAt: now,
      updatedAt: now,
    };
  }, []);

  const addBillingInvoice = useCallback((input: CreateBillingInput): BillingInvoicePlaceholder => {
    const now = new Date().toISOString();
    const newInvoice: BillingInvoicePlaceholder = {
      id: generateId('inv'),
      tenantId: input.tenantId,
      invoiceNumber: input.invoiceNumber,
      amount: input.amount,
      currency: input.currency,
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
    };
    setBillingInvoices((prev) => [...prev, newInvoice]);
    return newInvoice;
  }, []);

  const value = useMemo<MockDataContextValue>(
    () => ({
      tenants,
      provisioning,
      entitlementPlans,
      billingInvoices,
      impersonationAudits,
      brokers,
      infraServices,
      infraNodes,
      liquidityProviders,
      revenueSeries,
      planRevenue,
      addTenant,
      upsertEntitlement,
      addBillingInvoice,
    }),
    [
      tenants,
      provisioning,
      entitlementPlans,
      billingInvoices,
      impersonationAudits,
      brokers,
      infraServices,
      infraNodes,
      liquidityProviders,
      revenueSeries,
      planRevenue,
      addTenant,
      upsertEntitlement,
      addBillingInvoice,
    ]
  );

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
}

export function useMockData(): MockDataContextValue {
  const ctx = useContext(MockDataContext);
  if (!ctx) {
    throw new Error('useMockData must be used within MockDataProvider');
  }
  return ctx;
}
