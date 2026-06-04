# Mobile Workstation Wiring — Web `/m/workstation` ↔ Backend

**Date:** 2026-06-04
**Status:** Approved for implementation
**Author:** BharatERP
**Goal:** Wire the web app's mobile workstation route (`/m/workstation`) to the backend GraphQL surface, mirroring the desktop workstation's pattern with zero new GraphQL operations.

---

## 1 · Architecture Decision

**Platform-adapter split over inline wiring (Approach A).** The desktop workstation already established the pattern: a presentational `TradingWorkstation` library component consumed by a thin `trading-workstation.tsx` web platform adapter that wires Apollo hooks, auth, and `fetchWithAuth`. The mobile dashboard is currently a single 1000+ line file with mock data baked in — refactoring it into the same two-layer shape lets us reuse every existing GraphQL hook, every existing fixture, and every existing auth/error path.

We reject the alternatives:

- **Approach B — shared lib** would couple a `libs/mobile-ui-kit` component to web's `@/gql/hooks` path alias, making the lib unusable by the future Expo app. The shared surface must be presentational; the data adapter is per-app.
- **Approach C — mobile-specific GraphQL operations** would add a parallel fixture set, a codegen variant, and a new backend resolver field for a small network-roundtrip saving. Rejected — revisit only if a "mobile aggregator" query becomes a real product ask.

---

## 2 · Current State

### What's already in place

| Component | Status | Location |
|---|---|---|
| Desktop GraphQL hooks (instruments, quote, balance, orders, positions, place, cancel) | ✅ | `apps/web/gql/hooks.ts` (generated) |
| Desktop platform adapter (uses 5 Apollo hooks + fetchWithAuth) | ✅ | `apps/web/features/trading-terminal/components/trading-workstation.tsx` |
| `MockApolloLink` with 7 typed fixtures + per-op dispatch | ✅ | `apps/web/shared/apollo/__fixtures__/` |
| Mobile dashboard UI (8 screens, sparkline, chart, DOM sheet, trade ticket, toast) | ✅ mock-data only | `apps/web/features/mobile-terminal/components/mobile-trading-dashboard.tsx` |
| `/m/workstation` route, no AppShell, full-viewport 100dvh | ✅ | `apps/web/app/(mobile)/m/workstation/page.tsx` |
| Backend GraphQL schema (75 queries, 67 mutations) | ✅ | `apps/backend/src/generated/schema.gql` |
| Backend REST algo endpoint (POST `/api/orders/algo`) | ✅ | `apps/backend/src/modules/oms/` |
| Auth provider (cookie-based session, OTP, dev login) | ✅ | `apps/web/shared/providers/auth-provider` |

### What's missing (this spec fills)

- The mobile web route reads from mock data instead of the backend.
- The mobile dashboard's `placeOrder` / `cancelOrder` flows are not wired to the OMS.
- Live prices on the mobile dashboard are simulated by an 800ms interval; the desktop uses Apollo's 2s `useGetQuoteQuery` poll.

---

## 3 · Target Architecture

```
apps/web/features/mobile-terminal/
├── components/
│   ├── mobile-trading-dashboard.tsx     (REFACTOR — presentational only)
│   ├── mobile-workstation.tsx           (NEW — data adapter, ~120 LOC)
│   └── mobile-workstation.spec.tsx      (NEW — 6 test cases)
└── index.ts                             (MODIFY — export new entry)

apps/web/app/(mobile)/m/workstation/
└── page.tsx                             (MODIFY — render <MobileWorkstation />)
```

**No new GraphQL operations, no new fixtures, no backend changes.** The mobile web route is just another consumer of the desktop's existing hook set.

---

## 4 · Module Boundaries

| File | Layer | Knows about |
|---|---|---|
| `mobile-trading-dashboard.tsx` | Presentational UI | `@obsidian/trading-ui` types only; no Apollo, no `useAuth` |
| `mobile-workstation.tsx` | Web platform adapter | `@/gql/hooks`, `@/shared/providers/auth-provider`, dashboard prop type |
| `mobile-workstation.spec.tsx` | Test | The data adapter; uses existing `MockApolloLink` |
| `page.tsx` | Route | The data adapter only |

The dashboard is the **only** file with the existing 8-screen UI. The adapter is the only file that talks to the backend. The page is a 2-line render.

---

## 5 · Data Flow

### The prop contract — `MobileWorkstationData`

```ts
type MobileWorkstationData = {
  // Read
  instruments: Instrument[];
  quotesBySymbol: Record<string, QuoteDto>;
  account: AccountBalancePayload | null;
  orders: OrderEntity[];                    // PENDING only
  positions: PositionRow[];
  accountId: string;

  // Write
  placeOrder: (input: PlaceOrderInput) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;

  // Meta
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
};
```

### Apollo hooks (all from `@/gql/hooks`)

| Hook | Poll | Vars | Drives |
|---|---|---|---|
| `useGetInstrumentsQuery` | 5000 ms | — | Watchlist, Markets list, instrument picker |
| `useGetQuoteQuery` | 2000 ms | `{ symbol, exchange }` of active instrument | Home hero, Chart, Sparklines |
| `useGetAccountBalanceQuery` | none | `{ accountId }` | Account screen, P&L header |
| `useGetOrdersQuery` | none | `{ accountId, status: 'PENDING' }` | Orders blotter, tab badge |
| `useGetPositionsQuery` | none | `{ accountId }` | Positions list, Account screen |
| `usePlaceOrderMutation` | n/a | `{ input: PlaceOrderInput }` | Trade ticket submit |
| `useCancelOrderMutation` | n/a | `{ id }` | Order row swipe action |

### Unauthenticated path

When `useAuth().accessToken` is null:
- Skip the Apollo hooks (avoid ref-errors / unnecessary network).
- Return mock `instruments` / `quotesBySymbol` / `account` / `orders` / `positions` from the existing `INSTRUMENTS` / `ACCOUNT` / `OPEN_POSITIONS` / `PENDING_ORDERS` exports.
- `placeOrder` / `cancelOrder` become no-op async functions.
- `error: 'unauthenticated'` lets the dashboard render a "Sign in to trade live" banner linking to `/login`.

### Demo path

`?demo=1` query param forces the same mock fallback even when authenticated — previewable in browser with no backend.

### `quotesBySymbol` map

The adapter subscribes to a single `useGetQuoteQuery` for the **active** instrument. The map is `{ symbol → quote }`; the dashboard reads it in O(1) per row. For inactive rows, the dashboard falls back to `Instrument.lastPrice` from `useGetInstrumentsQuery` — same pattern as the desktop.

### Mutation → cache update

Apollo's `usePlaceOrderMutation` and `useCancelOrderMutation` auto-invalidate the `getOrders` / `getPositions` queries on success. No manual `refetchQueries` calls. The dashboard updates optimistically (closes the trade ticket / removes the row) and the next poll cycle confirms.

---

## 6 · Error Handling & Edge Cases

1. **First non-null error wins.** All 5 read hooks expose `error`. The adapter picks the first non-null and exposes it as a single string on `MobileWorkstationData.error`. The dashboard renders a non-blocking red banner on the relevant screen. Other screens keep working with whatever data they have.
2. **Mutation errors** surface as a toast in the existing toast layer. The toast message comes from `result.errors[0].message`. No retry button.
3. **No active instrument selected (first load).** `useGetQuoteQuery` is skipped via `skip: !activeSymbol`. `quotesBySymbol` is empty. Dashboard falls back to `Instrument.lastPrice`.
4. **Missing `NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID` env var.** Adapter passes `accountId: ''`, backend rejects the 4 account-scoped hooks, the adapter surfaces the error. Matches the desktop's current behavior — no mobile-specific fallback.
5. **`cancelOrder` race — order already filled.** Backend returns `ORDER_NOT_CANCELLABLE`. The mutation resolves with `errors`; the adapter surfaces this as a toast. Apollo's normal refetch removes the now-non-pending row.
6. **Network offline.** All 5 hooks return `loading: true` and no `data`. The adapter exposes `loading: true`; the dashboard renders a non-blocking yellow "Reconnecting…" banner. When the device returns, polling resumes via Apollo's reactive network status. No custom offline queue — matches the desktop.
7. **Idempotency on `placeOrder`.** Generate a fresh `clientOrderId` via `nanoid()` on every submit (same as desktop). Double-tap protection lives in the dashboard: the trade ticket's submit button is disabled + shows a spinner while the mutation is in-flight.
8. **Auth refresh.** Out of scope. The mobile web route runs in the same browser context as the desktop, so it inherits the existing cookie-based session refresh.

---

## 7 · Bridges to Existing Desktop Patterns

| Pattern | Reused? | How |
|---|---|---|
| `fetchWithAuth` for algo orders | No | Out of scope this round (core blotter only). Future wave imports it into `mobile-workstation.tsx` the same way `trading-workstation.tsx` does. |
| `Instrument`, `OrderEntity`, `PositionRow`, `AccountBalancePayload`, `QuoteDto` types | Yes | Re-imported by `MobileWorkstationData`; no redefinition. |
| `MockApolloLink` fallback | Yes | Already active in the dev Apollo chain. Mobile web route gets it for free; no new fixtures. |
| 800ms price-tick interval | Replaced | The data layer drives prices via `useGetQuoteQuery` (2s poll). The interval stays in the dashboard but is gated behind `liveTick?: boolean` (default `false` in the wired path; `true` for the mock/demo path). |

---

## 8 · Test Plan

`apps/web/features/mobile-terminal/components/mobile-workstation.spec.tsx` — 6 cases, mirroring `trading-workstation.spec.tsx` patterns:

1. Renders loading state when all 5 read hooks are pending.
2. Renders mock-data fallback when `useAuth()` returns no token.
3. Renders real data when `useAuth()` returns a token + all 5 hooks resolve.
4. Surfaces first error from any of the 5 hooks as a banner.
5. `placeOrder` propagates to the mutation hook (assert via `MockApolloLink` capturing the mutation).
6. `cancelOrder(id)` calls the cancel mutation with the right id.

The presentational dashboard is not unit-tested in this round — its visual coverage will land via Playwright snapshots of `/m/workstation` in a future wave.

---

## 9 · Scope Boundaries

### In scope

- Refactoring `MobileTradingDashboard` into a presentational prop-driven component.
- Adding `MobileWorkstation` data adapter.
- Wiring `/m/workstation` to backend via existing GraphQL hooks.
- Test coverage for the adapter.
- Mock fallback for unauthenticated / demo mode.

### Out of scope (future waves)

- **Algo orders** (TWAP / VWAP / ICEBERG) — needs `fetchWithAuth` + `submitAlgoOrderToOms`. Add when product asks.
- **WebSocket live prices** — currently uses 2s `useGetQuoteQuery` polling. A `useGetQuotesSubscription` over PranaStream is a real-time upgrade, separate from this spec.
- **Offline queue** for order entry — needs a sync layer; revisit if reliability becomes a product ask.
- **Expo native app** (`apps/mobile/**`) — stays as Wave-2 placeholders. The presentational `MobileTradingDashboard` is now hoistable to `libs/mobile-ui-kit` and the data adapter pattern translates cleanly when the Expo work starts.
- **Mobile-aware cadences** — current spec matches desktop (5s instruments, 2s quote, focus-only orders/positions). If battery/data becomes a product concern, add a `mobile-cadence` config knob.
- **Auth refresh on mobile web** — inherits the desktop's cookie-based session.

---

## 10 · Risk Profile

- **Low.** The mobile web route is currently a mock-data demo; we're not breaking a wired user flow. The refactor is mechanical — the dashboard already takes typed props.
- **Test signal:** the new spec covers the adapter's 6 critical paths. Visual coverage via Playwright in a future wave.
- **Rollback:** revert the 4 file diffs; the page is back to mock-data behavior.
- **No new operations, no backend coupling, no schema changes** — the surface area is contained to `apps/web/features/mobile-terminal/` and one route file.

---

## 11 · Reviewer Checklist

- [ ] `mobile-workstation.tsx` mirrors `trading-workstation.tsx` shape (Apollo hooks + auth + mock fallback).
- [ ] `MobileWorkstationData` is the only new type — small, focused, well-bounded.
- [ ] No new GraphQL operations / fixtures / backend changes.
- [ ] Unauthenticated + `?demo=1` paths explicitly handled.
- [ ] Mobile dashboard remains presentational and reusable for future Expo work.
- [ ] Test spec covers loading, error, mock-fallback, real-data, and both mutations.
- [ ] All 4 files have file headers matching the project's long-form template.
- [ ] Lint + typecheck clean (`npm run lint`, `nx typecheck web`).
