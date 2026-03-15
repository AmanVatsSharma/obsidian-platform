/**
 * @file mock-data-context.tsx
 * @module platform-owner
 * @description React context for mock data state; allows list + create/upsert without backend
 * @author BharatERP
 * @created 2026-03-15
 */

'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  MOCK_BILLING_INVOICES,
  MOCK_ENTITLEMENT_PLANS,
  MOCK_IMPERSONATION_AUDITS,
  MOCK_PROVISIONING,
  MOCK_TENANTS,
} from './mock-data';
import type {
  BillingInvoicePlaceholder,
  CreateBillingInput,
  CreateTenantInput,
  EntitlementPlan,
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
