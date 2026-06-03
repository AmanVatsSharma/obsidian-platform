/**
 * File:        apps/web/shared/apollo/__fixtures__/instruments.ts
 * Module:      web · Shared · Apollo · Fixtures
 * Purpose:     Deterministic mock `InstrumentDto[]` fixtures for the
 *              `GetInstruments` GraphQL operation. Covers multiple asset
 *              classes so instrument pickers, watchlists, and search UIs
 *              can be tested against a representative sample.
 *
 * Exports:
 *   - mockInstruments: InstrumentDto[]   — 5 entries across crypto, equities, FX, and commodity
 *
 * Depends on:
 *   - @/gql/generated/graphql — InstrumentDto
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Shapes match `InstrumentDto` exactly; do NOT add or rename fields or
 *     `tsc` will fail against the generated schema types.
 *   - The `type` field is the free-form asset-class string used by the
 *     instrument search filters (`CRYPTO`, `EQUITY`, `FX`, `COMMODITY`).
 *   - `status` is optional in the schema; the only ACTIVE instrument here is
 *     the BTC pair — the others are listed for breadth, not all are tradable.
 *   - `id` and `symbol` are stable — referenced by positions.ts, quote.ts,
 *     watchlists.ts, and orders.ts.
 *
 * Read order:
 *   1. mockInstruments — the only export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-01
 */

import type { InstrumentDto } from '@/gql/generated/graphql';

/**
 * Representative instrument universe used by the demo account.
 * - BTC-USD (crypto) — referenced by positions, quote, orders
 * - ETH-USD (crypto) — referenced by positions, orders
 * - AAPL (equity)    — referenced by positions, orders
 * - EUR-USD (FX)     — common FX pair
 * - XAU-USD (commodity) — gold spot
 */
export const mockInstruments: InstrumentDto[] = [
  {
    __typename: 'InstrumentDto',
    id: 'inst-btc-usd',
    symbol: 'BTC-USD',
    displayName: 'Bitcoin / US Dollar',
    exchangeCode: 'BINANCE',
    type: 'CRYPTO',
    status: 'ACTIVE',
  },
  {
    __typename: 'InstrumentDto',
    id: 'inst-eth-usd',
    symbol: 'ETH-USD',
    displayName: 'Ethereum / US Dollar',
    exchangeCode: 'BINANCE',
    type: 'CRYPTO',
    status: 'ACTIVE',
  },
  {
    __typename: 'InstrumentDto',
    id: 'inst-aapl',
    symbol: 'AAPL',
    displayName: 'Apple Inc.',
    exchangeCode: 'NASDAQ',
    type: 'EQUITY',
    status: 'ACTIVE',
  },
  {
    __typename: 'InstrumentDto',
    id: 'inst-eur-usd',
    symbol: 'EUR-USD',
    displayName: 'Euro / US Dollar',
    exchangeCode: 'OANDA',
    type: 'FX',
    status: 'ACTIVE',
  },
  {
    __typename: 'InstrumentDto',
    id: 'inst-xau-usd',
    symbol: 'XAU-USD',
    displayName: 'Gold Spot / US Dollar',
    exchangeCode: 'COMEX',
    type: 'COMMODITY',
  },
];
