# Obsidian Trading Book — Frontend Integration Spec
**Spec Version:** 1.0
**Date:** 2026-05-24
**Author:** Obsidian Architecture Team
**Status:** Draft — pending implementation

---

## 1. Overview

Connect the newly-built backend trading book (bracket orders, conditional orders, algo orders, B-book, risk engine, SOR, order book) to the two highest-impact frontend applications: **web (trader terminal)** and **broker-admin (risk control panel)**.

The web is where traders interact with orders directly — new order types, bracket UI, multi-leg positions, order book depth. Broker admin is where brokers manage risk — threshold configuration, exposure monitoring, liquidation status, B-book strategy.

---

## 2. Scope

**In scope:**
- Web: order entry, pending orders table, positions table, order book depth, GQL mutations
- Broker admin: orders page filter, exposure limits dashboard, risk dashboard, B-book strategy config

**Out of scope for this spec:**
- Dealer workstation (Phase 3 — WebSocket migration)
- Platform owner (Phase 4 — broker-level B-book config)
- Support ops, IB portal, developer portal (Phase 5)

---

## 3. Architecture

### 3.1 Web — GraphQL-first with REST fallback

```
apps/web/features/trading-terminal/
├── lib/
│   ├── gql-service.ts       — EXTEND: add new mutations/queries
│   ├── workstation-api.ts   — EXTEND: bracket order submit, order book fetch
│   └── types.ts            — EXTEND: add new types (BracketConfig, StrategyPosition, OrderBook)
├── components/
│   ├── order-entry.tsx      — EXTEND: add order types (GTT/Trailing/ICEBERG/TWAP/VWAP)
│   ├── pending-orders-table.tsx  — EXTEND: bracket parent/child display, orderRole badge
│   ├── positions-table.tsx  — EXTEND: multi-leg aggregate rows, expandable legs
│   ├── depth-of-market.tsx  — ENHANCE: real data from /order-book/depth
│   └── account-summary-panel.tsx  — EXTEND: margin level, buying power from risk engine
└── pages/ (Next.js App Router)
    └── (trader)/order-management/  — EXTEND: filter by order type, bracket groups
```

**API contract:**

| Feature | Endpoint | Method | Request | Response |
|---|---|---|---|---|
| Place bracket order | `POST /api/orders/bracket` | REST | `PlaceBracketOrderDto` | `{ orderId, children[], status }` |
| Place conditional order | `POST /api/orders` | REST | `PlaceOrderDto` (type=GTT/TRAILING) | `{ orderId, status }` |
| Get order children | `GET /api/orders/:id/children` | REST | — | `OrderEntity[]` |
| Get strategy positions | `GET /api/accounts/:id/strategy-positions` | REST | — | `StrategyPosition[]` |
| Get order book depth | `GET /api/order-book/:symbol/depth` | REST | `?levels=10` | `{ bids[], asks[], spread, timestamp }` |
| Account risk snapshot | GraphQL | Query | `accountId` | `{ marginLevel, usedMargin, buyingPower, exposurePerInstrument }` |
| Place order (GraphQL) | GraphQL mutation | — | `PlaceOrderInput` | `OrderPayload` |

### 3.2 Broker Admin — REST-first

```
apps/broker-admin/src/app/(admin)/
├── orders/page.tsx          — EXTEND: filter by order type, bracket groups, algo orders
├── exposure-limits/page.tsx  — EXTEND: live margin level, alert banners, configurable thresholds
├── risk-dashboard/page.tsx  — NEW: real-time exposure, VAR, Greeks, circuit breaker status
└── bbook-strategy/page.tsx  — NEW: per-broker A_BOOK/B_BOOK/B_PREFERRED config
```

**API contract:**

| Feature | Endpoint | Method | Request | Response |
|---|---|---|---|---|
| List orders (filterable) | `GET /api/orders` | REST | `?type=GTT&parentId=&algoType=TWAP` | `{ orders[], total }` |
| Create risk threshold | `POST /admin/risk/thresholds` | REST | `RiskThresholdDto` | `{ id, metric, threshold, action }` |
| List risk thresholds | `GET /admin/risk/thresholds` | REST | `?tenantId=&accountId=` | `RiskThreshold[]` |
| Update risk threshold | `PATCH /admin/risk/thresholds/:id` | REST | `{ thresholdValue?, enabled? }` | `RiskThreshold` |
| Get exposure snapshot | `GET /admin/risk/exposure` | REST | `?brokerId=` | `{ marginLevel, exposurePerInstrument[], openPositions }` |
| Get liquidation status | `GET /admin/risk/liquidation-history` | REST | `?accountId=&from=&to=` | `LiquidationEvent[]` |
| Set broker book strategy | `PUT /admin/broker/:id/book-strategy` | REST | `{ strategy: 'A_ONLY' | 'B_PREFERRED' | 'B_BOOK' }` | `{ id, bookStrategy, updatedAt }` |
| Get broker book strategy | `GET /admin/broker/:id/book-strategy` | REST | — | `BrokerBookStrategy` |

---

## 4. Web — Detailed Design

### 4.1 Order Entry — Extended Order Types

**File:** `apps/web/features/trading-terminal/components/order-entry.tsx`

**Current state:** Market / Limit / Stop type buttons + SL/TP inputs.

**Changes:**
1. Type buttons expand: `Market | Limit | Stop | GTT | Trailing | Iceberg | TWAP | VWAP`
2. When type = `GTT`: add `Trigger Price` input + `Trigger Condition` toggle (ABOVE/BELOW)
3. When type = `Trailing`: add `Trail Distance` input + `Trail %` toggle
4. When type = `Iceberg`: add `Display Qty` input (hidden, remainder as child orders)
5. When type = `TWAP/VWAP`: add `Slices` number + `Duration` minutes
6. Bracket section always visible (TP/SL price inputs) — attached to any order type
7. Submit → detect bracket → call `POST /api/orders/bracket`; otherwise `POST /api/orders`

**UI layout:**
```
Order Type: [Market][Limit][Stop][GTT][Trailing][Iceberg][TWAP][VWAP]
            └──── conditional/algo fields appear below based on selection ────┘

Qty: [____]  Price: [____]  SL: [____]  TP: [____]
                              [BUY ▲]   [SELL ▼]
```

**Validation:**
- GTT: trigger price required
- Trailing: trail distance OR trail % required
- Iceberg: display qty < total qty required
- TWAP/VWAP: slices (1-50), duration (1-480 min) required
- Bracket: takeProfitPrice OR stopLossPrice at least one required for any order

### 4.2 Pending Orders Table — Bracket Display

**File:** `apps/web/features/order-management/components/pending-orders-table.tsx`

**Changes:**
1. Add `Role` column — shows `PRIMARY | TAKE_PROFIT | STOP_LOSS` badge
2. Add `Group` column — groups child orders under their parent visually (indent, connecting line, collapse/expand)
3. Type column shows full type: `LIMIT`, `GTT`, `TRAILING_STOP`, `ICEBERG`, `TWAP`, `VWAP`
4. Add `Algo` column for TWAP/VWAP orders showing slices completed / total
5. Filter tabs: `All | Bracket | GTT | Trailing | Algo`
6. Cancel action on PRIMARY cancels all children (with confirmation)

**Badge colors:**
- PRIMARY: `bg-obsidian-accent/10 text-obsidian-accent`
- TAKE_PROFIT: `bg-[var(--bull)]/10 text-[var(--bull)]`
- STOP_LOSS: `bg-[var(--bear)]/10 text-[var(--bear)]`

### 4.3 Positions Table — Multi-leg Support

**File:** `apps/web/features/portfolio/components/positions-table.tsx`

**Changes:**
1. Add `Strategy` column — for multi-leg positions (spreads, straddles), shows strategy name
2. Add `Legs` column — shows count (e.g., "2 legs", "3 legs")
3. Rows for strategy-level positions show aggregate P&L
4. Click to expand → shows individual leg rows below (collapsible)
5. P&L shown as realized + unrealized breakdown on hover

**Expandable row structure:**
```
▼ EURUSD Spread    STRADDLE    Long    +$450 (+2.3%)    [expanded]
  ├── Long  EURUSD  BUY  2.00  @ 1.0850  mtm: 1.0860  +$200
  └── Short EURUSD  SELL 2.00  @ 1.0860  mtm: 1.0855  +$250
```

### 4.4 Order Book Depth

**File:** `apps/web/features/trading-terminal/components/depth-of-market.tsx`

**Current:** mock data display of bid/ask depth.

**Changes:**
1. Fetch real depth: `GET /api/order-book/:symbol/depth?levels=10`
2. Display: bid/ask levels with size, cumulative depth bar visualization
3. Update via polling (every 3s) or WebSocket subscription
4. Color: bids in bull green, asks in bear red
5. Spread display at center: `Spread: X pips`

### 4.5 GQL Service — New Mutations

**File:** `apps/web/features/trading-terminal/lib/gql-service.ts`

**Add:**

```graphql
mutation PlaceBracketOrder($input: PlaceBracketOrderInput!) {
  placeBracketOrder(input: $input) {
    id
    status
    children { id type orderRole price quantity }
  }
}

mutation PlaceConditionalOrder($input: PlaceOrderInput!) {
  placeOrder(input: $input) {
    id
    status
    type
    triggerPrice
    triggerCondition
  }
}

query GetOrderChildren($parentId: ID!) {
  orderChildren(parentId: $parentId) {
    id
    type
    orderRole
    status
    price
    quantity
    filledQty
  }
}

query GetStrategyPositions($accountId: ID!) {
  strategyPositions(accountId: $accountId) {
    id
    instrumentId
    strategyType
    legs { id side quantity openPrice currentPrice unrealizedPnl }
    netQuantity
    unrealizedPnl
    realizedPnl
  }
}

query GetAccountRisk($accountId: ID!) {
  accountRisk(accountId: $accountId) {
    marginLevel
    usedMargin
    buyingPower
    exposurePerInstrument { instrumentId netExposure marginUtilization }
  }
}
```

### 4.6 Account Summary Panel

**File:** `apps/web/features/trading-terminal/components/account-summary-panel.tsx`

**Changes:**
1. Add `Margin Level` display: `ML: 142%` with color (green > 150%, amber 100-150%, red < 100%)
2. Add `Buying Power` with updated formula from risk engine
3. Add `Open Positions` count linked to positions table
4. Add `Pending Orders` count linked to orders table

---

## 5. Broker Admin — Detailed Design

### 5.1 Orders Page — Filter by Order Type

**File:** `apps/broker-admin/src/app/(admin)/orders/page.tsx`

**Changes:**
1. Add filter chips: `All | Bracket | GTT | Trailing | TWAP | VWAP | ICEBERG`
2. Add `Parent` filter: show only bracket parent orders / child orders
3. Order type badge: color-coded by type (bracket=blue, gtt=purple, trailing=orange, algo=teal)
4. OrderRole column: PRIMARY/TAKE_PROFIT/STOP_LOSS with indent for children
5. Algo details column for TWAP/VWAP orders (slices, completion %)
6. New `Liquidation` filter: show orders placed via auto-liquidation

### 5.2 Exposure Limits — Live Margin Dashboard

**File:** `apps/broker-admin/src/app/(admin)/exposure-limits/page.tsx`

**Changes:**
1. Add `Margin Level` section at top: large gauge showing current level, color-coded
2. Add alert banner when margin level < 110% (warning) or < 80% (critical)
3. Add `Auto-Liquidation Status` indicator per account
4. Add `Risk Thresholds` table: CRUD for configurable thresholds (margin level, exposure, delta, gamma)
5. Add `Circuit Breaker` status: per-symbol trading halt indicators
6. Utilization bars: existing exposure vs. configurable limits

**New threshold types to support:**
- `MARGIN_LEVEL` — operator: LT, GTE; threshold: percentage
- `EXPOSURE` — operator: GT, LTE; threshold: absolute value
- `OPEN_ORDERS` — operator: GT; threshold: count
- `DELTA` — operator: GT, LTE; threshold: absolute delta
- `GAMMA` — operator: GT; threshold: absolute gamma

### 5.3 Risk Dashboard (New Page)

**File:** `apps/broker-admin/src/app/(admin)/risk-dashboard/page.tsx`

**Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  Risk Dashboard — [Broker Name ▼]    Last updated: 12:34  │
├─────────────────────────────────────────────────────────────┤
│  [Margin Level Gauge]  │  [Portfolio VAR]  │  [Greeks]   │
│       ML: 142%          │    VAR: $12,340    │  Δ: +0.45  │
│       ● Healthy         │    95% 1-day       │  Γ: +0.02  │
├─────────────────────────────────────────────────────────────┤
│  Exposure per Instrument                        [Filters] │
│  ╔══════════════════════════════════════════════════════╗   │
│  ║ EURUSD  ████████████████░░░░░░░░░  68%  │  $45K/$66K ║   │
│  ║ XAUUSD  ██████████░░░░░░░░░░░░░░░  42%  │  $21K/$50K ║   │
│  ║ BTCUSD  ████████████████████████░  91%  │  $9K/$10K  ║   │
│  ╚══════════════════════════════════════════════════════╝   │
├─────────────────────────────────────────────────────────────┤
│  Circuit Breakers                                        │
│  [EURUSD 🟡 Halted] [XAUUSD 🟢 Active] [BTCUSD 🟢 Active] │
├─────────────────────────────────────────────────────────────┤
│  Liquidation Events (last 24h)                 [Export]  │
│  • 14:32 — Account A-1042  LIQUIDATE_ALL  ML: 68%         │
│  • 11:15 — Account A-1018  LIQUIDATE_BIGGEST  ML: 87%    │
└─────────────────────────────────────────────────────────────┘
```

**Data source:**
- Margin level: `GET /admin/risk/exposure?brokerId=X`
- Portfolio VAR: `GET /admin/risk/var?brokerId=X`
- Greeks: `GET /admin/risk/greeks?accountId=X`
- Exposure per instrument: `GET /admin/risk/exposure?brokerId=X&byInstrument=true`
- Circuit breakers: `GET /admin/risk/circuit-breakers`
- Liquidation history: `GET /admin/risk/liquidation-history`

### 5.4 B-Book Strategy Configuration

**File:** `apps/broker-admin/src/app/(admin)/bbook-strategy/page.tsx`

**Design:**
```
┌──────────────────────────────────────────────────────────────┐
│  B-Book Strategy — [Broker Name]                            │
├──────────────────────────────────────────────────────────────┤
│  Current Strategy:  [B_PREFERRED ▼]                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ● A_ONLY    — All orders routed to exchange            │ │
│  │   Revenue: spread mark-up only                          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ ○ B_PREFERRED — Internalize when profitable, else route  │ │
│  │   Revenue: internalization P&L + spread mark-up          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ ○ B_BOOK    — All orders internalized (no external routing)│ │
│  │   Revenue: full internalization P&L, no exchange fees   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Risk Controls for B-Book:                                   │
│  ☑ Auto-liquidate when margin < [____]%  (default: 75%)    │
│  ☑ Max single-position size: [____] lots                    │
│  ☑ Max daily B-book loss: $[____]                           │
│                                                              │
│  [Save Changes]                                              │
└──────────────────────────────────────────────────────────────┘
```

**API:** `PUT /admin/broker/:id/book-strategy`

---

## 6. New Components to Create

| Component | App | Purpose |
|---|---|---|
| `bracket-order-entry.tsx` | web | Order type selector with conditional/algo fields |
| `strategy-position-row.tsx` | web | Expandable multi-leg position row |
| `order-book-depth.tsx` | web | Real-time bid/ask depth visualization |
| `margin-level-gauge.tsx` | web + broker-admin | Circular arc gauge for margin level |
| `risk-dashboard.tsx` | broker-admin | Full risk dashboard page |
| `bbook-strategy-form.tsx` | broker-admin | Broker B-book strategy selector + risk controls |
| `liquidation-history-table.tsx` | broker-admin | Liquidation event log |
| `circuit-breaker-status.tsx` | broker-admin | Per-symbol circuit breaker indicators |

---

## 7. Implementation Phases

### Phase W1 — Web Order Entry (Priority 1)
1. Extend `order-entry.tsx` with new order types + conditional fields
2. Update `workstation-api.ts` to call `POST /api/orders/bracket` for bracket orders
3. Add `PlaceBracketOrderDto` types to `types.ts`
4. Test: place bracket order → verify children created and linked

### Phase W2 — Web GQL Service + Orders Table
1. Add new GraphQL mutations/queries to `gql-service.ts`
2. Update `pending-orders-table.tsx` with orderRole badges and bracket groups
3. Add filter tabs (All/Bracket/GTT/Trailing/Algo)
4. Test: fetch order children via GraphQL, display correctly

### Phase W3 — Web Positions + Order Book
1. Update `positions-table.tsx` with strategy column + expandable legs
2. Enhance `depth-of-market.tsx` with real data from `/api/order-book`
3. Add `margin-level-gauge.tsx` to `account-summary-panel.tsx`
4. Test: multi-leg position displays with expandable legs

### Phase BA1 — Broker Admin Orders + Exposure
1. Update `orders/page.tsx` with type filters and orderRole column
2. Update `exposure-limits/page.tsx` with margin level gauge + alert banners
3. Wire exposure limits to real `GET /admin/risk/exposure` API
4. Test: filter orders by GTT/TWAP type, margin level shows from API

### Phase BA2 — Broker Admin Risk Dashboard
1. Create `risk-dashboard/page.tsx` — full risk monitoring page
2. Create `margin-level-gauge.tsx` shared component
3. Create `liquidation-history-table.tsx`
4. Wire to `/admin/risk/*` endpoints
5. Test: risk dashboard loads with real data, refreshes

### Phase BA3 — Broker Admin B-Book Strategy
1. Create `bbook-strategy/page.tsx`
2. Wire to `PUT /admin/broker/:id/book-strategy`
3. Test: change broker strategy → verify in backend

---

## 8. Dependencies

**Backend already built:**
- `POST /api/orders/bracket` — in `orders.controller.ts`
- `GET /api/orders/:id/children` — in `orders.controller.ts`
- `GET /api/order-book/:symbol/depth` — in `order-book.controller.ts`
- `GET /api/accounts/:id/strategy-positions` — via `StrategyPositionService`
- `GET /admin/risk/exposure` — via `RiskEngineService`
- `GET /admin/risk/thresholds` — via `RiskEngineService`
- `POST /admin/risk/thresholds` — via `RiskEngineService`
- `PUT /admin/broker/:id/book-strategy` — in `admin-bbook.controller.ts`

**Frontend existing patterns to follow:**
- Web: Apollo Client for GraphQL, `fetchJson` for REST
- Broker admin: `useOrdersApi()` hook, `api` object from `@/lib/api/endpoints`
- Design system: `@obsidian/obsidian-ui` components, dark terminal aesthetic

---

## 9. Key Design Decisions

1. **Web order entry**: Progressive disclosure for conditional/algo fields — only show what's relevant for selected type. No modal for simple orders.
2. **Bracket display**: PRIMARY/TP/SL orders shown in single expandable group. Click parent → expand children.
3. **Multi-leg positions**: Aggregate row shows strategy-level P&L; expand reveals individual legs. Consistent with existing positions-table structure.
4. **Risk dashboard**: Single page with all risk signals (margin level, exposure, VAR, Greeks, circuit breakers). Not a separate widget — gives brokers full situational awareness.
5. **B-book strategy**: Radio selector with risk control checkboxes below. Simple enough for broker ops, configurable enough for power users.

---

## 10. Out of Scope (Future Phases)

- Dealer workstation WebSocket migration (Phase 3)
- Platform owner broker-level B-book config (Phase 4)
- Support ops advanced order search (Phase 5)
- IB portal trading earnings (Phase 5)
- Developer portal API docs update (Phase 5)

---

*Last updated: 2026-05-24*