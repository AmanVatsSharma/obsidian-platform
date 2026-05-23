# Web App → Backend: Full GraphQL Migration for Trading Data

**Date:** 2026-05-23
**Status:** Draft — awaiting user approval
**Scope:** `apps/web` (Next.js 15) ↔ `apps/backend` (NestJS) — trading data only; auth remains REST

---

## 1. What we're building and why

Migrate the `apps/web` trading terminal from hybrid REST+GraphQL to **GraphQL-only for all trading data** (orders, positions, account balance). Auth (OTP, login, refresh) stays on REST — it's working correctly and REST is the better fit for session-management flows.

**Why GraphQL for trading data:**
- Apollo's normalized cache covers both reads and writes uniformly — one mental model
- Order status can be co-located with the order object in cache, updated via `cache.modify`
- Subscriptions on top of GraphQL give real-time fills without polling
- Schema is the single source of truth for the contract between web and backend

**Why auth stays REST:**
- OTP flow is a multi-step stateful exchange (request → verify → session cookie) — REST is the natural fit
- Refresh token rotation is a session management concern, not a data query concern
- Large file upload (profile pictures) is better served by REST

---

## 2. Architecture — what changes

### Before (hybrid)

```
web app
  ├─ fetch('/api/orders')          ─── REST ──→ NestJS OrdersController
  ├─ fetch('/api/positions')       ─── REST ──→ NestJS PositionsController
  ├─ fetch('/api/accounts/...')   ─── REST ──→ NestJS AccountsController
  ├─ Apollo (queries/mutations)    ─── GraphQL ──→ NestJS GraphQL (oms, market, accounts)
  └─ Auth: fetch('/auth/...')      ─── REST ──→ NestJS AuthController (unchanged)
```

### After (GraphQL-only for trading data)

```
web app
  ├─ Apollo Client (all trading data)
  │     ├─ queries: orders, positions, accountBalance, instruments, watchlists
  │     ├─ mutations: placeOrder, cancelOrder, modifyOrder
  │     └─ subscriptions: orderStatusChanged, positionUpdated (via PranaStream)
  └─ Auth: fetch('/auth/...')  ─── REST ──→ NestJS AuthController (unchanged)
```

**No REST proxy rewrite for `/api/orders`, `/api/positions`, `/api/accounts`** — those routes can be deprecated once migration is verified. The Next.js rewrite config stays intact for any edge cases.

---

## 3. What needs to change — by layer

### 3.1 Backend: `apps/backend/src/modules/oms/`

**`oms.resolver.ts` — already correct, no changes needed**

```typescript
@Mutation(() => OrderEntity)
@Permissions('oms:write')
async placeOrder(@Args('input') dto: PlaceOrderDto): Promise<OrderEntity> {
  // already delegates to OrderService.place()
}
```

**`oms.service.ts` — add `PlaceOrderResult` error union**

The resolver must be able to return an error union without throwing. Two approaches:
- (Preferred) Create `PlaceOrderResult` union in schema: `union PlaceOrderResult = OrderEntity | OrderRejectionError`
- Resolver checks service result; if rejection, returns `OrderRejectionError` type

**`oms.resolver.ts` — add WebSocket subscription for order events**

```typescript
@Subscription(() => OrderEntity, { filter: payload => payload.tenantId === ctx.tenantId })
@UseGuards(JwtAuthGuard, TenantGuard)
orderStatusChanged(@Context() ctx) {
  return this.pubSub.asyncIterator('ORDER_STATUS_CHANGED');
}
```

**PranaStream emits order events** via `OutboxWorkerSkeleton` publishing to a topic that PranaStream consumes. The subscription resolver returns a `PubSub` async iterator — no extra infrastructure needed if Kafka/SNS is already wired.

### 3.2 Backend: `apps/backend/src/modules/accounts/`

**Add GraphQL resolvers for positions and account balance**

Currently `accounts.resolver.ts` has `accountBalance` query but not `positions`. Add:

```typescript
@Query(() => [PositionEntity])
@Permissions('oms:read')
async positions(
  @Args('accountId') accountId: string,
  @Context() ctx: GqlContext,
): Promise<PositionEntity[]> {
  return this.positionService.findByAccount(accountId, ctx.tenantId);
}
```

### 3.3 Backend: `apps/backend/src/modules/realtime/prana-stream/`

**Emit order events on status change**

In `OrderService`, after any status transition (NEW → PLACED → FILLED → CANCELLED), publish to PubSub:

```typescript
await this.pubSub.publish('ORDER_STATUS_CHANGED', { orderStatusChanged: orderEntity });
```

This feeds the GraphQL subscription without changing the existing PranaStream WebSocket surface — the subscription runs over the same GraphQL WebSocket transport.

### 3.4 Web app: `apps/web/gql/` — restructure operations

Current: `gql/operations/oms/placeOrder.gql` exists but is not used (bypassed by REST).

New structure:

```
gql/
  operations/
    oms/
      placeOrder.gql         ← mutation (update variables to use correct PlaceOrderDto input)
      cancelOrder.gql        ← mutation
      modifyOrder.gql        ← mutation
      orders.gql             ← query (replace REST /api/orders)
      orderSubscription.gql  ← subscription
    positions/
      positions.gql          ← query (replace REST /api/positions)
      positionSubscription.gql
    accounts/
      accountBalance.gql     ← query (replace REST /api/accounts/:id/balance)
      accountSummary.gql     ← query (account details)
    market/
      instruments.gql         ← already GraphQL, keep as-is
      watchlists.gql          ← already GraphQL, keep as-is
  client/
    apollo-client.ts         ← already exists, no structural change needed
    auth-link.ts             ← already exists (Bearer from httpOnly cookie)
    error-link.ts            ← already exists (401→redirect, etc.)
    apollo-provider.tsx      ← already exists
  fragments/
    order-fragment.gql       ← reusable order fields across queries + subscription
    position-fragment.gql
```

### 3.5 Web app: `apps/web/features/trading-terminal/`

**`trading-workstation.tsx` — fix missing `externalRefId` before migration**

Currently sends no `externalRefId` on order submission. Must add:

```typescript
const body = {
  accountId,
  instrumentId,
  side,
  type: apiType,
  quantity: (parseFloat(uiOrder.lots) || 0).toFixed(2),
  ...(price ? { price } : {}),
  timeInForce: 'DAY',
  clientOrderId: `web-${nanoid(10)}`,
  externalRefId: `ext-${nanoid(12)}`,  // ← ADD THIS — required by GraphQL schema
};
```

**`trading-workstation.tsx` — replace REST call with GraphQL mutation**

Current:
```typescript
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'acme' },
  body: JSON.stringify(body),
});
const data = await response.json();
// handle via status check
```

Replace with Apollo mutation using the existing `useGqlPlaceOrder` hook pattern:

```typescript
const [placeOrderMutation] = useMutation(PLACE_ORDER_MUTATION, {
  refetchQueries: [{ query: ORDERS_QUERY, variables: { accountId } }],
  onCompleted: (data) => {
    const result = data.placeOrder;
    if (result.__typename === 'OrderRejectionError') {
      showErrorToast(result.message);
    } else {
      showSuccessToast(`Order placed: ${result.clientOrderId}`);
    }
  },
});
```

**`lib/workstation-api.ts` — `submitOrderToOms()`**
- Keep function signature; change internal implementation from `fetch('/api/orders')` to Apollo `useMutation`
- Export a hook (`useOrderSubmission`) that wraps the mutation with loading/error state
- This keeps the API surface stable while the transport changes underneath

**`lib/gql-service.ts` — `useGqlPlaceOrder` hook**
- Remove the `fetchJson` REST delegation entirely
- Wire directly to the `PLACE_ORDER_MUTATION` GraphQL operation
- Handle error union via `__typename` check in `onCompleted`

### 3.6 Web app: remove REST API calls

| File | Remove/Replace |
|---|---|
| `apps/web/lib/api/client.ts` | Remove `getOrders()`, `getPositions()`, `getAccountBalance()` |
| `apps/web/lib/api/orders.ts` | Delete entirely |
| `apps/web/lib/api/positions.ts` | Delete entirely |
| `apps/web/next.config.js` | Remove rewrites for `/api/orders`, `/api/positions` (keep `/auth/*` and `/graphql`) |

---

## 4. Data flow — order lifecycle

```
User clicks "Buy"
  → trading-workstation.tsx: validate form
  → placeOrderMutation({ variables: { input: { accountId, instrumentId, side, ... } } })
    → Apollo Client → POST /graphql (via Next.js rewrite)
      → OmsResolver.placeOrder(PlaceOrderDto)
        → OrderService.place(dto)  [transaction + idempotency check on externalRefId]
          → INSERT order + INSERT outbox event [same DB transaction]
            → Kafka publish (async via OutboxWorker)
              → PranaStream: emit ORDER_STATUS_CHANGED event
        ← OrderEntity returned → OmsResolver
      ← OrderEntity serialized as GraphQL response
    ← Apollo cache updated (refetchQueries OR cache.modify)
  → onCompleted: check __typename
    → 'OrderEntity' → show success toast + update order list in UI
    → 'OrderRejectionError' → show error toast
```

---

## 5. Error handling — typed error union

### Schema change

```graphql
union PlaceOrderResult = OrderEntity | OrderRejectionError

type OrderRejectionError {
  code: String!           # e.g. 'INSUFFICIENT_BUYING_POWER', 'INVALID_INSTRUMENT'
  message: String!
  externalRefId: String!
}

type OrderEntity {
  id: ID!
  clientOrderId: String!
  status: String!
  # ... all existing fields
}
```

### Resolver change

```typescript
@Mutation(() => PlaceOrderResult)
@Permissions('oms:write')
async placeOrder(@Args('input') dto: PlaceOrderDto): Promise<PlaceOrderResult> {
  const result = await this.orderService.place(dto);
  if (result.rejected) {
    return new OrderRejectionError(result.code, result.message, result.externalRefId);
  }
  return result.order;
}
```

### Web app handling

```typescript
onCompleted: (data) => {
  const result = data.placeOrder;
  if (result.__typename === 'OrderRejectionError') {
    analytics.track('order_rejected', { code: result.code, message: result.message });
    showErrorToast(result.message);
    return;
  }
  // success — OrderEntity
  showSuccessToast(`Order placed: ${result.clientOrderId}`);
}
```

Apollo `ErrorLink` does NOT catch this as an error — it's a successful HTTP response with a typed rejection in the body. The `onCompleted` handler is the right place to deal with it.

---

## 6. Apollo cache strategy

### Write-through invalidation (no subscriptions yet)

For Phase 1 (without PranaStream subscriptions):

```typescript
const [placeOrderMutation] = useMutation(PLACE_ORDER_MUTATION, {
  refetchQueries: [
    { query: ORDERS_QUERY, variables: { accountId } },
    { query: POSITIONS_QUERY, variables: { accountId } },
    { query: ACCOUNT_BALANCE_QUERY, variables: { accountId } },
  ],
  awaitRefetchQueries: true,
});
```

After `placeOrder` completes, Apollo automatically refetches order list + positions + balance. This is the safest approach — correctness over optimization.

### Phase 2: Real-time via GraphQL subscriptions

After PranaStream emits order events, add:

```typescript
const { data: orderEvent } = useSubscription(ORDER_SUBSCRIPTION, {
  variables: { accountId },
});

useEffect(() => {
  if (orderEvent?.orderStatusChanged) {
    cache.modify({
      id: cache.identify({ __typename: 'OrderEntity', id: orderEvent.orderStatusChanged.id }),
      fields: { status: () => orderEvent.orderStatusChanged.status },
    });
  }
}, [orderEvent]);
```

Apollo's `inMemoryCache` with `keyFields` on `OrderEntity` makes this clean. No refetch needed — cache is updated in-place.

---

## 7. File inventory

### New files (web)

```
apps/web/gql/
  operations/
    oms/
      orders.gql
      orderSubscription.gql
      cancelOrder.gql
      modifyOrder.gql
    positions/
      positions.gql
      positionSubscription.gql
    accounts/
      accountSummary.gql
  fragments/
    order-fragment.gql
    position-fragment.gql
  hooks/
    usePlaceOrder.ts      ← Apollo mutation hook with error union handling
    useOrders.ts          ← Apollo query hook
    usePositions.ts
    useAccountSummary.ts
```

### Modified files (web)

| File | Change |
|---|---|
| `apps/web/features/trading-terminal/components/trading-workstation.tsx` | Add `externalRefId`, replace `fetch` with `usePlaceOrder` hook |
| `apps/web/features/trading-terminal/lib/workstation-api.ts` | Replace REST call with Apollo mutation |
| `apps/web/features/trading-terminal/lib/gql-service.ts` | Remove REST delegation from `useGqlPlaceOrder` |
| `apps/web/lib/api/client.ts` | Remove trading-data endpoints |
| `apps/web/lib/api/orders.ts` | Delete |
| `apps/web/lib/api/positions.ts` | Delete |
| `apps/web/next.config.js` | Remove `/api/orders`, `/api/positions` rewrites |
| `apps/web/gql/operations/oms/placeOrder.gql` | Fix `PlaceOrderInput` → `PlaceOrderDto`, add `externalRefId` |
| `apps/web/gql/operations/oms/orders.gql` | New — query order list |
| `apps/web/codegen.ts` | Run `graphql-codegen` to generate TypeScript types |

### Modified files (backend)

| File | Change |
|---|---|
| `apps/backend/src/modules/oms/oms.resolver.ts` | Add `placeOrder` → `PlaceOrderResult` union; add `orderStatusChanged` subscription |
| `apps/backend/src/modules/oms/oms.service.ts` | Return `PlaceOrderResult` (order or rejection) instead of throwing |
| `apps/backend/src/modules/oms/order.entity.ts` | Ensure `keyFields` includes `id` for Apollo cache normalization |
| `apps/backend/src/modules/oms/dtos/place-order-result.dto.ts` | New — `OrderRejectionError` type |
| `apps/backend/src/modules/accounts/accounts.resolver.ts` | Add `positions` query |
| `apps/backend/src/modules/realtime/prana-stream/...` | Publish `ORDER_STATUS_CHANGED` on order status transitions |
| `libs/shared/graphql-schema/schema.gql` | Add `PlaceOrderResult` union, `OrderRejectionError`, `positionSubscription` |

---

## 8. Migration sequence

### Phase 1 — Orders (this session)

1. Backend: add `PlaceOrderResult` union + `OrderRejectionError` type to schema
2. Backend: update `OmsResolver.placeOrder` return type + `OrderService.place()` to return rejection object
3. Web: fix `externalRefId` gap in `trading-workstation.tsx`
4. Web: create `usePlaceOrder` hook with error union handling
5. Web: replace `fetch('/api/orders')` with `usePlaceOrder` mutation in trading workstation
6. Web: update `gql-service.ts` `useGqlPlaceOrder` to wire directly (remove REST stub)
7. Web: run `graphql-codegen` to regenerate types
8. Verify: place order → GraphQL → check Apollo cache + order list refetch

### Phase 2 — Order reads + positions

1. Backend: add `positions` query to `accounts.resolver.ts`
2. Backend: add `orders` query (order list with filters)
3. Web: create `useOrders` + `usePositions` hooks
4. Web: replace `lib/api/orders.ts` + `lib/api/positions.ts` REST calls with GraphQL queries
5. Delete `lib/api/orders.ts` + `lib/api/positions.ts`
6. Verify: order list + positions load via GraphQL, Apollo cache populated

### Phase 3 — Account balance

1. Backend: ensure `accountBalance` query covers all needed fields
2. Web: create `useAccountSummary` hook
3. Web: replace remaining REST call to `/api/accounts/:id/balance`
4. Update `next.config.js` rewrites (remove `/accounts/:path*` rewrite)

### Phase 4 — Real-time subscriptions (optional, depends on PranaStream)

1. Backend: emit `ORDER_STATUS_CHANGED` via PubSub on order status transitions
2. Backend: wire `orderStatusChanged` subscription in resolver
3. Web: add `useOrderSubscription` hook
4. Web: replace `refetchQueries` with `cache.modify` for live updates

---

## 9. Verification plan

After each phase:

1. **Schema validation:** `npm run test:contracts` passes (no connector contracts affected by this change, but good to run)
2. **Apollo devtools:** Verify cache contains `OrderEntity` with correct `__typename` + `keyFields`
3. **Order submission:** Place order via UI → check network tab shows `POST /graphql` (not `/api/orders`) → order appears in list within 1 second (refetch)
4. **Error path:** Submit invalid order → `__typename === 'OrderRejectionError'` → toast shows rejection message
5. **No regression:** Auth OTP flow still works (REST path unchanged)
6. **No regression:** Market data queries (instruments, watchlists) still work

---

## 10. Open questions (flagged for user)

1. **Does PranaStream emit order events today?** If yes, Phase 4 is a small addition. If no, we skip Phase 4 and use refetchQueries indefinitely.
2. **Should we keep `lib/api/orders.ts` and `lib/api/positions.ts` as thin Apollo wrappers** (export hooks, keep file) or delete them entirely? My rec: delete once migration is verified — leaner is better.
3. **Should we add `sl` (stop-loss) and `tp` (take-profit) to the OMS contract?** The subagent found these are not modeled anywhere. If you want them, this is the right time to add them to `PlaceOrderDto` and the schema — before the web app is fully GraphQL-wired.

---

*Author: AmanVatsSharma / Claude*