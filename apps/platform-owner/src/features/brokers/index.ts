/**
 * File:        apps/platform-owner/src/features/brokers/index.ts
 * Module:      platform-owner · Brokers Feature
 * Purpose:     Public barrel export for brokers feature components
 *
 * Exports:
 *   - BrokersTable       — sortable 14-row broker table (client)
 *   - BrokerDetail       — tabbed detail view (client)
 *   - BrokerStatusBadge  — status pill
 *   - PlanBadge          — plan tier pill
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

export { BrokersTable } from './brokers-table';
export { BrokerDetail } from './broker-detail';
export { BrokerStatusBadge, PlanBadge } from './broker-status-badge';
