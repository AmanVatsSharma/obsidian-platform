/**
 * File:        apps/web/shared/apollo/__fixtures__/quote.ts
 * Module:      web · Shared · Apollo · Fixtures
 * Purpose:     Deterministic mock `QuoteDto` fixture for the `GetQuote`
 *              GraphQL operation. Drives the ticker tape and the last-trade
 *              cell on the trading terminal's order ticket.
 *
 * Exports:
 *   - mockQuote: QuoteDto   — single BTC-USD top-of-book snapshot
 *
 * Depends on:
 *   - @/gql/generated/graphql — QuoteDto
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Shape matches `QuoteDto` exactly: { symbol, exchange, price, ts }.
 *     The user's spec called for bid/ask/change/changePct/volume, but those
 *     fields are NOT present in the generated `QuoteDto` or selected by the
 *     `GetQuote` operation. Do NOT add them — `tsc` would fail. The narrower
 *     shape is the contract the resolvers actually return.
 *   - `ts` is an ISO 8601 string (DateTime scalar, output side is string).
 *   - `price` is a JS number (Float scalar), not a decimal — the resolver
 *     already cast from the exchange feed's decimal-safe representation.
 *
 * Read order:
 *   1. mockQuote — the only export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-01
 */

import type { QuoteDto } from '@/gql/generated/graphql';

/**
 * Top-of-book snapshot for BTC-USD on Binance, midday 2026-06-01.
 */
export const mockQuote: QuoteDto = {
  __typename: 'QuoteDto',
  symbol: 'BTC-USD',
  exchange: 'BINANCE',
  price: 67000,
  ts: '2026-06-01T12:00:00.000Z',
};
