/**
 * @file src/modules/realtime/prana-stream/MODULE_DOC.md
 * @module realtime/prana-stream
 * @description Module docs for Prana Stream realtime updates (watchlists, orders, positions, accounts)
 * @author BharatERP
 * @created 2025-09-24
 */

# Prana Stream (Realtime)

Purpose: provide a single Socket.IO websocket delivering unified realtime updates per user for:
- watchlist ticks (throttled)
- orders updates
- positions updates
- accounts updates

## Flows

```mermaid
flowchart LR
  MD[Market Data Providers\n(main + vortex + mock)] --> A[CompositeMarketDataAdapter]
  A --> B[RealtimeAggregatorService]
  ORD[Orders Service] --> B
  POS[Positions Service] --> B
  ACC[Accounts Service] --> B
  B --> G[PranaStreamGateway]
  G --> U[Client]
```

## Events

Envelope:
```ts
type RealtimeEvent<T> = {
  type: 'watchlist.tick' | 'order.updated' | 'position.updated' | 'account.updated';
  userId: string;
  requestId?: string;
  seq: number;
  ts: string;
  data: T;
  v: 1;
};
```

## Subscription Protocol
- connect(auth: JWT) → server joins `user:<userId>`
- client `subscribe` with resources { watchlistSymbols[], orders, positions, account }
- server sends initial snapshot(s), then push-on-change diffs
- client may `unsubscribe` or update symbols

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

## Adapters
- Main provider (primary)
- Vortex provider (fallback)
- Mock provider (tests/dev)
- Composite adapter selects first healthy provider, falls back on error

Env:
- `PRANA_TICK_THROTTLE_MS=1000` (default)
- `REDIS_URL=redis://localhost:6379` (Socket.IO scaling)
- `MARKET_DATA_URL=http://market-data-api:3000` (primary live data API)
- `MARKET_DATA_FALLBACK_URL=http://market-data-fallback:3001` (optional fallback API)

Tick throttling semantics:
- The server buffers per-user ticks and emits at most once every 1s.
- Within the 1s window, only the latest price per symbol is sent (diffed).

## Changelog
- 2025-09-24: Initial scaffold approved by SonuRam ji
- 2026-02-17: Added DB-backed snapshot baseline for orders/positions/accounts and wired main/vortex adapters to live batch quote APIs with polling fallback.
- 2026-02-19: Added RealtimeScaleCoordinatorService stub for horizontal scale coordination (registerInstance, unregisterInstance, shouldHandleUser).


