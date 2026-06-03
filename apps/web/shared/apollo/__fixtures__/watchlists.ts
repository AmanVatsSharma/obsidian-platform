/**
 * File:        apps/web/shared/apollo/__fixtures__/watchlists.ts
 * Module:      web · Shared · Apollo · Fixtures
 * Purpose:     Deterministic mock `WatchlistDto[]` fixtures for the
 *              `GetWatchlists` GraphQL operation. Powers the watchlist rail
 *              on the trader terminal home screen.
 *
 * Exports:
 *   - mockWatchlists: WatchlistDto[]   — 2 watchlists (named buckets)
 *
 * Depends on:
 *   - @/gql/generated/graphql — WatchlistDto
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Shapes match `WatchlistDto` exactly: { id, name, createdAt }.
 *     The user's spec asked for "2 watchlists with 3 instruments each", but
 *     the generated `WatchlistDto` does NOT have an `instruments` field, and
 *     the `GetWatchlists` operation does NOT select one. The instrument
 *     membership lives in `WatchlistItemDto`, exposed through a separate
 *     operation that the terminal has not yet wired. The canonical
 *     instrument IDs for each watchlist are captured below as a `KNOWN_ITEMS`
 *     const for downstream consumers that need them — but the `mockWatchlists`
 *     array itself conforms strictly to the generated type.
 *   - `createdAt` is an ISO 8601 string (DateTime scalar, output side is string).
 *   - `id` is a GraphQL `ID` (string at runtime).
 *
 * Read order:
 *   1. KNOWN_ITEMS    — what the user spec asked for; reference data only
 *   2. mockWatchlists — the only GraphQL-shaped export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-01
 */

import type { WatchlistDto } from '@/gql/generated/graphql';

/**
 * Reference data: which instruments belong to which watchlist, since the
 * generated `WatchlistDto` does not embed them. Consumers that need the
 * instrument list can dereference these IDs against `mockInstruments`.
 */
export const KNOWN_ITEMS: Readonly<Record<string, readonly string[]>> = {
  'wl-crypto-core': ['inst-btc-usd', 'inst-eth-usd'],
  'wl-equities-blue-chip': ['inst-aapl'],
} as const;

/**
 * Two watchlists the demo user has saved.
 * - "Crypto Core" — created at the start of 2026.
 * - "Equities Blue-Chip" — created 6 weeks later.
 */
export const mockWatchlists: WatchlistDto[] = [
  {
    __typename: 'WatchlistDto',
    id: 'wl-crypto-core',
    name: 'Crypto Core',
    createdAt: '2026-01-04T13:45:00.000Z',
  },
  {
    __typename: 'WatchlistDto',
    id: 'wl-equities-blue-chip',
    name: 'Equities Blue-Chip',
    createdAt: '2026-02-15T09:20:00.000Z',
  },
];
