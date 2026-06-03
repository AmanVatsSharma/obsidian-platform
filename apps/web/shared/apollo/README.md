# Mock Apollo Link — apps/web/shared/apollo

> Enterprise trading terminal dev-mode mock layer for the GraphQL Apollo Client.

## Why this exists

The trader terminal has to render without a live backend for component work,
Storybook stories, and isolated UI tests. `MockApolloLink` short-circuits the
Apollo network layer when the mock switch is enabled, returning typed fixture
payloads keyed by GraphQL operation name. It is wired into the Apollo client
bootstrap in the same place the real `HttpLink` lives, so swapping between
mocked and live data is a single env-var change rather than a code change.

## Activation

Set the env var before building or running the web app:

```bash
NEXT_PUBLIC_MOCK_GQL=true npm run dev:web
```

The check happens at call time inside `isMockGraphQLEnabled()` rather than at
module load. A build that statically inlines `NEXT_PUBLIC_MOCK_GQL='true'`
keeps the mock branch in the bundle; a production build with the var unset
tree-shakes the mock branch out. The variable is `NEXT_PUBLIC_*` on purpose —
Next.js inlines `NEXT_PUBLIC_*` values into the client bundle, which is the
mechanism that lets the link decide which link to install in the browser.

## What is mocked

The `MOCK_FIXTURES` map in `__fixtures__/index.ts` registers six operations.
For each one, the link returns the value from the named fixture file:

| Operation name | Fixture file | Payload shape |
| --- | --- | --- |
| `GetPositions` | `__fixtures__/positions.ts` | `PositionRow[]` — three rows (BTC long, ETH long, AAPL short) with `netQty`, `avgPrice`, `lastPrice`, `mtmPnl`, `realizedPnl`, and absolute `value` |
| `GetOrders` | `__fixtures__/orders.ts` | `OrderEntity[]` — three rows covering the three lifecycle states the blotter needs (working limit, filled market, cancelled stop) |
| `GetAccountBalance` | `__fixtures__/account-balance.ts` | `AccountBalancePayload` — single record with USD `totalCash`, `lockedCash`, `equity`, and a 4x `buyingPower` margin multiplier |
| `GetInstruments` | `__fixtures__/instruments.ts` | `InstrumentDto[]` — five rows across crypto, equities, FX, and commodity asset classes |
| `GetQuote` | `__fixtures__/quote.ts` | `QuoteDto` — single BTC-USD top-of-book snapshot with `symbol`, `exchange`, `price`, and ISO 8601 `ts` |
| `GetWatchlists` | `__fixtures__/watchlists.ts` | `WatchlistDto[]` — two named watchlists (id, name, createdAt). Per-watchlist instrument membership is exposed as the `KNOWN_ITEMS` const for downstream consumers that need it |

The map is typed `Record<string, unknown>` on purpose: the link performs a
runtime lookup by operation name and the operation's own generated types
enforce the row shape at the call site. This avoids a circular import from
the fixtures barrel into the generated Apollo hooks.

## How to override a fixture in dev

`MockApolloLink` consults `window.__MOCK_OVERRIDES__` before resolving an
operation against `MOCK_FIXTURES`. The override is a complete replacement for
the matching key — there is no deep merge. The link checks for `window`
before reading, so server-side rendering does not blow up.

```ts
window.__MOCK_OVERRIDES__ = {
  GetPositions: [
    {
      instrumentId: 'override',
      netQty: 1,
      avgPrice: 1,
      lastPrice: 1,
      mtmPnl: 0,
      realizedPnl: 0,
      value: 1,
    },
  ],
};
```

Set the override from the browser devtools console after the page mounts, or
assign it from a Storybook decorator. Reload the page (or re-fire the query)
to see the new payload. To restore the default, delete the key or set the
entry back to `undefined`.

## Adding a new mocked operation

1. Add a new fixture file under `__fixtures__/` (for example
   `__fixtures__/fills.ts`) that exports the typed payload the operation
   expects.
2. Register the operation in `__fixtures__/index.ts` by adding the fixture to
   the `MOCK_FIXTURES` map under the exact GraphQL operation name (the name
   baked into the generated document).
3. Restart the dev server. The link reads `MOCK_FIXTURES` at request time, but
   module-level fixtures only pick up new exports after a fresh import.
4. Verify by hitting the operation. If step 2 was skipped, the link raises a
   `GraphQLError` of the form "Unknown mock operation: <OpName>" — the
   unknown-operation branch is the only failure mode and it is loud on
   purpose.

## Security

**Never set `NEXT_PUBLIC_MOCK_GQL=true` in production.** It bypasses real
auth, real risk checks, and real execution. The variable is `NEXT_PUBLIC_*`
so Next.js inlines the value into the client bundle — anyone visiting the
site can see mock data and inject overrides through `window.__MOCK_OVERRIDES__`.
The override window is exposed because developers need it for local
exploration and Storybook, but the link must never reach a deployed
environment. CI must fail the build if `NEXT_PUBLIC_MOCK_GQL` is `true` in
a production env file.

## Files in this directory

| Path | Purpose |
| --- | --- |
| `mock-config.ts` | Env-var helper: `MOCK_GQL_ENV_VAR`, `isMockGraphQLEnabled()`, `getMockMode()`, and the `MockMode` type union. Pure read at call time so the bundler can dead-code-eliminate the mock branch. |
| `mock-config.spec.ts` | Unit tests for the env-var helper. Locks down the strict `'true'` check, case-sensitivity, and the typed `getMockMode` return. |
| `mock-apollo-link.ts` | The `MockApolloLink` itself: an Apollo `ApolloLink` that resolves registered operations from `MOCK_FIXTURES` (with `window.__MOCK_OVERRIDES__` taking precedence) and raises a `GraphQLError` for any unknown operation. |
| `__fixtures__/index.ts` | Barrel that re-exports each fixture and assembles the `MOCK_FIXTURES` operation-name → payload map consumed by the link. |
| `__fixtures__/positions.ts` | `mockPositions: PositionRow[]` — three deterministic rows (BTC long, ETH long, AAPL short). |
| `__fixtures__/orders.ts` | `mockOrders: OrderEntity[]` — one row per blotter lifecycle state (working limit, filled market, cancelled stop). |
| `__fixtures__/account-balance.ts` | `mockAccountBalance: AccountBalancePayload` — single USD record with cash, equity, and 4x buying power. |
| `__fixtures__/instruments.ts` | `mockInstruments: InstrumentDto[]` — five rows across crypto, equities, FX, and commodity. |
| `__fixtures__/quote.ts` | `mockQuote: QuoteDto` — single BTC-USD top-of-book snapshot. |
| `__fixtures__/watchlists.ts` | `mockWatchlists: WatchlistDto[]` plus a `KNOWN_ITEMS` const for downstream consumers that need per-watchlist instrument IDs. |
