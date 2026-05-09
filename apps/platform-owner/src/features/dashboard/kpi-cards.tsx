/**
 * File:        apps/platform-owner/src/features/dashboard/kpi-cards.tsx
 * Module:      platform-owner · Dashboard Feature
 * Purpose:     4-card KPI grid: total brokers, active clients, total AUM, monthly revenue
 *
 * Exports:
 *   - DashboardKpiCards(props) — server-compatible presentational grid
 *
 * Depends on:
 *   - ../../shared/components/stat-card — StatCard
 *   - lucide-react                       — icons per card
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { Building2, Users, TrendingUp, DollarSign } from 'lucide-react';
import { StatCard } from '../../shared/components/stat-card';
import type { Broker } from '../../lib/types';

interface DashboardKpiCardsProps {
  brokers: Broker[];
  mrr: number;
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function DashboardKpiCards({ brokers, mrr }: DashboardKpiCardsProps) {
  const activeBrokers = brokers.filter((b) => b.status === 'ACTIVE');
  const totalClients = brokers.reduce((s, b) => s + b.clients, 0);
  const totalAum = brokers.reduce((s, b) => s + b.aum, 0);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label="Total Brokers"
        value={String(brokers.length)}
        delta={`${activeBrokers.length} active`}
        deltaPositive={true}
        subtext="vs last month"
        icon={<Building2 size={15} strokeWidth={2} />}
      />
      <StatCard
        label="Active Clients"
        value={totalClients.toLocaleString()}
        delta="+12.4%"
        deltaPositive={true}
        subtext="30-day growth"
        icon={<Users size={15} strokeWidth={2} />}
      />
      <StatCard
        label="Total AUM"
        value={fmtUsd(totalAum)}
        delta="+8.7%"
        deltaPositive={true}
        subtext="assets under mgmt"
        icon={<TrendingUp size={15} strokeWidth={2} />}
      />
      <StatCard
        label="MRR"
        value={fmtUsd(mrr)}
        delta="+6.8%"
        deltaPositive={true}
        subtext="vs prior month"
        icon={<DollarSign size={15} strokeWidth={2} />}
      />
    </div>
  );
}
