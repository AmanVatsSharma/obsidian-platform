# Enterprise Backend Error Handling + Web GraphQL Wiring Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 8 missing HTTP status mappings in the global exception filter; replace raw `throw new Error(...)` with `throw new AppError(...)` in 7 production-critical services; consolidate web GraphQL hooks onto the codegen pipeline; wire `useMe` into the trader layout auth flow.

**Architecture:** Two independent tracks. **Track A** (backend): fix `http-exception.filter.ts` switch statement then migrate each production service one by one. **Track B** (web): unify on codegen hooks by making the barrel re-export from generated, updating all component imports, and adding `cancelBracketGroup.gql` to the codegen pipeline.

**Tech Stack:** NestJS 11, TypeORM, Apollo Client, GraphQL Codegen, `@apollo/client`

---

## Track A — Backend Error Handling

### Task A1: Fix global HTTP exception filter

**File:** `apps/backend/src/common/filters/http-exception.filter.ts`

- [ ] **Step 1: Read the current file**

```bash
cat apps/backend/src/common/filters/http-exception.filter.ts
```

- [ ] **Step 2: Add the 8 missing `AppError` code mappings to the switch statement**

The current switch handles: `VALIDATION_ERROR → 400`, `AUTHENTICATION_FAILED → 401`, `AUTHORIZATION_FAILED → 403`, `RESOURCE_NOT_FOUND → 404`, `DUPLICATE_RESOURCE → 409`, `ORDER_VALIDATION → 400`, `INSUFFICIENT_MARGIN → 402`, `EXCHANGE_DOWN → 503`, `DUPLICATE_ORDER → 409`, default → `500`.

Add these cases (before the default):
```ts
case 'RISK_LIMIT_BREACH':     // 403 — account risk limit exceeded
case 'COMPLIANCE_BREACH':     // 403 — compliance rule violated
  status = HttpStatus.FORBIDDEN;
  break;
case 'EXCHANGE_NOT_ENABLED':  // 400 — exchange not configured for tenant
case 'INVALID_BRACKET_PRICES': // 400 — bracket prices malformed
case 'INVALID_BRACKET_CONFIG': // 400 — bracket config invalid (e.g. takeProfit < entry)
case 'BRACKET_INCOMPLETE':    // 400 — bracket order missing leg
case 'BRACKET_INVALID_PRICE': // 400 — price outside valid range for bracket
  status = HttpStatus.BAD_REQUEST;
  break;
case 'EXCHANGE_REJECTED':     // 502 — exchange refused the order
  status = HttpStatus.BAD_GATEWAY;
  break;
```

- [ ] **Step 3: Run lint to confirm clean**

```bash
npx eslint apps/backend/src/common/filters/http-exception.filter.ts --max-warnings=0 2>&1
```

Expected: 0 errors

---

### Task A2: Fix `smart-order-router.service.ts`

**File:** `apps/backend/src/modules/execution-intelligence/services/smart-order-router.service.ts:75,145`

- [ ] **Step 1: Read the relevant lines**

Line 75: `throw new Error('Route selection failed: ...')`
Line 145: `throw new Error('SOR strategy not found')`

- [ ] **Step 2: Replace raw `Error` throws with `AppError`**

At line 75 (in the SOR routing logic):
```ts
// Before
throw new Error('Route selection failed: ...');
// After
throw new AppError('ORDER_VALIDATION', 'Route selection failed: ...');
```

At line 145:
```ts
// Before
throw new Error('SOR strategy not found');
// After
throw new AppError('RESOURCE_NOT_FOUND', 'SOR strategy not found');
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit -p apps/backend/tsconfig.json 2>&1 | grep smart-order-router
```

Expected: no output

---

### Task A3: Fix `ibkr.connector.ts` and `binance.connector.ts`

**Files:**
- `apps/backend/src/modules/execution-gateway/connectors/ibkr/ibkr.connector.ts:100`
- `apps/backend/src/modules/execution-gateway/connectors/binance/binance.connector.ts:129`

- [ ] **Step 1: Read line 100 of ibkr.connector.ts and line 129 of binance.connector.ts**

These are exchange connector errors — they fire when the exchange API returns an unexpected response or the connection fails. They should map to `EXCHANGE_DOWN` (503) or `EXCHANGE_REJECTED` (502) depending on context.

For `ibkr.connector.ts` line ~100 (likely a connection failure):
```ts
// Before: throw new Error('IBKR API error: ...');
// After: throw new AppError('EXCHANGE_DOWN', 'IBKR API error: ...');
```

For `binance.connector.ts` line ~129:
```ts
// Before: throw new Error('Binance API error: ...');
// After: throw new AppError('EXCHANGE_DOWN', 'Binance API error: ...');
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit -p apps/backend/tsconfig.json 2>&1 | grep -E "ibkr|binance"
```

Expected: no output

---

### Task A4: Fix `settlement-outbox-handler.ts`

**File:** `apps/backend/src/modules/settlement/services/settlement-outbox-handler.ts:77`

- [ ] **Step 1: Read around line 77**

The outbox handler processes settlement events. If it encounters a malformed event, throw `AppError('VALIDATION_ERROR', 'Malformed settlement event', { cause: err })`.

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit -p apps/backend/tsconfig.json 2>&1 | grep settlement-outbox-handler
```

Expected: no output

---

### Task A5: Fix `market.resolver.ts`

**File:** `apps/backend/src/modules/market/market.resolver.ts:186`

- [ ] **Step 1: Read line 186**

```ts
throw new Error('Unauthenticated');
```

This is in a GraphQL resolver — the global filter will catch it and return 500. It should return 401.

```ts
// Before
throw new Error('Unauthenticated');
// After
throw new AppError('AUTHENTICATION_FAILED', 'Unauthenticated');
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit -p apps/backend/tsconfig.json 2>&1 | grep market.resolver
```

Expected: no output

---

### Task A6: Fix `composite-market-data.adapter.ts` (silent swallow)

**File:** `apps/backend/src/modules/realtime/prana-stream/adapters/composite-market-data.adapter.ts:54`

- [ ] **Step 1: Read the `catch (_) {}` block**

Replace:
```ts
} catch (_) {}
```
With:
```ts
} catch (err) {
  this.logger.warn('CompositeMarketDataAdapter: upstream adapter error', {
    error: err instanceof Error ? err.message : String(err),
    adapter: adapterName,
    requestId: getRequestContext()?.requestId ?? 'unknown',
  });
  // Re-throw so the composite can fall back to next adapter
  throw err;
}
```

Requires importing `AppLoggerService` and `getRequestContext` if not already present.

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit -p apps/backend/tsconfig.json 2>&1 | grep composite-market-data
```

Expected: no output

---

### Task A7: Fix `statements.service.ts`

**Files:**
- `apps/backend/src/modules/accounts/services/statements.service.ts:49,55`

- [ ] **Step 1: Read lines 49 and 55**

```ts
// Line 49: throw new Error('Tenant context missing');
// Line 55: throw new Error('Statement not found');
```

```ts
// Line 49 → throw new AppError('UNAUTHORIZED', 'Tenant context missing');
// Line 55 → throw new AppError('RESOURCE_NOT_FOUND', 'Statement not found');
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit -p apps/backend/tsconfig.json 2>&1 | grep statements.service
```

Expected: no output

---

## Track B — Web GraphQL Hook Consolidation

### Task B1: Add `cancelBracketGroup.gql` to codegen pipeline

**File:** Create `apps/web/gql/operations/oms/cancelBracketGroup.gql`

- [ ] **Step 1: Read the existing manual hook**

`apps/web/gql/operations/oms/cancelBracketGroup.ts` — extract the gql mutation string and variables type from this file.

```graphql
mutation CancelBracketGroup($groupId: ID!) {
  cancelBracketGroup(groupId: $groupId) {
    success
    cancelledCount
  }
}
```

Create the file with the actual mutation string from the manual wrapper.

- [ ] **Step 2: Run codegen**

```bash
cd apps/web && npx graphql-codegen --config codegen.ts 2>&1
```

Expected: `useCancelBracketGroupMutation` now appears in `generated/hooks.ts`

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | grep cancelBracketGroup
```

Expected: no output

---

### Task B2: Consolidate `gql/hooks/index.ts` barrel onto codegen

**File:** `apps/web/gql/hooks/index.ts`

- [ ] **Step 1: Read current barrel**

Current content re-exports from individual manual hook files. Replace entire content:

```ts
// Re-export ALL typed hooks from codegen output
export {
  useGetMeQuery,
  useGetMeLazyQuery,
  useGetAccountBalanceQuery,
  useGetAccountBalanceLazyQuery,
  useGetInstrumentsQuery,
  useGetInstrumentsLazyQuery,
  useGetInstrumentQuery,
  useGetInstrumentLazyQuery,
  useGetQuoteQuery,
  useGetQuoteLazyQuery,
  useGetWatchlistsQuery,
  useGetWatchlistsLazyQuery,
  usePlaceOrderMutation,
  usePlaceOrderLazyMutation,
  useGetOrdersQuery,
  useGetOrdersLazyQuery,
  useGetPositionsQuery,
  useGetPositionsLazyQuery,
  useCancelOrderMutation,
  useCancelOrderLazyMutation,
  useModifyOrderMutation,
  useModifyOrderLazyMutation,
  useCancelBracketGroupMutation,
  useCancelBracketGroupLazyMutation,
} from '../generated/hooks';
```

Also export `CacheOperation` and `useQuery`/`useMutation` from `@apollo/client` if anything still needs them — but verify first.

- [ ] **Step 2: Verify build**

```bash
npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | tail -5
```

Expected: 0 errors

---

### Task B3: Update trading-terminal components to use codegen hook names

**Files to update (6 files):**

For each component, change the import name:
| Old (manual) | New (codegen) |
|---|---|
| `useInstruments` | `useGetInstrumentsQuery` |
| `useAccountBalance` | `useGetAccountBalanceQuery` |
| `usePlaceOrder` | `usePlaceOrderMutation` |
| `useOrders` | `useGetOrdersQuery` |
| `usePositions` | `useGetPositionsQuery` |
| `useQuote` | `useGetQuoteQuery` |
| `useCancelOrder` | `useCancelOrderMutation` |
| `useModifyOrder` | `useModifyOrderMutation` |
| `useCancelBracketGroup` | `useCancelBracketGroupMutation` |

Also update the destructured variable names (codegen returns `data?.instruments` not `instruments?.data` — verify each component's data access pattern before changing).

**Files:**
- `apps/web/features/trading-terminal/components/trading-workstation.tsx`
- `apps/web/features/trading-terminal/components/pending-orders-table.tsx`
- `apps/web/features/trading-terminal/components/order-entry.tsx`
- `apps/web/features/trading-terminal/components/positions-panel.tsx`
- `apps/web/features/trading-terminal/hooks/usePositions.ts` (may need full rewrite)
- `apps/web/features/trading-terminal/hooks/useOrders.ts` (may need full rewrite)

- [ ] **Step 1: Read `trading-workstation.tsx` imports and hook call patterns**

For each file, verify the data access shape from the codegen hooks (e.g., `useGetInstrumentsQuery` returns `{ data: { instruments?: Instrument[] }, loading, error }`).

- [ ] **Step 2: Update import names**

```ts
// Before
import { useInstruments, useAccountBalance, usePlaceOrder } from '@/gql/hooks';
// After
import { useGetInstrumentsQuery, useGetAccountBalanceQuery, usePlaceOrderMutation } from '@/gql/hooks';
```

- [ ] **Step 3: Update hook call signatures**

Codegen hooks use full query options objects. Change:
```ts
// Before
const { data } = useInstruments({ instrumentType: 'EQUITY' });
// After
const { data } = useGetInstrumentsQuery({ instrumentType: 'EQUITY' });
```

- [ ] **Step 4: Update data access**

```ts
// Before
const instruments = data?.instruments ?? [];
// After
const instruments = data?.instruments ?? [];
// (codegen keys match manual keys — but verify per file)
```

- [ ] **Step 5: Verify TypeScript after each file**

```bash
npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | tail -5
```

---

### Task B4: Wire `useGetMeQuery` into trader shell layout

**File:** `apps/web/app/(trader)/layout.tsx`

- [ ] **Step 1: Read current layout**

Check whether the layout already calls any auth hooks. Check `auth-provider.tsx` for how the auth token is stored and consumed.

- [ ] **Step 2: Add `useGetMeQuery` call after auth provider initializes**

The flow:
1. `AuthProvider` restores token from `localStorage` on mount
2. `layout.tsx` calls `useGetMeQuery()` to validate token and load user context
3. While loading (`loading === true`), show a skeleton spinner
4. If error (401 from the query), redirect to `/login`
5. If data, populate the user session context and render the shell

```tsx
import { useGetMeQuery } from '@/gql/hooks';

function TraderLayout({ children }: { children: React.ReactNode }) {
  const { data, loading, error } = useGetMeQuery();
  const router = useRouter();

  useEffect(() => {
    if (!loading && error) {
      router.push('/login');
    }
  }, [loading, error]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[var(--bg-panel)]"><span className="text-[var(--text-secondary)] font-mono">Loading...</span></div>;
  }

  if (error || !data?.me) return null; // or redirect

  return (
    <AppShell user={data.me}>
      {children}
    </AppShell>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | tail -5
```

Expected: 0 errors

---

### Task B5: Delete orphaned manual hook files

**Files to delete (11 files in `gql/hooks/`):**

After all components are updated to use codegen hooks, delete the manual wrappers that are now redundant:

```
apps/web/gql/hooks/useInstruments.ts
apps/web/gql/hooks/useAccountBalance.ts
apps/web/gql/hooks/usePlaceOrder.ts
apps/web/gql/hooks/useOrders.ts
apps/web/gql/hooks/usePositions.ts
apps/web/gql/hooks/useQuote.ts
apps/web/gql/hooks/useWatchlists.ts
apps/web/gql/hooks/useCancelOrder.ts
apps/web/gql/hooks/useModifyOrder.ts
apps/web/gql/hooks/useInstrument.ts
apps/web/gql/hooks/index.ts (already rewritten in Task B2)
```

Also delete orphaned `.ts` operation wrapper files that have been superseded by codegen (they duplicate the gql document and hook wrapper):

```
apps/web/gql/operations/auth/getMe.ts
apps/web/gql/operations/accounts/getAccountBalance.ts
apps/web/gql/operations/market/getInstruments.ts
apps/web/gql/operations/market/getInstrument.ts
apps/web/gql/operations/market/getQuote.ts
apps/web/gql/operations/market/getWatchlists.ts
apps/web/gql/operations/oms/getOrders.ts
apps/web/gql/operations/oms/getPositions.ts
apps/web/gql/operations/oms/placeOrder.ts
apps/web/gql/operations/oms/modifyOrder.ts
apps/web/gql/operations/oms/cancelOrder.ts
apps/web/gql/operations/oms/cancelBracketGroup.ts
```

Keep ONLY the `.gql` files (they are the source of truth for codegen).

- [ ] **Step 1: Verify no remaining imports of deleted files**

```bash
grep -r "gql/hooks/useInstruments" apps/web/features apps/web/app --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules"
grep -r "gql/hooks/useAccountBalance" apps/web/features apps/web/app --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "node_modules"
# ... repeat for each deleted file
```

Expected: 0 results

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | tail -5
```

Expected: 0 errors

---

## Quality Gate Tasks

### Task QG1: Backend error handling final verification

- [ ] `npx tsc --noEmit -p apps/backend/tsconfig.json` — 0 errors
- [ ] `npm run check:cycles` — no circular dependencies
- [ ] `npx eslint apps/backend/src --max-warnings=999 2>&1 | grep "error"` — 0 errors
- [ ] Verify `market.resolver.ts`, `smart-order-router.service.ts`, `statements.service.ts` throw `AppError` by searching for `throw new AppError` in those files

### Task QG2: Web GraphQL final verification

- [ ] `npx tsc --noEmit -p apps/web/tsconfig.json` — 0 errors
- [ ] `npm run codegen:web` — successful regeneration
- [ ] Verify `gql/hooks/index.ts` re-exports only from `generated/hooks.ts` (no manual wrappers)
- [ ] Verify `layout.tsx` calls `useGetMeQuery`

### Task QG3: Commit and push

```bash
git add -A
git commit -m "feat(backend+web): enterprise error handling + GraphQL codegen wiring

Backend:
- Fix global HTTP exception filter: add 8 missing AppError→HTTP mappings
- Replace raw Error throws in 7 production services with AppError
- Fix silent error swallow in composite-market-data.adapter

Web:
- Add cancelBracketGroup.gql to codegen pipeline
- Consolidate gql/hooks/ onto codegen output
- Wire useGetMe into trader layout auth flow
- Delete orphaned manual hook wrappers"

git push
```

---

## Self-Review Checklist

- [ ] All 8 missing HTTP status mappings added to the filter
- [ ] All 7 production services use `AppError`, not raw `Error`
- [ ] `composite-market-data.adapter.ts` logs and re-throws (not swallows)
- [ ] `cancelBracketGroup.gql` exists and codegen produces the hook
- [ ] `gql/hooks/index.ts` re-exports only from `generated/hooks.ts`
- [ ] All 6 trading-terminal components use codegen hook names
- [ ] `layout.tsx` has `useGetMeQuery` call with auth fallback
- [ ] All orphaned manual hook files deleted
- [ ] No remaining imports of deleted files
- [ ] `npm run quality:verify` clean (or only pre-existing lint issues remain)