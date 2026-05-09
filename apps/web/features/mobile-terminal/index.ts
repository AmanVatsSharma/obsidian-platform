/**
 * File:        apps/web/features/mobile-terminal/index.ts
 * Module:      Mobile Terminal · Barrel Export
 * Purpose:     Public API for the mobile-terminal feature — re-exports the root dashboard component.
 *
 * Exports:
 *   - MobileTradingDashboard — root mobile app component (8 screens, bottom nav, live prices)
 *
 * Depends on:
 *   - ./components/mobile-trading-dashboard — full implementation
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Only MobileTradingDashboard is public; all sub-screens are internal
 *
 * Read order:
 *   1. This file — entry point
 *   2. ./components/mobile-trading-dashboard.tsx — full implementation
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

export { MobileTradingDashboard } from './components/mobile-trading-dashboard';
