# Web → Backend GraphQL Trading Migration: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all trading data REST calls in `apps/web` to GraphQL. Auth stays REST. Phase 4 adds real-time order updates via existing PranaStream Socket.IO.

**Architecture:** Phase 1 — backend first (define the contract), then web. Phased by feature: orders → order reads → positions → account balance → real-time. Error handling via GraphQL union `PlaceOrderResult = OrderEntity | OrderRejectionError`.

**Tech Stack:** NestJS (backend) · Apollo Client (web) · PranaStream Socket.IO (real-time) · TypeORM · class-validator

---

## Backend Changes — must be implemented first (before web changes)

### TASK 1: Add sl_price / tp_price to OrderEntity

**Files:**
- Modify: `apps/backend/src/modules/oms/entities/order.entity.ts`
- Modify: `apps/backend/src/modules/oms/dtos/order.dto.ts` (PlaceOrderDto)
- Modify: `libs/shared/graphql-schema/schema.gql`
- Create migration (follow existing naming pattern)

- [ ] **Step 1: Read current entity**

Read `apps/backend/src/modules/oms/entities/order.entity.ts` in full to understand column ordering and TypeORM decorators used.

- [ ] **Step 2: Add sl_price and tp_price columns to entity**

Add after the `price` column:

```typescript
@Column({ name: 'sl_price', type: 'numeric', precision: 28, scale: 8, nullable: true })
slPrice: string;

@Column({ name: 'tp_price', type: 'numeric', precision: 28, scale: 8, nullable: true })
tpPrice: string;
```

Also add `keyFields` for Apollo cache normalization at the top of the entity class:

```typescript
@ObjectType()
@Resolver(() => OrderEntity)
@KeyFields(['id'])
@Entity('orders')
export class OrderEntity {
  // ... existing columns
}
```

(If `@KeyFields` decorator doesn't exist in this codebase, add `keyFields: ['id']` to the Apollo `typePolicies` in the web app instead — see TASK 8.)

- [ ] **Step 3: Create migration**

```bash
npm run migration:generate -- apps/backend/src/database/migrations/1748000000000-add-sl-tp-to-orders
```

Or if using TypeORM CLI directly:
```bash
npx typeorm migration:generate -d apps/backend/src/shared/database/typeorm.config.ts apps/backend/src/database/migrations/1748000000000-add-sl-tp-to-orders
```

The migration must add two nullable numeric columns: `sl_price` and `tp_price`.

- [ ] **Step 4: Add sl/tp to PlaceOrderDto**

In `apps/backend/src/modules/oms/dtos/order.dto.ts`, add to `PlaceOrderDto`:

```typescript
@Field({ nullable: true })
@IsOptional()
@IsNumberString()
slPrice?: string;

@Field({ nullable: true })
@IsOptional()
@IsNumberString()
tpPrice?: string;
```

- [ ] **Step 5: Add sl/tp to GraphQL schema**

Update `libs/shared/graphql-schema/schema.gql` — add to `PlaceOrderDto` input type:

```graphql
slPrice: Float
tpPrice: Float
```

Also add `slPrice` and `tpPrice` fields to `OrderEntity` type in the schema.

- [ ] **Step 6: Update OrderService.place() to accept sl/tp**

In `apps/backend/src/modules/oms/services/order.service.ts`, update the `place()` method to read `dto.slPrice` and `dto.tpPrice` and set them on the entity before saving:

```typescript
const order = this.orderRepo.create({
  // ... existing fields
  slPrice: dto.slPrice,
  tpPrice: dto.tpPrice,
});
```

- [ ] **Step 7: Commit**

```bash
git add apps/backend/src/modules/oms/entities/order.entity.ts \
       apps/backend/src/modules/oms/dtos/order.dto.ts \
       libs/shared/graphql-schema/schema.gql \
       apps/backend/src/database/migrations/
git commit -m "feat(oms): add slPrice/tpPrice to OrderEntity and PlaceOrderDto

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### TASK 2: Add OrderRejectionError DTO and PlaceOrderResult union

**Files:**
- Create: `apps/backend/src/modules/oms/dtos/place-order-result.dto.ts`
- Modify: `apps/backend/src/modules/oms/oms.resolver.ts`
- Modify: `libs/shared/graphql-schema/schema.gql`

- [ ] **Step 1: Create OrderRejectionError DTO**

Create `apps/backend/src/modules/oms/dtos/place-order-result.dto.ts`:

```ts
import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';

export enum OrderRejectionCode {
  INSUFFICIENT_BUYING_POWER = 'INSUFFICIENT_BUYING_POWER',
  INVALID_INSTRUMENT = 'INVALID_INSTRUMENT',
  EXCHANGE_NOT_ENABLED = 'EXCHANGE_NOT_ENABLED',
  POSITION_LIMIT_EXCEEDED = 'POSITION_LIMIT_EXCEEDED',
  RISK_CHECK_FAILED = 'RISK_CHECK_FAILED',
  UNKNOWN = 'UNKNOWN',
}

registerEnumType(OrderRejectionCode, { name: 'OrderRejectionCode' });

@ObjectType()
export class OrderRejectionError {
  @Field(() => OrderRejectionCode)
  code: OrderRejectionCode;

  @Field()
  message: string;

  @Field({ nullable: true })
  externalRefId?: string;
}
```

- [ ] **Step 2: Add PlaceOrderResult union to GraphQL schema**

In `libs/shared/graphql-schema/schema.gql`, add after the existing type definitions:

```graphql
enum OrderRejectionCode {
  INSUFFICIENT_BUYING_POWER
  INVALID_INSTRUMENT
  EXCHANGE_NOT_ENABLED
  POSITION_LIMIT_EXCEEDED
  RISK_CHECK_FAILED
  UNKNOWN
}

type OrderRejectionError {
  code: OrderRejectionCode!
  message: String!
  externalRefId: String
}

union PlaceOrderResult = OrderEntity | OrderRejectionError
```

Change the `placeOrder` mutation return type from `OrderEntity` to `PlaceOrderResult`:

```graphql
type Query {
  orders(accountId: String!, status: String, limit: Int): [OrderEntity!]!
  order(id: ID!): OrderEntity
}

type Mutation {
  placeOrder(input: PlaceOrderDto!): PlaceOrderResult
  cancelOrder(id: ID!, externalRefId: String!): OrderEntity
  modifyOrder(id: ID!, input: ModifyOrderDto!): OrderEntity
}
```

- [ ] **Step 3: Update oms.resolver.ts**

In `apps/backend/src/modules/oms/oms.resolver.ts`, update `placeOrder` return type and handler:

Change the import to include `OrderRejectionError`:

```ts
import { OrderRejectionError, OrderRejectionCode } from './dtos/place-order-result.dto';
```

Update the mutation:

```ts
@Mutation(() => PlaceOrderResult)
@Permissions('oms:write')
async placeOrder(@Args('input') dto: PlaceOrderDto): Promise<PlaceOrderResult> {
  this.logger.debug('OmsResolver.placeOrder()', dto);
  try {
    const order = await this.orderService.place(dto);
    return order; // returns OrderEntity
  } catch (error) {
    // Pre-trade validation failure (duplicate, exchange not enabled, etc.)
    const code = error instanceof AppError ? error.code : 'UNKNOWN';
    const message = error instanceof AppError ? error.message : 'Order placement failed';
    return Object.assign(new OrderRejectionError(), {
      code: this.mapCode(code),
      message,
      externalRefId: dto.externalRefId,
    });
  }
}

private mapCode(code: string): OrderRejectionCode {
  const map: Record<string, OrderRejectionCode> = {
    DUPLICATE_ORDER: OrderRejectionCode.INSUFFICIENT_BUYING_POWER,
    EXCHANGE_NOT_ENABLED: OrderRejectionCode.EXCHANGE_NOT_ENABLED,
  };
  return map[code] ?? OrderRejectionCode.UNKNOWN;
}
```

Also add the `orders` query (order list) since it's referenced in the schema update above:

```ts
@Query(() => [OrderEntity])
@Permissions('oms:read')
async orders(
  @Args('accountId') accountId: string,
  @Args('status', { nullable: true }) status?: string,
  @Args('limit', { nullable: true, type: () => Int }) limit?: number,
): Promise<OrderEntity[]> {
  return this.orderService.findByAccount(accountId, { status, limit });
}
```

- [ ] **Step 4: Handle exchange REJECTED status in OrderService.place()**

Currently `OrderService.place()` returns the entity even on exchange rejection (status = 'REJECTED'). This needs to be converted to a `PlaceOrderResult` rejection for the GraphQL union to work correctly. Update `OrderService.place()`:

After the exchange rejects (around line 234–241 in the original), instead of returning the entity with `REJECTED` status, return a rejection object. Since the service can't return a union type directly (it doesn't import GraphQL types), use a result wrapper:

Create a result type in the service layer:

```ts
// At top of order.service.ts, define a result type:
type PlaceOrderOutcome =
  | { ok: true; order: OrderEntity }
  | { ok: false; code: string; message: string; externalRefId: string };
```

Update `place()` to return `PlaceOrderOutcome` instead of `Promise<OrderEntity>`:

```ts
async place(dto: PlaceOrderDto): Promise<PlaceOrderOutcome> {
  // ... existing validation
  // After exchange response handling (around line 234):
  if (exchangeResponse.status === 'REJECTED') {
    return {
      ok: false,
      code: 'EXCHANGE_REJECTED',
      message: exchangeResponse.reason ?? 'Order rejected by exchange',
      externalRefId: dto.externalRefId,
    };
  }
  // success path
  return { ok: true, order: saved };
}
```

Then in the resolver, check `result.ok` and return the appropriate union member.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/oms/dtos/place-order-result.dto.ts \
       apps/backend/src/modules/oms/oms.resolver.ts \
       apps/backend/src/modules/oms/services/order.service.ts \
       libs/shared/graphql-schema/schema.gql
git commit -m "feat(oms): add PlaceOrderResult union + OrderRejectionError type

Returns OrderRejectionError on exchange rejection instead of OrderEntity
with REJECTED status. Allows Apollo to distinguish success from rejection
via __typename without relying on status field inspection.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### TASK 3: Add positions query + refetch all PranaStream order event wiring

**Files:**
- Modify: `apps/backend/src/modules/accounts/accounts.resolver.ts`
- Modify: `apps/backend/src/modules/accounts/entities/position.entity.ts`
- Create: `apps/backend/src/modules/oms/dtos/position.dto.ts`
- Modify: `apps/backend/src/modules/realtime/prana-stream/services/realtime-aggregator.service.ts` (frame shape)
- Modify: `libs/shared/graphql-schema/schema.gql`

- [ ] **Step 1: Read accounts resolver + position entity**

Read `apps/backend/src/modules/accounts/accounts.resolver.ts` to understand existing resolver structure.
Read `apps/backend/src/modules/accounts/entities/position.entity.ts` to understand position fields.

- [ ] **Step 2: Add positions query to accounts resolver**

Add to `accounts.resolver.ts`:

```ts
import { PositionEntity } from '../entities/position.entity';

@Query(() => [PositionEntity])
@Permissions('oms:read')
async positions(
  @Args('accountId') accountId: string,
  @Context() ctx: GqlContext,
): Promise<PositionEntity[]> {
  return this.positionService.findByAccount(accountId, ctx.tenantId);
}
```

- [ ] **Step 3: Verify position entity has GraphQL decorators**

Ensure `PositionEntity` has `@ObjectType()` decorator and all fields have `@Field()` decorators. If not, add them.

- [ ] **Step 4: Add positions to GraphQL schema**

In `libs/shared/graphql-schema/schema.gql`:

```graphql
type PositionEntity {
  id: ID!
  accountId: ID!
  instrumentId: ID!
  quantity: Float!
  averagePrice: Float
  marketValue: Float
  unrealizedPnl: Float
  realizedPnl: Float
  side: String!
  updatedAt: DateTime!
}

type Query {
  # ... existing queries
  positions(accountId: String!): [PositionEntity!]!
}
```

- [ ] **Step 5: Check realtime aggregator frame shape**

Read `apps/backend/src/modules/realtime/prana-stream/services/realtime-aggregator.service.ts` around lines 234-243 to see the `order.updated` frame shape. Confirm it includes `order` object with `id`, `status`, `filledQuantity`, etc. This is what the web app will consume in Phase 4.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/accounts/accounts.resolver.ts \
       apps/backend/src/modules/accounts/entities/position.entity.ts \
       libs/shared/graphql-schema/schema.gql
git commit -m "feat(accounts): add positions GraphQL query + position entity GraphQL decorators

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Web App Changes — implement after backend contract is stable

### TASK 4: Fix trading-workstation.tsx — add externalRefId + sl/tp inputs + GraphQL mutation

**Files:**
- Modify: `apps/web/features/trading-terminal/components/trading-workstation.tsx` (line ~100-140)
- Create: `apps/web/gql/operations/oms/placeOrder.gql`
- Create: `apps/web/gql/hooks/usePlaceOrder.ts`

- [ ] **Step 1: Read the full trading-workstation component**

Read `apps/web/features/trading-terminal/components/trading-workstation.tsx` from top to bottom (all lines) to understand:
- The full form state (`uiOrder`)
- What UI fields already exist for sl/tp (or confirm they don't exist)
- Where `fetch('/api/orders')` is called
- The `onTradeSubmit` handler in full

- [ ] **Step 2: Create GraphQL operation for placeOrder**

Update `apps/web/gql/operations/oms/placeOrder.gql` (already exists, fix it):

```graphql
mutation PlaceOrder($input: PlaceOrderDto!) {
  placeOrder(input: $input) {
    __typename
    ... on OrderEntity {
      id
      clientOrderId
      externalRefId
      status
      instrumentId
      side
      type
      quantity
      price
      slPrice
      tpPrice
      timeInForce
      createdAt
    }
    ... on OrderRejectionError {
      code
      message
      externalRefId
    }
  }
}
```

- [ ] **Step 3: Create usePlaceOrder hook**

Create `apps/web/gql/hooks/usePlaceOrder.ts`:

```ts
import { useMutation } from '@apollo/client';
import { PlaceOrderDocument } from '../../__generated__/graphql';
import { nanoid } from 'nanoid';

export function usePlaceOrder(options?: { onSuccess?: (order: any) => void; onError?: (err: any) => void }) {
  const [mutate, { loading, error }] = useMutation(PlaceOrderDocument, {
    refetchQueries: ['GetOrders', 'GetPositions', 'GetAccountBalance'],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      const result = data.placeOrder;
      if (result.__typename === 'OrderRejectionError') {
        options?.onError?.(result);
        return;
      }
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      // GraphQL network/schema errors (not order rejections — those are in onCompleted)
      options?.onError?.({ code: 'NETWORK_ERROR', message: error.message });
    },
  });

  const submitOrder = (input: {
    accountId: string;
    instrumentId: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    quantity: string;
    price?: string;
    slPrice?: string;
    tpPrice?: string;
  }) => {
    return mutate({
      variables: {
        input: {
          ...input,
          clientOrderId: `web-${nanoid(10)}`,
          externalRefId: `ext-${nanoid(12)}`,
          timeInForce: 'DAY',
        },
      },
    });
  };

  return { submitOrder, loading, error };
}
```

- [ ] **Step 4: Add sl/tp form fields to trading-workstation**

In `trading-workstation.tsx`, if sl/tp form fields don't exist, add them to the `uiOrder` state. The exact implementation depends on the existing form structure — the key is:
1. Add `sl` and `tp` number inputs to the order form UI
2. Include them in the `submitOrder` call from `usePlaceOrder`

If the component uses a form library (react-hook-form, formik, etc.), follow the existing pattern.

- [ ] **Step 5: Replace fetch('/api/orders') with usePlaceOrder**

Replace the REST `fetch` call in `onTradeSubmit` with the Apollo mutation:

```ts
// BEFORE:
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'acme' },
  body: JSON.stringify(body),
});
const data = await response.json();

// AFTER:
const { submitOrder, loading } = usePlaceOrder({
  onSuccess: (order) => {
    showToast(`Order placed: ${order.clientOrderId}`, 'success');
    refreshOrderList();
  },
  onError: (err) => {
    showToast(err.message ?? 'Order rejected', 'error');
  },
});

// In onTradeSubmit:
await submitOrder({
  accountId,
  instrumentId,
  side,
  type: apiType,
  quantity: (parseFloat(uiOrder.lots) || 0).toFixed(2),
  ...(price ? { price } : {}),
  ...(uiOrder.sl ? { slPrice: uiOrder.sl } : {}),
  ...(uiOrder.tp ? { tpPrice: uiOrder.tp } : {}),
});
```

Also fix the missing `externalRefId` — it's now generated inside `usePlaceOrder` via `nanoid`, so remove it from the body construction above.

- [ ] **Step 6: Add Apollo cache type policies**

In `apps/web/gql/client/apollo-client.ts`, add `OrderEntity` and `PositionEntity` key fields for cache normalization:

```ts
import { OrderEntity, PositionEntity } from '../../__generated__/graphql';

const cache = new InMemoryCache({
  typePolicies: {
    OrderEntity: { keyFields: ['id'] },
    PositionEntity: { keyFields: ['id'] },
  },
});
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/gql/operations/oms/placeOrder.gql \
       apps/web/gql/hooks/usePlaceOrder.ts \
       apps/web/gql/client/apollo-client.ts \
       apps/web/features/trading-terminal/components/trading-workstation.tsx
git commit -m "feat(web): wire placeOrder GraphQL mutation with error union handling

Replaces REST POST /api/orders with Apollo usePlaceOrder hook.
Handles OrderRejectionError via __typename check in onCompleted.
Adds slPrice/tpPrice to order submission. externalRefId generated
via nanoid inside the hook. Apollo cache normalized on OrderEntity.id.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### TASK 5: Create useOrders + usePositions hooks, migrate order list + positions to GraphQL

**Files:**
- Create: `apps/web/gql/operations/oms/orders.gql`
- Create: `apps/web/gql/operations/positions/positions.gql`
- Create: `apps/web/gql/hooks/useOrders.ts`
- Create: `apps/web/gql/hooks/usePositions.ts`
- Modify: `apps/web/features/trading-terminal/` (replace REST API calls)
- Delete: `apps/web/lib/api/orders.ts`
- Delete: `apps/web/lib/api/positions.ts`

- [ ] **Step 1: Create orders query GraphQL operation**

Create `apps/web/gql/operations/oms/orders.gql`:

```graphql
query GetOrders($accountId: String!, $status: String, $limit: Int) {
  orders(accountId: $accountId, status: $status, limit: $limit) {
    id
    clientOrderId
    externalRefId
    status
    instrumentId
    side
    type
    quantity
    filledQuantity
    price
    slPrice
    tpPrice
    timeInForce
    createdAt
    updatedAt
  }
}
```

- [ ] **Step 2: Create positions query GraphQL operation**

Create `apps/web/gql/operations/positions/positions.gql`:

```graphql
query GetPositions($accountId: String!) {
  positions(accountId: $accountId) {
    id
    accountId
    instrumentId
    quantity
    averagePrice
    marketValue
    unrealizedPnl
    realizedPnl
    side
    updatedAt
  }
}
```

- [ ] **Step 3: Create useOrders hook**

Create `apps/web/gql/hooks/useOrders.ts`:

```ts
import { useQuery } from '@apollo/client';
import { GetOrdersDocument } from '../../__generated__/graphql';

export function useOrders(accountId: string, options?: { status?: string; limit?: number }) {
  return useQuery(GetOrdersDocument, {
    variables: { accountId, status: options?.status, limit: options?.limit },
    skip: !accountId,
    pollInterval: 30_000, // poll every 30s as fallback until Phase 4 real-time
  });
}
```

- [ ] **Step 4: Create usePositions hook**

Create `apps/web/gql/hooks/usePositions.ts`:

```ts
import { useQuery } from '@apollo/client';
import { GetPositionsDocument } from '../../__generated__/graphql';

export function usePositions(accountId: string) {
  return useQuery(GetPositionsDocument, {
    variables: { accountId },
    skip: !accountId,
    pollInterval: 30_000, // poll every 30s as fallback until Phase 4 real-time
  });
}
```

- [ ] **Step 5: Find and replace REST calls to /api/orders and /api/positions**

Search for all calls to:
- `GET /api/orders` (order list fetch)
- `GET /api/positions` (positions fetch)
- `lib/api/orders.ts` imports
- `lib/api/positions.ts` imports

Replace each with the corresponding `useOrders` or `usePositions` hook. Key files likely to change:
- `apps/web/features/trading-terminal/lib/workstation-api.ts`
- Any order list / positions display components

For each REST call replaced, remove the corresponding import from `lib/api/client.ts`.

- [ ] **Step 6: Delete REST API files**

Delete:
- `apps/web/lib/api/orders.ts`
- `apps/web/lib/api/positions.ts`

From `apps/web/lib/api/client.ts`, remove the `getOrders()` and `getPositions()` functions.

- [ ] **Step 7: Update next.config.js rewrites**

In `apps/web/next.config.js`, remove the `/api/orders` and `/api/positions` rewrites since those routes are no longer called from the web app:

```js
rewrites: async () => [
  { source: '/graphql', destination: 'http://localhost:3000/graphql' },
  { source: '/auth/:path*', destination: 'http://localhost:3000/auth/:path*' },
  // remove: { source: '/api/orders', ... }
  // remove: { source: '/api/positions', ... }
  // keep: /market, /accounts, /oms rewrites if still used by other code
]
```

- [ ] **Step 8: Run graphql-codegen**

```bash
cd apps/web && npm run generate
```

Or if using the script directly:
```bash
npx graphql-codegen --config apps/web/codegen.ts
```

This regenerates `__generated__/graphql.ts` with the new `PlaceOrderResult` union type and all updated entities.

- [ ] **Step 9: Verify build**

```bash
npm run build --apps=web 2>&1 | head -50
```

Fix any TypeScript errors from the codegen output or the hook wiring.

- [ ] **Step 10: Commit**

```bash
git add apps/web/gql/operations/oms/orders.gql \
       apps/web/gql/operations/positions/positions.gql \
       apps/web/gql/hooks/useOrders.ts \
       apps/web/gql/hooks/usePositions.ts \
       apps/web/features/trading-terminal/ \
       apps/web/lib/api/ \
       apps/web/next.config.js \
       apps/web/codegen.ts
git add -A apps/web/lib/api/  # stages deleted files
git commit -m "feat(web): migrate order list + positions to GraphQL queries

Replaces REST GET /api/orders and /api/positions with useOrders/usePositions
Apollo hooks. Deletes lib/api/orders.ts and lib/api/positions.ts.
Removes /api/orders and /api/positions from Next.js rewrites.
Codegen generates all TypeScript types from updated schema.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### TASK 6: Migrate account balance REST → GraphQL + cleanup next.config.js

**Files:**
- Modify: `apps/web/features/trading-terminal/` (replace account balance REST call)
- Modify: `apps/web/lib/api/client.ts` (remove account balance REST method)
- Modify: `apps/web/next.config.js`

- [ ] **Step 1: Check existing account balance GraphQL query**

Check if `apps/web/gql/operations/accounts/accountBalance.gql` already exists and what fields it covers. If it's missing fields, update it to match what the UI needs.

- [ ] **Step 2: Find all REST calls to /api/accounts**

Search for `fetch('/api/accounts'` or `getAccountBalance` in the web app to find all call sites.

- [ ] **Step 3: Replace with useAccountBalance hook**

If `useAccountBalance` hook doesn't exist, create it:

```ts
import { useQuery } from '@apollo/client';
import { GetAccountBalanceDocument } from '../../__generated__/graphql';

export function useAccountBalance(accountId: string) {
  return useQuery(GetAccountBalanceDocument, {
    variables: { accountId },
    skip: !accountId,
    pollInterval: 60_000, // balance changes less frequently
  });
}
```

- [ ] **Step 4: Remove /accounts rewrite from next.config.js**

Remove the `/accounts/:path*` rewrite if it's only used for the account balance call that's now GraphQL.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(web): migrate account balance to GraphQL + cleanup next.config.js

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### TASK 7: Phase 4 — Wire PranaStream Socket.IO for real-time order updates

**Files:**
- Create: `apps/web/lib/socket.ts` (Socket.IO client singleton)
- Modify: `apps/web/gql/client/apollo-client.ts` (integrate socket events with Apollo cache)
- Modify: `apps/web/features/trading-terminal/components/trading-workstation.tsx` (connect socket on mount)

- [ ] **Step 1: Create Socket.IO client singleton**

Create `apps/web/lib/socket.ts`:

```ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000/ws/prana', {
      path: '/ws/prana',
      transports: ['websocket', 'polling'],
      auth: { token: getAccessToken() },
    });
    socket.on('connect', () => console.debug('[socket] connected', socket?.id));
    socket.on('disconnect', (reason) => console.debug('[socket] disconnected', reason));
    socket.on('connect_error', (err) => console.error('[socket] error', err.message));
  }
  return socket;
}

function getAccessToken(): string {
  if (typeof window === 'undefined') return '';
  // Read from httpOnly cookie — same approach as auth-link.ts
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  return match?.[1] ?? '';
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
```

- [ ] **Step 2: Create useOrderSubscription hook**

Create `apps/web/gql/hooks/useOrderSubscription.ts`:

```ts
import { useEffect } from 'react';
import { getSocket } from '../../lib/socket';
import { useApolloClient } from '@apollo/client';
import { InMemoryCache } from '@apollo/client/cache';

const ORDER_FRAGMENT = `
  fragment OrderFields on OrderEntity {
    id
    clientOrderId
    status
    filledQuantity
    quantity
    price
    updatedAt
  }
`;

interface OrderUpdatedFrame {
  type: 'order.updated';
  data: {
    order: {
      id: string;
      status: string;
      filledQuantity: number;
      quantity: number;
      price: number;
    };
    execution?: {
      id: string;
      price: number;
      quantity: number;
      executedAt: string;
    };
  };
}

export function useOrderSubscription(accountId: string, userId: string) {
  const apollo = useApolloClient();
  const cache = apollo.cache as InMemoryCache;

  useEffect(() => {
    const socket = getSocket();

    socket.on('order.updated', (frame: OrderUpdatedFrame) => {
      const { order } = frame.data;
      const typeName = 'OrderEntity';

      // Update the specific order in cache
      cache.modify({
        id: cache.identify({ __typename: typeName, id: order.id }),
        fields: {
          status: () => order.status,
          filledQuantity: () => order.filledQuantity ?? 0,
          price: () => order.price ?? null,
        },
      });

      // If this is an execution event, update order list too
      if (frame.data.execution) {
        cache.modify({
          id: `orders:${accountId}`,
          fields: {
            // The orders query cache key format depends on Apollo policy
            // May need to adjust based on actual cache key structure
          },
        });
      }
    });

    // Subscribe to order updates on mount
    socket.emit('subscribe', { orders: true });

    return () => {
      socket.off('order.updated');
      socket.emit('subscribe', { orders: false }); // unsubscribe
    };
  }, [accountId, userId, cache]);
}
```

- [ ] **Step 3: Mount in trading workstation**

In `trading-workstation.tsx`, add:

```tsx
import { useOrderSubscription } from '../../../../gql/hooks/useOrderSubscription';
import { useAuth } from '@shared/providers/auth-provider';

const { user } = useAuth();
useOrderSubscription(accountId, user?.id ?? '');
```

This activates real-time order updates as soon as the trading workstation mounts.

- [ ] **Step 4: Remove polling (optional after Phase 4)**

Once Socket.IO real-time is confirmed working, update:
- `useOrders` — remove `pollInterval: 30_000`
- `usePositions` — remove `pollInterval: 30_000`

Keep balance polling (less time-critical).

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/socket.ts \
       apps/web/gql/hooks/useOrderSubscription.ts \
       apps/web/features/trading-terminal/components/trading-workstation.tsx
git commit -m "feat(web): wire PranaStream Socket.IO for real-time order updates

Socket.IO connects on trading-workstation mount. 'order.updated' events
update Apollo cache in-place via cache.modify. Polling removed from
useOrders/usePositions once real-time is confirmed working.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Verification

After each task, run:

```bash
# Backend
npm run build --apps=backend
nx test backend --testPathPattern=oms

# Web
npm run build --apps=web
npm run e2e  # smoke test for order placement
```

Final check: open trading terminal → place order → verify in network tab that `POST /graphql` is called (not `/api/orders`) → order appears in list within 1 second.

---

## Spec Coverage Checklist

- [x] slPrice/tpPrice added to OrderEntity, PlaceOrderDto, GraphQL schema
- [x] PlaceOrderResult union + OrderRejectionError type added
- [x] oms.resolver.ts returns union, service returns rejection object
- [x] positions query added to accounts resolver
- [x] usePlaceOrder hook with __typename error handling
- [x] useOrders + usePositions hooks with polling fallback
- [x] REST /api/orders and /api/positions removed from web app
- [x] next.config.js rewrites cleaned up
- [x] account balance migrated to GraphQL
- [x] PranaStream Socket.IO wired for real-time updates
- [x] Apollo cache normalized on OrderEntity.id + PositionEntity.id

---

*Plan author: Claude / AmanVatsSharma*
*Created: 2026-05-24*