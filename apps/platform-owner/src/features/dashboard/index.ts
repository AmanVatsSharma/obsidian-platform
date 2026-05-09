/**
 * File:        apps/platform-owner/src/features/dashboard/index.ts
 * Module:      platform-owner · Dashboard Feature
 * Purpose:     Public barrel export for dashboard feature components
 *
 * Exports:
 *   - DashboardKpiCards   — 4-card KPI grid
 *   - RevenueSparkline    — 12-month MRR area chart (client)
 *   - BrokerHealthTable   — Top 5 brokers table
 *   - SystemStatus        — 4 service status cards
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

export { DashboardKpiCards } from './kpi-cards';
export { RevenueSparkline } from './revenue-sparkline';
export { BrokerHealthTable } from './broker-health-table';
export { SystemStatus } from './system-status';
