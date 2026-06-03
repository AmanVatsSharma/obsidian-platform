/**
 * File:        apps/web/features/trading-terminal/index.ts
 * Module:      web · trading-terminal feature
 * Purpose:     Public surface for the web trading-terminal feature — re-exports the web
 *              platform wrapper and the GraphQL data access layer.
 *
 * Exports:
 *   - TradingWorkstation              — web-wrapped workstation (wires useAuth + Apollo hooks)
 *   - useInstruments                 — GraphQL hook: instrument catalogue
 *   - useAccountBalance              — GraphQL hook: account balance snapshot
 *   - useMarketAndAccount            — GraphQL hook: combined instruments + balance
 *   - InstrumentNode / BalanceNode   — shared type re-exports
 *
 * Depends on:
 *   - ./components/trading-workstation — web platform wrapper
 *   - ./lib/gql-service               — Apollo hooks data layer (legacy; new code should
 *                                        import the codegen-based hooks from @/gql/hooks,
 *                                        e.g. usePlaceOrder for order submission)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - All panel logic lives in @obsidian/trading-ui; this is purely web-platform glue
 *
 * Read order:
 *   1. This file — entry point
 *   2. ./components/trading-workstation — Apollo + onTradeSubmit wiring
 *   3. ./lib/gql-service — query/mutation definitions (deprecated for order placement)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

export { TradingWorkstation } from './components/trading-workstation';
export {
  useInstruments,
  useAccountBalance,
  useMarketAndAccount,
  type InstrumentNode,
  type BalanceNode,
} from './lib/gql-service';
