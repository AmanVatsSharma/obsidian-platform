/**
 * File:        apps/web/features/mobile-terminal/index.ts
 * Module:      Mobile Terminal · Barrel Export
 * Purpose:     Public API for the mobile-terminal feature — re-exports the data adapter and dashboard.
 *
 * Exports:
 *   - MobileWorkstation — data adapter (Apollo hooks + auth fallback → dashboard)
 *   - MobileTradingDashboard — presentational dashboard (ui state + sheets only)
 *
 * Depends on:
 *   - ./components/mobile-workstation — adapter layer
 *   - ./components/mobile-trading-dashboard — presentational UI
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - MobileWorkstation is the public entry; it wires GraphQL hooks and auth
 *   - MobileTradingDashboard is internal (used by the adapter); accepts data prop
 *
 * Read order:
 *   1. This file — entry point
 *   2. ./components/mobile-workstation.tsx — data adapter
 *   3. ./components/mobile-trading-dashboard.tsx — presentational UI
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-07
 */

export { MobileWorkstation } from './components/mobile-workstation';
export { MobileTradingDashboard } from './components/mobile-trading-dashboard';
