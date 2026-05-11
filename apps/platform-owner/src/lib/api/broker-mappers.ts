/**
 * File:        apps/platform-owner/src/lib/api/broker-mappers.ts
 * Module:      platform-owner · API Broker Mappers
 * Purpose:     Converts backend ApiBroker shape to UI Broker type.
 *              Shared across broker list and detail pages.
 *
 * Exports:
 *   - computeGrowth(metrics) → number
 *   - apiBrokerToUi(broker) → Broker
 *
 * Depends on:
 *   - ./endpoints — ApiBroker, ApiBrokerMetrics types
 *   - ../types   — Broker type
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - Fields not in API response (plan, country, flag, am, etc.) use defaults.
 *     These should be populated from a future /saas/brokers/:code/profile endpoint.
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-11
 */

import type { ApiBroker, ApiBrokerMetrics } from './endpoints';
import type { Broker } from '../types';

export function computeGrowth(metrics: ApiBrokerMetrics | undefined): number {
  if (!metrics) return 0;
  const curr = Number(metrics.monthlyRevenue);
  const prev = Number(metrics.monthlyRevenuePrev);
  if (!prev || !curr) return 0;
  return ((curr - prev) / prev) * 100;
}

export function apiBrokerToUi(b: ApiBroker): Broker {
  const m = b.metrics;
  return {
    id: b.id,
    name: b.displayName,
    plan: 'PRO', // TODO: from /brokers/:code/profile endpoint
    country: 'IN', // TODO: from /brokers/:code/profile endpoint
    flag: '🇮🇳', // TODO: from /brokers/:code/profile endpoint
    clients: m?.clients ?? 0,
    aum: m ? Number(m.aum) : 0,
    volumeMTD: 0, // TODO: from /brokers/:code/metrics
    rev: m ? Number(m.monthlyRevenue) : 0,
    growth: computeGrowth(m),
    status: (b.status === 'ACTIVE' ? 'ACTIVE' : b.status === 'SUSPENDED' ? 'SUSPENDED' : 'TRIAL') as Broker['status'],
    since: b.createdAt,
    am: '—', // TODO: from /brokers/:code/profile endpoint
    contact: '—', // TODO: from /brokers/:code/profile endpoint
    trades: 0, // TODO: from /brokers/:code/metrics
    api: 0, // TODO: from /brokers/:code/metrics
    wsConn: 0, // TODO: from /brokers/:code/metrics
    healthScore: m?.healthScore ?? 0,
    allTimeRev: 0, // TODO: aggregate from metrics
    subFee: 0, // TODO: from /brokers/:code/billing endpoint
    city: '—', // TODO: from /brokers/:code/profile endpoint
  };
}