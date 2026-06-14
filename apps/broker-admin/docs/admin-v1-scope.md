# Broker Admin — v1 Scope & Mock Data Boundaries

> Status: **v1.0 in-development** · Last updated: 2026-06-09
> Owner: broker-admin working group

## Purpose

This document records, page by page, which broker-admin surfaces are **production-wired**
against real backend services for the v1 release and which are still driven by
deterministic mock data. It is the single source of truth for "what's real today"
and the scope contract between broker-admin, backend, and QA.

Anything not listed as **Wired** is intended to be visual/stub for v1 — it must
not be confused with production behavior. The mock layer exists so the UI can be
demonstrated and reviewed before every backend module ships; it is **not** a
fallback for outages.

## Architecture of the mock layer

Two artifacts implement v1 mock data:

| File | Role | Used by |
|---|---|---|
| `src/lib/mock-data.ts` | **Constants** — static arrays (`MOCK_ORDERS`, `MOCK_EXPOSURE_LIMITS`, `MOCK_TRANSACTIONS`, `MOCK_ACTIVITY_FEED`, `MOCK_RISK_METRICS`, `MOCK_DEALER_POSITIONS`, `MOCK_DEALER_QUOTES`, …). Pure data, no behavior. | Imported directly by hooks that haven't yet migrated to the context, and by drawer detail panels that need lookups by id. |
| `src/lib/mock-data-context.tsx` (`MockBrokerDataProvider`) | **Context store** — provides `useBrokerData()` with mutating actions (`resolveAlert`, `updateInstrument`, `grantBonus`, …). Backed by the same constants but adds a `useState`-based in-memory store so mutations feel real. | Pages whose wire is the lower priority for v1: list views, dashboards, sidebars, topbar. |

A `useBrokerData` call is therefore a **strong signal that the page is mocked**.
Pages that have a real hook (e.g. `useExposureLimits`, `useRiskExposure`) and call
it directly are partially wired: the hook fetches from the API, and only falls
back to mock if the request is in a "demo" mode (see "Demo mode" below).

The mock layer is mounted exactly once, at the root layout:

```ts
// apps/broker-admin/src/app/layout.tsx
<MockBrokerDataProvider>{children}</MockBrokerDataProvider>
```

For v1 we deliberately keep the provider unconditional — removing it page by
page is part of the v1.1 cleanup. See "Migration checklist" at the end.

## Demo mode (real-API + mock fallback)

Some hooks (e.g. `useExposureLimits`, `useRiskExposure`, `useBrokerDashboard`)
have a real API path **and** a mock fallback. The fallback is gated by a flag
so a page rendered against the real backend will never silently show mock data.

| Flag | Location | Default |
|---|---|---|
| `NEXT_PUBLIC_BROKER_ADMIN_DEMO` | env | `true` in dev, `false` in prod builds |

When the flag is **on**, the hook returns mock data immediately and skips the
network call. When **off**, the hook fetches the real endpoint and falls back
to mock only on a hard network error (logged at `error` level). Production
deploys must set the flag to `false` so that a backend outage shows an error
state, not stale mock numbers.

## Page-by-page status

Legend: ✅ **Wired** = all data comes from real backend hook(s). 🟡 **Partial**
= some data from real API, some from mock (e.g. list from API, drawer detail
from `MOCK_*` constant). 🟠 **Mock-only** = page is entirely driven by
`useBrokerData` or inline mock arrays. — = not yet assessed.

### Top-level layout / chrome

| Surface | Status | Notes |
|---|---|---|
| `app/layout.tsx` | 🟠 mounts provider | Provider is unconditional; will be removed in v1.1. |
| `shared/sidebar/sidebar.tsx` | 🟠 mock-data-context | Broker selector uses `useBrokerData()`. |
| `shared/topbar/topbar.tsx` | 🟠 mock-data-context | Notifications + broker switcher. |
| `shared/notifications/notifications-panel.tsx` | 🟠 mock-data-context | |

### Dashboard / overview

| Route | Status | Notes |
|---|---|---|
| `(admin)/dashboard` | ✅ wired | Uses `useBrokerDashboard` (real hook, demo-mode gated). |
| `(admin)/live-monitor` | 🟡 partial | Hook + `MOCK_ORDERS` / `MOCK_RISK_METRICS` for drawer detail. |
| `(admin)/risk-dashboard` | 🟡 partial | `useRiskExposure` (demo-mode gated) + `MOCK_EXPOSURE_PER_INSTRUMENT` for the per-instrument table. |

### Client / account ops

| Route | Status | Notes |
|---|---|---|
| `(admin)/clients` | 🟡 partial | `useBrokerData` for list; `MOCK_ORDERS` / `MOCK_TRANSACTIONS` for drawer detail. |
| `(admin)/kyc` | — | TBD |
| `(admin)/team-members` | 🟠 mock-data-context | |
| `(admin)/ibs` | 🟠 mock-data-context | |

### Trading config

| Route | Status | Notes |
|---|---|---|
| `(admin)/instruments` | 🟠 mock-data-context | Instrument CRUD is v2. |
| `(admin)/segment-access` | 🟠 inline `MOCK_USERS` / `MOCK_SEGMENT_ACCESS` | Grant/revoke is a v2 concern; **the Save button is intentionally a no-op** (see J3). |
| `(admin)/market-providers` | 🟠 inline `MOCK_PROVIDERS` / `MOCK_EXCHANGES` | Sync is a 2-second `setTimeout`; **Save is a no-op** (see J3). |
| `(admin)/exposure-limits` | 🟡 partial | `useExposureLimits` (demo-mode gated) + inline `MOCK_LIQUIDATION_HISTORY`, `MOCK_CIRCUIT_BREAKERS`. |
| `(admin)/pricing-rules` | 🟠 mock-data-context | |

### Risk & surveillance

| Route | Status | Notes |
|---|---|---|
| `(admin)/surveillance` | 🟠 mock-data-context | `resolveAlert` is in-memory only. |
| `(admin)/aml-monitor` | 🟠 mock-data-context | |
| `(admin)/pnl` | 🟠 mock-data-context | Revenue chart is static. |

### Funds & promotions

| Route | Status | Notes |
|---|---|---|
| `(admin)/funds` | ✅ wired | `useTransactions` + `useLinkedAccounts` (real hooks, no demo fallback). |
| `(admin)/bonuses` | 🟠 mock-data-context | `grantBonus` is in-memory. |

## Mock-only design intent (v1)

- The mock surfaces exist so QA, design review, and stakeholder demos can
  exercise the **full UI** before every backend module ships. They are **not**
  a substitute for real data and **not** a fallback path for production.
- Demo mode is gated by `NEXT_PUBLIC_BROKER_ADMIN_DEMO`; production deploys
  must set it `false` so a backend outage surfaces an error, not stale numbers.
- Mutations on mock-only pages (resolve alert, grant bonus, edit instrument)
  are **in-memory only**. Refreshing the page reverts to seed data. This is
  deliberate — do not call these "live" in user-facing copy.

## v1 → v1.1 migration checklist

The v1.1 cleanup removes the `MockBrokerDataProvider` from the layout and
deletes the `MOCK_*` constants that are no longer referenced. The order is:

1. **(admin)/instruments** — needs `useInstruments` + `useUpdateInstrument` hooks (backend `market` module). Owner: TBD.
2. **(admin)/segment-access** — needs `useSegmentAccess` + `useGrantSegment` + `useRevokeSegment` (backend `rbac` + `risk-policy`). v2.
3. **(admin)/market-providers** — needs new backend module (no module exists yet). v2.
4. **(admin)/aml-monitor** — needs AML backend integration (deferred — no module exists).
5. **(admin)/bonuses** — needs `usePromotions` / `useGrantBonus` (backend `promotions` module — exists, not yet exposed via GraphQL). Owner: TBD.
6. **(admin)/surveillance**, **(admin)/pnl**, **(admin)/ibs**, **(admin)/team-members** — swap `useBrokerData` slices for the real hooks as they ship.
7. **Drawer details** on `(admin)/clients` and `(admin)/live-monitor` — replace `MOCK_ORDERS` / `MOCK_TRANSACTIONS` lookups with real `useOrderById` / `useTransactionById` hooks.
8. **`MockBrokerDataProvider` unmount** — once every consumer above is migrated, drop the provider from `app/layout.tsx` and delete the `mock-data-context.tsx` + `mock-data.ts` files.

## Conventions

- **Header comments on mock-only pages** must include the line
  `// v1 mock-only — see apps/broker-admin/docs/admin-v1-scope.md` so the next
  contributor knows where to look.
- **Hooks that have a real API + mock fallback** must read
  `NEXT_PUBLIC_BROKER_ADMIN_DEMO` and short-circuit on `true`. They must **not**
  silently fall back on a real-API error in production.
- **Save / mutation handlers on mock-only pages** must be explicit no-ops
  guarded by `if (process.env.NODE_ENV !== 'production') console.debug(...)` —
  never a bare `console.log`. The lint rule is enforced; the audit is in J3.
