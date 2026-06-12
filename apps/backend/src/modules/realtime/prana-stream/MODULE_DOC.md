/**
 * @file src/modules/realtime/prana-stream/MODULE_DOC.md
 * @module realtime/prana-stream
 * @description Module docs for Prana Stream realtime updates (watchlists, orders, positions, accounts)
 * @author BharatERP
 * @created 2025-09-24
 */

# Prana Stream (Realtime)

Purpose: provide a single Socket.IO websocket delivering unified realtime updates per user for:
- watchlist ticks (throttled, cross-pod fan-out via Redis)
- orders updates
- positions updates
- accounts updates
- margin breach alerts (warning / critical / breach)

## Flows

```mermaid
flowchart LR
  MD[Market Data Providers\n(main + vortex + kite + mock)] --> A[CompositeMarketDataAdapter]
  A --> B[RealtimeAggregatorService]
  A --> F[RealtimeTickFanoutService]
  F -- Redis pub/sub --> F2[RealtimeTickFanoutService (other pods)]
  F2 --> B
  ORD[Orders Service] --> B
  POS[Positions Service] --> B
  ACC[Accounts Service] --> B
  MARG[Risk / Margin Engine] --> B
  B --> G[PranaStreamGateway]
  G --> U[Client]
```

## Events

Envelope:
```ts
type RealtimeEvent<T> = {
  type: 'watchlist.tick' | 'order.updated' | 'position.updated' | 'account.updated' | 'margin.breach';
  userId: string;
  requestId?: string;
  seq: number;
  ts: string;
  data: T;
  v: 1;
};
```

`margin.breach` payload:
```ts
type MarginBreachPayload = {
  accountId: string;
  requiredMargin: string;
  availableCash: string;
  shortfall: string;
  severity: 'warning' | 'critical' | 'breach';
  triggeredBy?: { kind: 'order' | 'position'; id: string };
  ts: string;
};
```

## Cross-pod tick fan-out (Redis pub/sub)

`RealtimeTickFanoutService` bridges ticks across pods so a user on pod A
sees a tick that arrived at pod B:

1. Kite (or any) market data adapter on pod B receives a tick
2. Adapter calls `fanout.publishTick(tick)` which `PUBLISH prana:tick:{exch}:{sym}`
3. All pods (including B) `SUBSCRIBE prana:tick:*` for symbols they have
   local watchers for
4. The fanout service on each pod hands the incoming ticks to the
   local `RealtimeAggregatorService.ingestExternalTicks()`
5. Aggregator filters by local watchers and emits throttled diffs to
   the user's socket

The system is `N×M` fan-out friendly — at most one Redis publish per
upstream tick, regardless of how many pods or users are watching.

## Subscription Protocol
- connect(auth: JWT) → server joins `user:<userId>`
- client `subscribe` with resources { watchlistSymbols[], orders, positions, accounts }
- server sends initial snapshot(s), then push-on-change diffs
- client may `unsubscribe` or update symbols
- `accounts: true` ALSO subscribes the user to `margin.breach` events

Example subscribe (Socket.IO):
```json
{
  "watchlist": [{"exchange":"NSE","symbol":"RELIANCE"}],
  "orders": true,
  "positions": true,
  "accounts": true
}
```

Events:
- `snapshot` → initial state
- `watchlist.ticks` → array of ticks (throttled, diffed)
- `order.updated`, `position.updated`, `account.updated`
- `margin.breach` → margin shortfall alert (warning/critical/breach)

## Optimistic Order Updates (client-side)

`apps/web/lib/prana-stream/stores/optimistic-orders.ts` (zustand store)
backs a sub-50ms perceived order placement: the user sees the order
in their list with status `PENDING` immediately on click, and the
subsequent server response + `order.updated` event reconciles the
state. Server is the source of truth.

## Adapters
- Main provider (default primary)
- Vortex provider (fallback)
- Mock provider (tests/dev — always wired)
- Kite provider (push-based live ticks for NSE/BSE/MCX)
- Composite adapter selects the configured primary via `MARKET_DATA_PROVIDER`; falls back to vortex on connect failure

Env:
- `PRANA_TICK_THROTTLE_MS=1000` (default)
- `PRANA_EVENT_BUFFER_CAPACITY=500` (default — per-user replay buffer)
- `REDIS_URL=redis://localhost:6379` (Socket.IO scaling + tick fan-out + missed events)
- `MARKET_DATA_PROVIDER=kite` (primary provider — `kite|main|vortex|mock`; defaults to `main`)
- `MARKET_DATA_URL=http://market-data-api:3000` (used by main provider)
- `MARKET_DATA_FALLBACK_URL=http://market-data-fallback:3001` (used by vortex provider)
- `KITE_API_KEY` / `KITE_ACCESS_TOKEN` — required when `MARKET_DATA_PROVIDER=kite`

Tick throttling semantics:
- The server buffers per-user ticks and emits at most once every 1s.
- Within the 1s window, only the latest price per symbol is sent (diffed).

Margin breach semantics:
- `margin.breach` is added to the `CRITICAL_EVENTS` set, so when the
  user is offline, a push notification is fired (SNS / FCM depending
  on platform).
- On reconnect, the buffered `margin.breach` events are replayed via
  `RealtimeEventBufferService.replay()`.

## Changelog
- 2025-09-24: Initial scaffold approved by SonuRam ji
- 2026-02-17: Added DB-backed snapshot baseline for orders/positions/accounts and wired main/vortex adapters to live batch quote APIs with polling fallback.
- 2026-02-19: Added RealtimeScaleCoordinatorService stub for horizontal scale coordination (registerInstance, unregisterInstance, shouldHandleUser).
- 2026-06-10: KiteMarketDataAdapter wired into CompositeMarketDataAdapter. Primary provider now configurable via MARKET_DATA_PROVIDER env (kite|main|vortex|mock). Token resolution via InstrumentEntity.providerToken.
- 2026-06-10: Added `RealtimeTickFanoutService` for cross-pod tick distribution via Redis pub/sub. All pods subscribe to symbols they have local watchers for; the upstream adapter publishes to Redis; fan-out service hands off to local aggregator.
- 2026-06-10: Added `margin.breach` event type. Backend `publishMarginBreach()` emits to user room; `RealtimeEventBufferService` and `RealtimeOfflineFallbackService` treat it as critical (push notification when offline, replay on reconnect). Client `useMarginBreach()` hook + `MarginBreachPayload` type.


