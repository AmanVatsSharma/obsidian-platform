/**
 * File:        apps/web/shared/apollo/__fixtures__/positions.ts
 * Module:      web · Shared · Apollo · Fixtures
 * Purpose:     Deterministic mock `PositionRow[]` fixtures for the `GetPositions`
 *              GraphQL operation. Used by Storybook stories, component tests, and
 *              the Apollo mock link when the trader terminal renders positions
 *              without a live backend.
 *
 * Exports:
 *   - mockPositions: PositionRow[]   — 3 entries (BTC long, ETH long, AAPL short)
 *
 * Depends on:
 *   - @/gql/generated/graphql — PositionRow (the GraphQL row type for a position)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Shapes match `PositionRow` exactly; do NOT add or rename fields or
 *     `tsc` will fail against the generated schema types.
 *   - BTC ~ 67,000 USD and ETH ~ 3,400 USD reflect realistic spot prices for
 *     a sample fixture (not live market data).
 *   - `netQty` sign encodes direction (positive = long, negative = short).
 *   - `value` is the absolute notional (`|netQty| * lastPrice`) and is signed-
 *     agnostic; `mtmPnl` is signed (positive = gain, negative = loss).
 *
 * Read order:
 *   1. mockPositions — the only export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-01
 */

import type { PositionRow } from '@/gql/generated/graphql';

/**
 * Three realistic positions for the demo account.
 * - BTC long: entered 60,000, last 67,000 → 7,000 * 0.5 = 3,500 unrealized
 * - ETH long: entered 3,000, last 3,400 → 400 * 8 = 3,200 unrealized
 * - AAPL short: entered 220, last 195 → 25 * 100 = 2,500 unrealized gain
 */
export const mockPositions: PositionRow[] = [
  {
    __typename: 'PositionRow',
    instrumentId: 'inst-btc-usd',
    netQty: 0.5,
    avgPrice: 60000,
    lastPrice: 67000,
    mtmPnl: 3500,
    realizedPnl: 0,
    value: 33500,
  },
  {
    __typename: 'PositionRow',
    instrumentId: 'inst-eth-usd',
    netQty: 8,
    avgPrice: 3000,
    lastPrice: 3400,
    mtmPnl: 3200,
    realizedPnl: 150,
    value: 27200,
  },
  {
    __typename: 'PositionRow',
    instrumentId: 'inst-aapl',
    netQty: -100,
    avgPrice: 220,
    lastPrice: 195,
    mtmPnl: 2500,
    realizedPnl: 0,
    value: 19500,
  },
];
