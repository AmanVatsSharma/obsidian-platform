# Obsidian Trading Platform — Full Trading Book Architecture
**Spec Version:** 1.0
**Date:** 2026-05-24
**Author:** Obsidian Architecture Team
**Status:** Draft — pending implementation

---

## 1. Overview

This spec covers a complete trading book system for the Obsidian platform — comparable in scope to MetaTrader 5 (MT5), but built on a modern NestJS microservices architecture with multi-tenant, multi-asset-class support.

The system extends the existing OMS, Risk Policy, Limits & Controls, Accounts, Market, Settlement, and Execution Gateway modules, and introduces three new modules: `order-book`, `execution-intelligence`, and `risk-engine`.

### 1.1 Design Drivers

| Driver | Decision |
|---|---|
| MT5 compatibility | All order types, bracket orders, partial fills, and hedging must mirror MT5 semantics |
| Multi-exchange | NSE India, Binance, Interactive Brokers (IBKR), custom LP — all via the existing connector framework |
| B-Book support | Broker can internalize trades; positions tracked in both A-book (exchange) and B-book (internal) modes |
| Real-time risk | Exposure tracked continuously, not just at order placement |
| Scalability | Horizontal scaling via Redis adapter on PranaStream WebSocket gateway |

### 1.2 Scope

**In scope:**
- All order types: Market, Limit, Stop, Stop-Limit, Bracket/OCO, GTT, Trailing Stop, Iceberg, TWAP, VWAP
- Real-time pre-trade, in-trade, and post-trade risk
- A-Book and B-Book position tracking
- Smart Order Routing (SOR)
- Partial fill lifecycle with remaining quantity
- Best execution scoring and slippage tracking
- Automated fill → settlement push
- Multi-leg positions (spreads, straddles)
- Realized + unrealized P&L
- Portfolio VAR and Greeks (delta, gamma)
- Auto-liquidation triggers
- Circuit breakers per symbol

**Out of scope for this spec:**
- Options greeks pricing models (Black-Scholes — future phase)
- Portfolio optimization / 알리사 (Alexa) — future phase
- Regulatory reporting beyond surveillance alerts — future phase

---

## 2. Order Model

### 2.1 Order Entity — Extended

The existing `OrderEntity` is extended with a new column and enum. No breaking changes to existing code — the new fields are nullable.

```ts
// Extended fields added to OrderEntity
@Column({ name: 'parent_order_id', type: 'uuid', nullable: true })
@Index('idx_orders_parent')   // fast lookup of bracket children
parentOrderId?: string | null;

@Column({ name: 'order_role', type: 'varchar', length: 16, nullable: true })
// 'PRIMARY' = standalone or entry leg of bracket
// 'TAKE_PROFIT' = take-profit child
// 'STOP_LOSS' = stop-loss child
orderRole?: 'PRIMARY' | 'TAKE_PROFIT' | 'STOP_LOSS' | null;

@Column({ name: 'trigger_price', type: 'numeric', precision: 28, scale: 8, nullable: true })
triggerPrice?: string | null;   // for STOP, STOP_LIMIT, GTT, conditional

@Column({ name: 'trailing_dist', type: 'numeric', precision: 28, scale: 8, nullable: true })
trailingDistance?: string | null;  // absolute trail distance for trailing stop

@Column({ name: 'trailing_pct', type: 'numeric', precision: 8, scale: 4, nullable: true })
trailingPct?: string | null;  // percentage trail (alternative to absolute)

@Column({ name: 'filled_qty', type: 'numeric', precision: 28, scale: 8, default: '0' })
filledQty!: string;  // track partial fills accurately

@Column({ name: 'remaining_qty', type: 'numeric', precision: 28, scale: 8 })
remainingQty!: string;  // = quantity - filledQty; critical for partial fills

// Extended enum for order type
type OrderTypeExtended =
  | 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT'
  | 'GTT'    | 'TRAILING_STOP'
  | 'ICEBERG' | 'TWAP'    | 'VWAP'
  | 'BRACKET';
```

**Migrating existing data:** All existing orders have `orderRole = null` and `parentOrderId = null` — they are treated as `PRIMARY`. The migration must set `filledQty = quantity` and `remainingQty = '0'` for existing `FILLED` orders so the heuristic fill path is consistent.

### 2.2 Order Status FSM

```
NEW ──► PLACED ──► PARTIALLY_FILLED ──► FILLED
  │         │              │
  │         ▼              ▼
  │     REJECTED       CANCELLED
  │
  ▼
EXPIRED        (GTT / GTC / day-end expiry)
```

### 2.3 Bracket Order Flow

Bracket orders are placed as a **single API call** with an entry order plus child TP/SL orders. The ORM creates all three orders atomically in one transaction.

```
POST /orders/bracket
{
  "accountId": "...",
  "instrumentId": "NSE:RELIANCE",
  "side": "BUY",
  "type": "LIMIT",
  "quantity": "100",
  "price": "2500",
  "bracket": {
    "takeProfitPrice": "2600",
    "stopLossPrice": "2450",
    "trailingStop": null    // OR { distance: "20" } or { pct: "2" }
  }
}
```

All three orders (`PRIMARY`, `TAKE_PROFIT`, `STOP_LOSS`) are created in the same DB transaction with the same `clientOrderId` prefix.

**Bracket activation:** When the PRIMARY order is filled (or partially filled with remaining qty 0), the bracket children are activated — their status transitions from `NEW` → `PLACED` and they are submitted to the exchange. Activation happens in `OrderService.addExecution()` when `remainingQty === '0'` for the entry.

**Child cancellation on parent cancel:** If the PRIMARY is cancelled before fill, all `NEW` children are cancelled in the same transaction.

### 2.4 Conditional / GTT Orders

GTT orders remain in `NEW` status until the trigger condition is met. A background `ConditionalOrderWorker` polls instruments for price crosses.

- **GTT:** `triggerPrice` + `triggerCondition` (`ABOVE` | `BELOW`) stored on the order
- **Trailing Stop:** `trailingDistance` or `trailingPct` recalculated on every price tick
- **Execution:** When triggered, GTT converts to LIMIT and is submitted to exchange

`★ Insight ─────────────────────────────────────`
**MT5-compatible bracket semantics:** MT5 treats bracket children as "linked" via parent ID. When the entry fills, MT5 immediately activates the SL/TP as dependent orders. Our `orderRole` + `parentOrderId` model matches this exactly. The key difference from some systems: SL/TP prices are set at order placement time (not dynamically computed), which is how MT5, Interactive Brokers, and most retail platforms work.
`─────────────────────────────────────────────────`

---

## 3. Multi-Leg Position Model

### 3.1 Why the current model breaks for spreads

Today, `PositionsService` aggregates `position_ledger_entries` by `instrumentId` only:

```sql
SELECT instrument_id, SUM(quantity_delta) ... GROUP BY instrument_id
```

This works for single-leg equity trades. It **breaks for spreads**: a NIFTY 18500 PE short + NIFTY 18500 CE long is two separate `instrumentId` entries, but they are one strategy with a single net Greeks. It also can't compute realized P&L correctly when legs are closed in isolation.

### 3.2 New Entity: StrategyPosition

```ts
@Entity('strategy_positions')
@Index('idx_strat_tenant_account_created', ['tenantId', 'accountId', 'createdAt'])
export class StrategyPositionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'account_id' })
  accountId!: string;

  // 'SINGLE' = single-instrument position (backward-compatible)
  // 'SPREAD' | 'STRADDLE' | 'STRANGLE' | 'BUTTERFLY' | 'IRON_CONDOR' | 'CUSTOM'
  strategyType!: 'SINGLE' | 'SPREAD' | 'STRADDLE' | 'STRANGLE' | 'BUTTERFLY' | 'IRON_CONDOR' | 'CUSTOM';

  // For SINGLE positions, instrumentId is set; for multi-leg, it is null
  @Column({ name: 'instrument_id', nullable: true })
  instrumentId?: string | null;

  @Column({ name: 'net_quantity', type: 'numeric', precision: 28, scale: 8 })
  netQuantity!: string;

  @Column({ name: 'average_price', type: 'numeric', precision: 28, scale: 8 })
  averagePrice!: string;  // cost-basis average

  @Column({ name: 'realized_pnl', type: 'numeric', precision: 28, scale: 8, default: '0' })
  realizedPnl!: string;

  @Column({ name: 'unrealized_pnl', type: 'numeric', precision: 28, scale: 8, default: '0' })
  unrealizedPnl!: string;

  @Column({ name: 'delta', type: 'numeric', precision: 28, scale: 8, default: '0' })
  delta!: string;

  @Column({ name: 'gamma', type: 'numeric', precision: 28, scale: 8, default: '0' })
  gamma!: string;

  @Column({ name: 'book_type', type: 'varchar', length: 8, default: 'A' })
  // 'A' = A-book (exchange-traded), 'B' = B-book (internalized)
  bookType!: 'A' | 'B';

  @Column({ name: 'meta', type: 'jsonb', nullable: true })
  meta?: Record<string, unknown>;
}
```

### 3.3 Multi-Leg Position Calculation

When an execution is posted:
1. **Detect if it's a multi-leg order** — check if `order.parentOrderId` or `order.orderRole` is set and the strategy type can be inferred
2. **Compute or update strategy position** — upsert into `StrategyPositionEntity`
3. **Cost-basis tracking** — FIFO (First-In, First-Out) realized P&L; remaining position uses weighted average cost

For A-book vs. B-book:
- A-book positions are forwarded to the exchange connector
- B-book positions are internalized — the broker takes the other side, and the position lives in `strategy_positions` with `bookType = 'B'`
- B-book P&L is the spread between client fill price and broker's internal price

`★ Insight ─────────────────────────────────────`
**B-Book vs A-Book architecture:** When a broker uses B-book (internalization), the broker is the counterparty to every client trade. This means:
- Client's profit is broker's loss and vice versa — a potential conflict of interest
- The broker can hedge B-book positions in aggregate (net exposure) via the exchange
- Regulatory requirements (MiFID II, SEBI) often require best execution evidence and transparency

The `bookType` column enables a compliance audit trail: every position knows whether it was A-booked or B-booked, and at what notional.
`─────────────────────────────────────────────────`

---

## 4. Risk Engine (New Module)

### 4.1 Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        RISK ENGINE MODULE                            │
│                                                                      │
│  RiskEngineService                                                   │
│  ├── PreTradeRiskValidator      — buying power, margin, limits      │
│  ├── RealTimeExposureTracker    — live position + exposure monitoring│
│  ├── MarginAlertWorker          — background: margin breach warning  │
│  ├── AutoLiquidationWorker      — background: forced position close  │
│  ├── CircuitBreakerService      — volatility HBL (High, Low) per sym │
│  └── GreeksCalculator           — delta/gamma per position/portfolio  │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Pre-Trade Risk (extends existing)

Existing `riskPolicy.enforcePreTrade()` and `limitsControls.enforcePreTrade()` are called by `OrderService` at placement. The new Risk Engine adds:

```ts
// Extended check — adds buying power sufficiency check
async validateOrderPlacement(order: OrderEntity): Promise<PreTradeResult> {
  const buyingPower = await this.accountsService.getBuyingPower(accountId);
  const required = marginEstimate.totalRequired;
  if (required > buyingPower) {
    return { allowed: false, reason: 'INSUFFICIENT_BUYING_POWER', shortfall: required - buyingPower };
  }
  // ... existing policy + limits checks
}
```

### 4.3 Real-Time Exposure Tracking

Exposure is updated after every execution via an event subscriber on `OrderEventsService`:

```ts
// Called after every execution.added event
onExecutionAdded(event: OrderExecutionEvent) {
  const exposure = this.computeExposure(event.accountId, event.instrumentId);
  this.exposureCache.set(`${event.tenantId}:${event.accountId}:${event.instrumentId}`, exposure);
  this.checkThresholds(exposure);  // alert if near limit
}
```

Exposure values are cached in Redis (TTL: 5 seconds, invalidated on write). This avoids a DB query on every order check.

### 4.4 Greeks Calculation

```
Delta = ∂V/∂S  (position price sensitivity)
Gamma = ∂²V/∂S²  (delta change per price move)
```

For **equities/F&O** in the Indian market:
- Delta = `netQuantity × lotSize × multiplier` (for options: delta from Black-Scholes or broker quote)
- Gamma = numerical approximation via finite difference on delta

For **FX/CFD**: delta is `notional × contractSize × tickValue / tickSize`.

For **crypto**: delta is `notional / currentPrice`.

Greeks are computed asynchronously after every execution and stored in `StrategyPositionEntity.delta / gamma`.

### 4.5 Auto-Liquidation Triggers

```
Margin Level = (Equity / Used Margin) × 100

Margin Level  > 150%  → OK
Margin Level  100–150% → MARGIN CALL (alert only, don't liquidate)
Margin Level  75–100%  → WARNING (account frozen for new orders, liquidate optional)
Margin Level  < 75%   → FORCE LIQUIDATE (cascade: biggest loss position first)
Margin Level  < 50%   → LIQUIDATE ALL
```

The `AutoLiquidationWorker` runs every 30 seconds, recomputes margin levels for all accounts with open positions, and issues liquidation orders via `OrderService` if thresholds are breached.

Liquidation uses a **market order** against the exchange connector, regardless of B/A-book status (even B-book positions are closed at market).

`★ Insight ─────────────────────────────────────`
**MT5 liquidation order types:** MT5 supports "Close by" (close one position against another for hedged accounts) and "Close all" (market liquidation). Our `AutoLiquidationWorker` maps to the "Close all" behavior — positions are closed in order of largest unrealized loss first (minimizes the positions most likely to worsen the margin deficit).
`─────────────────────────────────────────────────`

### 4.6 Circuit Breakers

Per-symbol circuit breakers prevent runaway moves:

```
Upper Circuit  = previous_close × (1 + daily_limit_pct)
Lower Circuit  = previous_close × (1 - daily_limit_pct)

daily_limit_pct:  EQUITY=20%, F&O=5%, FX=1%, CRYPTO=30% (configurable per exchange)
```

When a market data tick breaches the circuit limit, no new BUY orders are accepted (for upper circuit) or SELL orders (for lower circuit). This is checked in `riskPolicy.enforcePreTrade()` before the order reaches the exchange.

---

## 5. Execution Gateway v2 — Smart Order Routing

### 5.1 SOR Architecture

The existing `ExecutionGatewayService.resolveFamilyByInstrument()` routes to a connector family. The new SOR layer sits **above** the connector and selects between venues within the same asset class.

```ts
// New SOR service in execution-gateway module
class SmartOrderRouter {
  async route(order: OrderEntity): Promise<SORResponse> {
    const venues = await this.getVenues(order.connectorFamily);
    const ranked = venues
      .map(v => this.scoreVenue(v, order))
      .sort((a, b) => b.score - a.score);

    // Try venues in order; use first one that fills
    for (const venue of ranked) {
      const result = await this.tryVenue(venue, order);
      if (result.status === 'FILLED' || result.status === 'PARTIALLY_FILLED') {
        return { venue: venue.id, result, slippage: this.computeSlippage(result) };
      }
    }
    // Fallback: last venue (market)
    return this.tryVenue(ranked[ranked.length - 1], order);
  }
}
```

**Venue scoring factors:**
| Factor | Weight | Description |
|---|---|---|
| Liquidity depth | 40% | Available volume at or near order price |
| Execution latency | 25% | Historical fill latency from this venue |
| Spread | 20% | Bid-ask spread at time of routing |
| Fee | 15% | Exchange fee + broker commission |

For **NSE India:** primary venue = NSE; for **IBKR:** venues = NASDAQ, NYSE, ARCA, etc.

### 5.2 Iceberg / TWAP / VWAP — Child Order Generation

Algo orders (Iceberg, TWAP, VWAP) generate child limit orders via a background `AlgoOrderWorker`:

```
ICEBERG order: 10000 shares, visible 1000
  → Child 1: 1000 shares @ limit price → FILLED
  → Child 2: 1000 shares @ limit price → FILLED
  → ... (9 more children until remainingQty = 0)

TWAP order: 50000 shares, 50 slices over 5 hours (6 min/slice)
  → Child 1: 1000 shares @ market → placed every 6 min
  → Child 2: 1000 shares @ market → ...
  → Slices continue even if previous slice not yet filled

VWAP order: benchmarked to volume curve
  → Slice size = (target_share × total_volume_at_time) - filled_so_far
  → Re-balanced every 1 minute
```

Child orders are created as separate `OrderEntity` rows with `parentOrderId` set to the parent algo order. The parent tracks total `filledQty / remainingQty` from all children.

`★ Insight ─────────────────────────────────────`
**Child order lifecycle:** The parent algo order (`ICEBERG`/`TWAP`/`VWAP`) stays in `PARTIALLY_FILLED` until all children are done. When the last child fills, the parent transitions to `FILLED`. If any child is rejected or cancelled, the parent remains `PARTIALLY_FILLED` and retries the remaining slice. Parent cancellation cancels all active children.
`─────────────────────────────────────────────────`

### 5.3 Best Execution & Slippage Tracking

For every execution, record actual fill price vs. order price:

```ts
const slippage = (fillPrice - orderPrice) / orderPrice * 100;
await this.executionRepo.update(execution.id, {
  slippageBps: (slippage * 10000).toFixed(2),  // basis points
  venueId: execution.meta?.venueId,
  latencyMs: execution.meta?.latencyMs,
});
```

Best execution score per venue per instrument is aggregated daily:

```
VenueExecutionScore = avg(slippageBps) × weight + fillRate × weight + latency × weight
```

---

## 6. B-Book Architecture

### 6.1 What makes it B-Book

A trade is B-booked when:
1. The broker has a B-book agreement with the client (configured in broker hierarchy)
2. The instrument is eligible for B-book (configured per exchange/segment)
3. The order can be filled internally (sufficient broker liquidity)

B-book eligibility is stored in `BrokerExchangeConfigEntity`:

```ts
// Extension to broker-exchange-config
bookTypeStrategy: 'A_ONLY' | 'B_PREFERRED' | 'B_REQUIRED';
maxBBookNotional: string;  // max notional before forced A-book
```

### 6.2 B-Book Fill Flow

```
OrderService.place()
  → RiskEngine.validateOrderPlacement()    ← includes B-book check
  → IF B-book eligible AND broker has liquidity:
       → BBookFillService.fill(order)      ← internal fill, no exchange call
       → Post to position_ledger with bookType='B'
       → Update broker's internal P&L
  → ELSE:
       → OmsExecutionGatewayAdapter.placeOrder()  ← A-book, real exchange
```

B-book prices are determined by:
- For **FX/CFD**: broker's bid/ask spread (wider than interbank by broker markup)
- For **Equities/F&O**: last traded price or midpoint

### 6.3 B-Book Hedging

B-book positions create net exposure for the broker. The broker can hedge this exposure:
- **Automatic hedging**: when net B-book position exceeds `maxBBookNotional`, an offsetting A-book order is placed
- **Manual hedging**: broker admin panel shows net B-book positions with a "Hedge" button

Net B-book exposure is computed daily:

```sql
SELECT SUM(net_quantity * current_price)
FROM strategy_positions
WHERE tenant_id = :brokerId AND book_type = 'B'
GROUP BY instrument_id
```

---

## 7. Settlement — Automated Fill-to-Job Push

### 7.1 Current Gap

Today, `addExecution()` posts to the ledger but doesn't create a settlement job. Settlement jobs are created manually or by an external process.

### 7.2 New Flow

After every execution is persisted:

```ts
// In OrderService.addExecution() — after successful execution insert
await this.outboxService.append('settlement.job.create', {
  executionId: saved.id,
  accountId: dto.accountId,
  instrumentId: dto.instrumentId,
  quantity: dto.quantity,
  price: dto.price,
  fees: dto.fees,
  tradeDate: new Date().toISOString().slice(0, 10),
  segment: inferSegment(dto.instrumentId),  // EQUITY, FNO, FOREX, CRYPTO
}, ctx.tenantId);
```

The `OutboxWorker` picks up the message and creates a `SettlementJobEntity`. This is transactional: if the execution insert rolls back, the outbox message is also rolled back.

### 7.3 T+N Settlement Calculation

Uses the existing `SettlementService.getSettlementDate()`:

```ts
const settlementDate = SettlementService.getSettlementDate(
  new Date(),          // trade date
  segment as Segment   // CRYPTO=T+0, FOREX=T+1, EQUITY=T+2
);
```

---

## 8. Order Book Module (New)

### 8.1 Purpose

The order book module manages **price-level depth** for instruments. It receives market data feeds from connectors and maintains an in-memory bid/ask ladder. It serves:

1. **SOR** — checks venue liquidity before routing
2. **Risk controls** — circuit breaker checks against book depth
3. **Market data API** — REST endpoint for top-of-book and depth
4. **WebSocket** — PranaStream pushes order book ticks to subscribed clients

### 8.2 Data Structure

```ts
type OrderBookLevel = { price: string; qty: string; orders: number };

type OrderBook = {
  exchange: string;
  symbol: string;
  bids: OrderBookLevel[];  // sorted DESC by price
  asks: OrderBookLevel[];  // sorted ASC by price
  ts: number;
};

class OrderBookService {
  // In-memory per instance: Map<string, OrderBook>
  // Redis-backed for horizontal scaling
  private books = new Map<string, OrderBook>();

  updateBook(exchange: string, symbol: string, bids: OrderBookLevel[], asks: OrderBookLevel[]) {
    const key = `${exchange}:${symbol}`;
    this.books.set(key, { exchange, symbol, bids, asks, ts: Date.now() });
    this.realtime.publishOrderBook(key, this.books.get(key));
  }

  getDepth(key: string, levels = 5): { bids: OrderBookLevel[]; asks: OrderBookLevel[] } {
    const book = this.books.get(key);
    if (!book) return { bids: [], asks: [] };
    return {
      bids: book.bids.slice(0, levels),
      asks: book.asks.slice(0, levels),
    };
  }
}
```

---

## 9. Module Architecture Summary

```
apps/backend/src/modules/
├── oms/                          [EXTEND]
│   ├── entities/order.entity.ts  ← add: parentOrderId, orderRole, triggerPrice, trailingDist, trailingPct, filledQty, remainingQty
│   ├── services/order.service.ts  ← bracket creation, algo child spawning, B-book routing
│   ├── services/algo-worker.ts     [NEW] — TWAP/VWAP/Iceberg child generation
│   ├── services/conditional-worker.ts [NEW] — GTT/Trailing trigger checking
│   └── positions/                 [EXTEND] — StrategyPosition entity + multi-leg computation
│
├── order-book/                   [NEW — scoped under oms or standalone]
│   ├── order-book.service.ts
│   ├── order-book.controller.ts
│   └── entities/order-book.entity.ts  — for persistence (optional; can be in-memory)
│
├── execution-intelligence/       [NEW]
│   ├── smart-order-router.ts
│   ├── venue-scorer.ts
│   ├── slippage-tracker.ts
│   └── execution-gateway.module.ts — merges into existing execution-gateway
│
├── risk-engine/                  [NEW — standalone module]
│   ├── risk-engine.service.ts    — orchestrates all risk services
│   ├── pre-trade-validator.ts
│   ├── real-time-exposure.ts
│   ├── greeks-calculator.ts
│   ├── auto-liquidation-worker.ts
│   ├── margin-alert-worker.ts
│   ├── circuit-breaker.ts
│   └── risk-engine.module.ts
│
├── settlement/                   [EXTEND]
│   └── settlement.service.ts     ← outbox listener → auto job creation
│
├── accounts/                     [EXTEND]
│   ├── services/balances.service.ts ← buying power + margin level computation
│   └── entities/strategy-position.entity.ts [NEW]
│
├── execution-gateway/            [EXTEND]
│   ├── connectors/ibkr/          [NEW] — Interactive Brokers connector
│   └── connectors/binance/      [NEW] — Binance connector
│
└── realtime/                    [EXTEND]
    └── prana-stream/             ← add order book frames to PranaStream gateway
```

---

## 10. Database Migrations

### Migration 1: Orders Extended (Zero downtime)

```sql
-- Phase 1: Add nullable columns
ALTER TABLE orders
  ADD COLUMN parent_order_id uuid NULL,
  ADD COLUMN order_role varchar(16) NULL,
  ADD COLUMN trigger_price numeric(28,8) NULL,
  ADD COLUMN trailing_dist numeric(28,8) NULL,
  ADD COLUMN trailing_pct numeric(8,4) NULL,
  ADD COLUMN filled_qty numeric(28,8) NOT NULL DEFAULT '0',
  ADD COLUMN remaining_qty numeric(28,8) NOT NULL;

CREATE INDEX idx_orders_parent ON orders(parent_order_id) WHERE parent_order_id IS NOT NULL;
CREATE INDEX idx_orders_role ON orders(order_role) WHERE order_role IS NOT NULL;
```

**Backfill:** For existing FILLED orders, `filled_qty = quantity` and `remaining_qty = '0'`. For PLACED/NEW: `filled_qty = '0'`, `remaining_qty = quantity`.

### Migration 2: Strategy Positions

```sql
CREATE TABLE strategy_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id varchar(64) NOT NULL,
  account_id uuid NOT NULL,
  instrument_id uuid NULL,   -- null for multi-leg strategies
  strategy_type varchar(24) NOT NULL DEFAULT 'SINGLE',
  net_quantity numeric(28,8) NOT NULL DEFAULT '0',
  average_price numeric(28,8) NOT NULL DEFAULT '0',
  realized_pnl numeric(28,8) NOT NULL DEFAULT '0',
  unrealized_pnl numeric(28,8) NOT NULL DEFAULT '0',
  delta numeric(28,8) NOT NULL DEFAULT '0',
  gamma numeric(28,8) NOT NULL DEFAULT '0',
  book_type varchar(8) NOT NULL DEFAULT 'A',
  meta jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_strat_tenant_account ON strategy_positions(tenant_id, account_id);
CREATE INDEX idx_strat_instrument ON strategy_positions(instrument_id) WHERE instrument_id IS NOT NULL;
```

---

## 11. API Surface

### New Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/orders/bracket` | Place bracket/OCO order |
| `POST` | `/orders/conditional` | Place GTT or conditional order |
| `GET` | `/orders/:id/children` | List bracket child orders |
| `GET` | `/risk/exposure` | Real-time exposure per instrument |
| `GET` | `/risk/dashboard/portfolio` | Full portfolio risk view (VAR, Greeks) |
| `GET` | `/risk/margin-level/:accountId` | Current margin level for account |
| `POST` | `/risk/liquidate/:accountId` | Trigger manual liquidation |
| `GET` | `/order-book/:exchange/:symbol` | Top-of-book + depth |
| `GET` | `/executions/:id/slippage` | Slippage report for an execution |
| `GET` | `/positions/strategies` | Multi-leg strategy positions |

---

## 12. Implementation Phases

### Phase 1 — Foundation (Order Model + Bracket)
- Order entity migration (all nullable columns)
- `PlaceBracketOrderDto` + `OrderService.placeBracket()`
- Bracket activation on entry fill
- Child cancellation on parent cancel
- Unit tests for bracket lifecycle

### Phase 2 — Order Types + Conditional
- Conditional/GTT DTO + worker (`ConditionalOrderWorker`)
- Trailing stop worker
- Iceberg/TWAP/VWAP DTOs + `AlgoOrderWorker`
- Child order lifecycle management

### Phase 3 — Multi-Leg + P&L
- StrategyPositionEntity migration
- `StrategyPositionService` (FIFO realized P&L)
- B-book fill path in `OrderService`
- Multi-leg aggregation in `PositionsService`

### Phase 4 — Risk Engine
- `risk-engine` module scaffold
- Real-time exposure tracking
- Greeks calculator
- `AutoLiquidationWorker`
- `CircuitBreakerService`

### Phase 5 — SOR + Execution Intelligence
- `SmartOrderRouter` in execution-gateway
- Venue scoring + slippage tracking
- IBKR + Binance connectors
- Best execution reporting

### Phase 6 — Settlement + Order Book
- Outbox → settlement job push
- OrderBookService + order book frames
- PranaStream order book subscriptions

---

## 13. Key Invariants

| Invariant | Enforcement |
|---|---|
| `remainingQty = quantity - filledQty` | Computed on every fill, checked in service |
| Bracket children inherit `tenantId`, `accountId` from parent | Enforced in `placeBracket()` |
| SL price < entry price for BUY, SL price > entry price for SELL | DTO validation |
| TP price > entry price for BUY, TP price < entry price for SELL | DTO validation |
| B-book fills never call exchange connector | Branch on `bookTypeStrategy` in `OrderService` |
| Circuit breaker check runs before every order | `riskPolicy.enforcePreTrade()` checks circuit state |
| All risk writes go through `pg_advisory_xact_lock` | Inherited from `LedgerService` pattern |

---

## 14. Testing Strategy

| Layer | Test | Runner |
|---|---|---|
| Order FSM | `order.service.spec.ts` — bracket lifecycle unit tests | `nx test backend` |
| Conditional orders | `conditional-worker.spec.ts` — trigger logic | `nx test backend` |
| Multi-leg P&L | `strategy-position.service.spec.ts` — FIFO realized P&L | `nx test backend` |
| Risk engine | `risk-engine.service.spec.ts` — auto-liquidation thresholds | `nx test backend` |
| SOR | `smart-order-router.spec.ts` — venue selection | `nx test backend` |
| Connector contracts | `*.contract.spec.ts` (existing) — extend for IBKR, Binance | `npm run test:contracts` |
| E2E | `oms.flow.e2e.spec.ts` — full bracket → fill → P&L flow | `npm run e2e` |

---

*Last updated: 2026-05-24*