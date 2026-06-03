/**
 * File:        apps/web/shared/apollo/__fixtures__/orders.ts
 * Module:      web · Shared · Apollo · Fixtures
 * Purpose:     Deterministic mock `OrderEntity[]` fixtures for the `GetOrders`
 *              GraphQL operation. Covers the three lifecycle states a trader
 *              needs to see in the order blotter: working, filled, cancelled.
 *
 * Exports:
 *   - mockOrders: OrderEntity[]   — 3 entries (working limit, filled market, cancelled stop)
 *
 * Depends on:
 *   - @/gql/generated/graphql — OrderEntity
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Shapes match `OrderEntity` exactly; do NOT add or rename fields or
 *     `tsc` will fail against the generated schema types.
 *   - `price` is omitted on the market order (market orders do not carry
 *     a limit). `Maybe<Float>` resolves to `number | undefined` — do not
 *     use `null`, it will fail type-check.
 *   - `triggerPrice` is set on the cancelled stop to demonstrate the stop-loss
 *     branch; `triggerCondition` uses the OMS string enum value.
 *   - `remainingQty === quantity - filledQty` at all times.
 *   - All three share one `accountId` and one `tenantId` so they can be
 *     filtered together by the OMS list query.
 *
 * Read order:
 *   1. mockOrders — the only export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-01
 */

import type { OrderEntity } from '@/gql/generated/graphql';

const ACCOUNT_ID = 'acct-demo-001';
const TENANT_ID = 'tenant-acme';

/**
 * 1. Working LIMIT BUY for ETH @ 3,200 — 2 of 5 filled, 3 still resting.
 * 2. Filled MARKET BUY for 0.1 BTC — fully executed, no resting quantity.
 * 3. Cancelled STOP SELL for AAPL @ 200 — never triggered, cancelled manually.
 */
export const mockOrders: OrderEntity[] = [
  {
    __typename: 'OrderEntity',
    id: 'ord-001',
    accountId: ACCOUNT_ID,
    tenantId: TENANT_ID,
    clientOrderId: 'cli-eth-limit-001',
    externalRefId: 'ext-eth-limit-001',
    instrumentId: 'inst-eth-usd',
    side: 'BUY',
    type: 'LIMIT',
    quantity: 5,
    filledQty: 2,
    remainingQty: 3,
    price: 3200,
    status: 'WORKING',
    timeInForce: 'GTC',
    orderRole: 'ENTRY',
    createdAt: '2026-06-01T09:30:00.000Z',
    updatedAt: '2026-06-01T09:30:12.000Z',
  },
  {
    __typename: 'OrderEntity',
    id: 'ord-002',
    accountId: ACCOUNT_ID,
    tenantId: TENANT_ID,
    clientOrderId: 'cli-btc-market-002',
    externalRefId: 'ext-btc-market-002',
    instrumentId: 'inst-btc-usd',
    side: 'BUY',
    type: 'MARKET',
    quantity: 0.1,
    filledQty: 0.1,
    remainingQty: 0,
    status: 'FILLED',
    timeInForce: 'IOC',
    orderRole: 'ENTRY',
    createdAt: '2026-06-01T10:15:00.000Z',
    updatedAt: '2026-06-01T10:15:01.450Z',
  },
  {
    __typename: 'OrderEntity',
    id: 'ord-003',
    accountId: ACCOUNT_ID,
    tenantId: TENANT_ID,
    clientOrderId: 'cli-aapl-stop-003',
    externalRefId: 'ext-aapl-stop-003',
    instrumentId: 'inst-aapl',
    side: 'SELL',
    type: 'STOP',
    quantity: 100,
    filledQty: 0,
    remainingQty: 100,
    triggerPrice: 200,
    triggerCondition: 'LAST_TRADE',
    status: 'CANCELLED',
    timeInForce: 'GTC',
    orderRole: 'STOP_LOSS',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:45:30.000Z',
  },
];
