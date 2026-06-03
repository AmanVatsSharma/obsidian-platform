/**
 * File:        apps/web/shared/apollo/__fixtures__/account-balance.ts
 * Module:      web · Shared · Apollo · Fixtures
 * Purpose:     Deterministic mock `AccountBalancePayload` fixture for the
 *              `GetAccountBalance` GraphQL operation. The trader terminal
 *              renders this on the account summary panel.
 *
 * Exports:
 *   - mockAccountBalance: AccountBalancePayload   — USD base, with realized and
 *                                                    unrealized P&L
 *
 * Depends on:
 *   - @/gql/generated/graphql — AccountBalancePayload
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - All money values are STRINGS (per the GraphQL schema — decimal-safe).
 *     This is intentional: the production resolver emits strings to preserve
 *     full precision; the UI parses with `Big(...)` or `Decimal`.
 *   - `equity === totalCash + positionsValue` (accounting identity).
 *   - `availableCash === totalCash - lockedCash`.
 *   - `buyingPower` reflects a 4x margin multiplier (reg-T style) so the UI
 *     shows the margin gauge differently from cash.
 *
 * Read order:
 *   1. mockAccountBalance — the only export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-01
 */

import type { AccountBalancePayload } from '@/gql/generated/graphql';

/**
 * Demo account snapshot at midday 2026-06-01.
 * - 50,000 USD total cash, 5,000 locked in resting orders.
 * - 80,250 notional in open positions (3 positions across BTC/ETH/AAPL).
 * - 9,200 unrealized P&L across the book (BTC + ETH gains > AAPL short impact).
 */
export const mockAccountBalance: AccountBalancePayload = {
  __typename: 'AccountBalancePayload',
  currency: 'USD',
  totalCash: '50000.00',
  lockedCash: '5000.00',
  availableCash: '45000.00',
  positionsValue: '80200.00',
  unrealizedPnl: '9200.00',
  equity: '130200.00',
  buyingPower: '200000.00',
};
