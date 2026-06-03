/**
 * File:        apps/web/shared/apollo/__fixtures__/index.ts
 * Module:      web · Shared · Apollo · Fixtures
 * Purpose:     Barrel re-export of every GraphQL mock fixture plus the
 *              `MOCK_FIXTURES` map keyed by GraphQL operation name. The map
 *              is the dispatch contract used by the Apollo mock link in
 *              Storybook stories, jest tests, and the local dev "no-network"
 *              toggle.
 *
 * Exports:
 *   - mockPositions: PositionRow[]                     — see ./positions
 *   - mockOrders: OrderEntity[]                        — see ./orders
 *   - mockAccountBalance: AccountBalancePayload        — see ./account-balance
 *   - mockInstruments: InstrumentDto[]                 — see ./instruments
 *   - mockQuote: QuoteDto                              — see ./quote
 *   - mockWatchlists: WatchlistDto[]                   — see ./watchlists
 *   - KNOWN_ITEMS: Readonly<Record<string, string[]>>  — see ./watchlists
 *   - MOCK_FIXTURES: Record<string, unknown>           — op-name → payload map
 *
 * Depends on:
 *   - ./positions, ./orders, ./account-balance, ./instruments, ./quote, ./watchlists
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - MOCK_FIXTURES is typed `Record<string, unknown>` on purpose — the
 *     Apollo mock link does a runtime lookup by operation name and returns
 *     whatever the operation expects. Static typing each entry against the
 *     `GetXxxQuery` result would create a circular import into the generated
 *     hooks and force this barrel to depend on @/gql/generated/hooks. The
 *     per-fixture files already enforce the row shapes; the map is the
 *     transport glue.
 *   - Operation-name keys MUST match the operation name in the .gql files
 *     under `apps/web/gql/operations/**`. Codegen bakes the document name
 *     into the generated document, so a rename here is a one-line edit.
 *
 * Read order:
 *   1. MOCK_FIXTURES — the dispatch contract
 *   2. Individual fixture exports — for components that want a specific payload
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-01
 */

import { mockPositions } from './positions';
import { mockOrders } from './orders';
import { mockAccountBalance } from './account-balance';
import { mockInstruments } from './instruments';
import { mockQuote } from './quote';
import { mockWatchlists, KNOWN_ITEMS } from './watchlists';

export {
  mockPositions,
  mockOrders,
  mockAccountBalance,
  mockInstruments,
  mockQuote,
  mockWatchlists,
  KNOWN_ITEMS,
};

/**
 * Operation-name → GraphQL payload map.
 *
 * Runtime contract:
 *   - Keys are the GraphQL operation names (e.g. "GetPositions").
 *   - Values are the raw payloads the Apollo mock link returns when the
 *     matching document fires. For connection-shaped operations
 *     (`GetPositions`, `GetOrders`) the value is the `data` array, not the
 *     connection envelope, because the mock link wraps it at request time
 *     to match the operation's selection set.
 *   - `GetAccountBalance` and `GetQuote` are single-record operations, so the
 *     value is the record itself.
 *
 * Consumers should treat this as the single source of truth for "what does
 * the mock backend return?". If you add a new mock fixture, register it
 * here under its operation name.
 */
export const MOCK_FIXTURES: Record<string, unknown> = {
  GetPositions: mockPositions,
  GetOrders: mockOrders,
  GetAccountBalance: mockAccountBalance,
  GetInstruments: mockInstruments,
  GetQuote: mockQuote,
  GetWatchlists: mockWatchlists,
};
