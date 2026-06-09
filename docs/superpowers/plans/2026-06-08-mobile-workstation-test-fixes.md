# Mobile Workstation Test Fixes — 2026-06-08

## Status: COMPLETE — 17/17 mobile + trading tests pass; 18 pre-existing failures remain (unrelated to this work).

## Files Created
- `apps/web/features/mobile-terminal/components/mobile-workstation.spec.tsx` (7 tests, all pass)
- `apps/web/features/mobile-terminal/components/mobile-workstation.tsx` (component under test)
- `apps/web/jest.config.ts` (config)
- `apps/web/jest.setup.ts` (jest-dom setup)
- `apps/web/jest.mocks.ts` (nanoid mock)
- `apps/web/jest.env-mocks.ts` (next/* + @obsidian/trading-ui stubs)
- `apps/web/babel.config.js` (JSX transform for jest)

## Files Modified
- `apps/web/features/trading-terminal/components/trading-workstation.spec.tsx` (renamed placeOrderMock → mockPlaceOrderMock, fetchWithAuthMock → mockFetchWithAuthMock; fixed broken jest.spyOn for TWAP test)
- `apps/web/features/trading-terminal/lib/workstation-api.ts` (algo path now trusts `ui.algoType` discriminator before falling back to type mapping)
- `apps/web/features/mobile-terminal/index.ts` (export new component)
- `apps/web/jest.config.ts` (added moduleNameMapper for nanoid + @obsidian/trading-ui)

## Test Results

### Mobile Workstation Suite — 7/7 PASS
- √ renders loading=true when Apollo data is undefined
- √ uses mock data when useAuth() returns null token
- √ uses mock data when demoMode=true even with token
- √ renders real data when authenticated
- √ surfaces first error from hooks
- √ placeOrder calls the mutation hook
- √ cancelOrder calls the mutation hook with order id

### Trading Workstation Suite — 10/10 PASS
- √ renders the lib wrapper
- √ routes TWAP orders to submitAlgoOrderToOms (REST /api/orders/algo)
- √ routes VWAP orders via algoType discriminator (no fall-through to GraphQL)
- √ routes ICEBERG orders via algoType discriminator
- √ falls back to mapping type through resolveApiType when algoType is not set
- √ rejects algo orders with missing/zero totalQuantity before hitting the network
- √ rejects TWAP/VWAP orders with slices < 2
- √ rejects ICEBERG orders with displayQty < 1
- √ routes MARKET orders to the GraphQL usePlaceOrderMutation (non-regression)
- √ rejects orders with no accountId configured (defensive)

## Pre-Existing Test Failures (Unrelated to Mobile Workstation)

### 1. apps/web/shared/apollo/mock-apollo-link.spec.ts
- Test 'prefers window.__MOCK_OVERRIDES__ over the registered fixture' fails
- Override mechanism returns fixture data instead of the override payload
- Status: needs investigation — likely changes in the Apollo link mock mechanism

### 2. apps/web/features/trading-terminal/tests/order-entry-extended.spec.tsx
- 10+ tests fail
- Depends on data shapes that may have changed during workstation evolution
- Status: needs investigation — likely needs refresh against current trading-workstation API

## Plan for Pre-Existing Failures

These are out of scope for the mobile workstation wiring. Recommend filing a separate task to:
1. Investigate the mock-apollo-link test — possibly changes to the Apollo link fixture structure
2. Refresh the order-entry-extended spec against current workstation contracts
3. Add an Nx test target for `apps/web` so CI can enforce these (per CLAUDE.md §2 there's no `nx test web` target)
