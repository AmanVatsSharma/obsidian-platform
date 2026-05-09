/**
 * File:        apps/web/features/trading-terminal/index.ts
 * Module:      web · trading-terminal feature
 * Purpose:     Public surface for the web trading-terminal feature — re-exports the web platform wrapper.
 *
 * Exports:
 *   - TradingWorkstation — web-wrapped workstation (wires useAuth → fetchJson, reads NEXT_PUBLIC_* env)
 *
 * Depends on:
 *   - ./components/trading-workstation — web platform wrapper
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - All panel logic lives in @obsidian/trading-ui; this wrapper is purely web-platform glue
 *
 * Read order:
 *   1. This file — entry point
 *   2. ./components/trading-workstation — see the web-specific wiring
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

export { TradingWorkstation } from './components/trading-workstation';
