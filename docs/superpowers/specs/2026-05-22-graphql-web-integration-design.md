# GraphQL-First Architecture — Web Frontend Integration

**Spec Version:** 1.0
**Date:** 2026-05-22
**Status:** Approved
**Owner:** Backend (schema source) + Web (primary consumer)

---

## 1. Overview

Replace the fragmented REST data-fetching layer in the Next.js web app with a unified GraphQL-first architecture using **Apollo Client** and **graphql-codegen**. The NestJS backend already exposes 32 GraphQL resolvers across all modules; the web app currently only calls 3 REST endpoints. This spec closes that gap.

**Goal:** Enterprise-grade GraphQL integration — typed queries, auto-generated hooks, cookie-based auth injection, cache policies, error boundaries, and real-time subscriptions (phase 2).

---

## 2. Architecture Decisions

### 2.1 Schema Ownership & Distribution

```
apps/backend/src/modules/*/*.resolver.ts
        ↓ (nestjs/graphql autoSchemaFile → libs/shared/graphql-schema/schema.gql)
libs/shared/graphql-schema/
    schema.gql          ← committed source of truth
    package.json        ← @obsidian/graphql-schema
    README.md
        ↓ (graphql-codegen reads schema + operations/*.graphql)
apps/web/gql/
    generated/graphql.ts   ← all schema types (auto-generated)
    generated/hooks.ts     ← typed useQuery/useMutation per operation
    operations/            ← dev-authored .graphql files (one per feature domain)
        accounts/
        oms/
        market/
        auth/
        notifications/
        ...
```

**Why shared `libs/shared/graphql-schema/`:**
- Backend owns the schema; all frontends consume it
- Codegen runs offline (no backend server needed)
- Schema is committed to git — reviewable diffs, CI-gated changes
- Same schema consumed by broker-admin, dealer-workstation, support-ops in future

### 2.2 Auth Injection (Dual Mechanism)

| Mechanism | Use Case | Implementation |
|-----------|----------|---------------|
| **Cookie** (`access_token`) | Browser sessions (web app) | HTTP-only cookie, auto-sent with every request. `SameSite=strict`, `Secure` in prod. |
| **Bearer Header** | Server-side rendering / programmatic clients | Apollo `setContext` interceptor reads cookie → attaches `Authorization: Bearer <token>` on every request. |

Apollo `ApolloClient` config:
```ts
const httpLink = new HttpLink({ uri: '/graphql' });

const authLink = setContext((_, { headers }) => {
  const token = getCookie('access_token');
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});
```

`AuthGuard` on backend resolvers reads the JWT from `req.headers.authorization` or from the NestJS session context (cookie-based). Both paths work — `AuthGuard` is resolution-agnostic.

### 2.3 SSR Strategy (Next.js App Router)

**Constraint:** Server Components cannot use Apollo Client (requires React context).

```
apps/web/app/layout.tsx          (Server Component)
    └── ApolloProviderWrapper     (Client Component, 'use client')
            └── ApolloProvider
                    └── ApolloClient (HttpLink + AuthLink + Cache + ErrorLink)
                            └── children (app shell, client components)

children/
    ├── app/(trader)/...        (Server → reads Apollo cache or uses server-side fetch)
    └── features/...             (Client → useQuery/useMutation hooks)
```

`ApolloProviderWrapper` is the single mount point for all GraphQL functionality. It initializes the client once at the top level. Features below it are pure consumers.

**SSR Data Fetching:** Server Components that need GraphQL data use a dedicated `getClient()` singleton (non-context ApolloClient) for server-side queries. This is used in layouts and pages that need initial data before hydration.

### 2.4 Cache Architecture

| Cache Policy | Use Case | Implementation |
|---|---|---|
| `cache-first` | Static reference data (instruments, account config, RBAC roles) | Apollo default, persists to `localStorage` |
| `cache-and-network` | User-facing data that changes (positions, balances, orders) | Ensures fresh data without blocking on first render |
| `no-cache` | Mutations, writes | Apollo default for mutations |
| `network-only` | Real-time feeds (prices, fills) | Overrides cache, always fresh |

**Cache persistence:** `InMemoryCache` with `localStorage` persistence for authenticated sessions. Cache key includes `tenantId` for multi-tenant isolation. Cache serialization handles SSR gracefully (`window` guard).

**Cache key strategy:** Apollo's default `keyFields` uses `__typename + id`. For lists without IDs, use `dataIdFromObject` to customize. All type names are namespaced to prevent collisions.

### 2.5 Error Handling

**Apollo Link Error Chain:**
```
Request → AuthLink (inject token) → HttpLink → Backend
                    ↓
              ErrorLink (catches network + GraphQL errors)
                    ↓
              onError(( { graphQLErrors, networkError, forward }) => {
                if (networkError) log + toast('Network error');
                if (auth errors 401) → redirect to login
                if (permission errors 403) → toast + redirect
                if (validation errors 400) → map to field errors
              })
```

**Error categories:**
| Error | Response |
|---|---|
| `UNAUTHENTICATED` (401) | Clear tokens, redirect to `/login` |
| `FORBIDDEN` (403) | Toast notification, stay on page |
| `BAD_USER_INPUT` (400) | Map field errors to form state |
| `INTERNAL_SERVER_ERROR` (500) | Global error boundary, retry option |
| Network error | Toast "Connection lost", retry queue |

**React Error Boundaries:** `ApolloProviderWrapper` wraps children in an `ErrorBoundary` that catches GraphQL errors and renders a fallback UI (the Obsidian terminal error state).

### 2.6 Pagination Strategy

**Cursor-based Relay-style connections** for all list queries (orders, positions, transactions, notifications). This is the enterprise standard — supports efficient infinite scroll and server-side filtering.

Generated by backend `@ObjectType()` + `@Connection()` decorators on TypeORM paginated relations.

```graphql
type AccountConnection {
  edges: [AccountEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}
```

Client uses `useQuery` with `fetchMore` for infinite scroll.

---

## 3. Implementation Phases

### Phase 1 — Foundation (this session)
- [ ] Backend schema generation → `libs/shared/graphql-schema/schema.gql`
- [ ] `@obsidian/graphql-schema` package setup
- [ ] Web Apollo Provider with auth injection + error handling
- [ ] Web graphql-codegen config
- [ ] Codegen: generate `generated/graphql.ts` + `generated/hooks.ts`

### Phase 2 — Feature Migration (post-spec)
- [ ] Migrate trading terminal (watchlists, order submission)
- [ ] Migrate console (account info, balances, positions)
- [ ] Migrate portfolio dashboard
- [ ] Migrate notification center
- [ ] Migrate remaining features

### Phase 3 — Real-time (future)
- [ ] GraphQL Subscriptions via WebSocket (`graphql-ws` protocol)
- [ ] Live price updates in trading terminal
- [ ] Order fill notifications via WS

---

## 4. File Changes

### 4.1 Backend Changes

| File | Change |
|---|---|
| `apps/backend/src/app.module.ts` | Change `autoSchemaFile` to `libs/shared/graphql-schema/schema.gql` (absolute path) |
| `apps/backend/package.json` | Add `graphql:schema` script: `npx ts-node apps/backend/src/scripts/generate-schema.ts` |
| `apps/backend/src/scripts/generate-schema.ts` | Script to generate and copy schema to shared location |
| `apps/backend/src/main.ts` | Add pre-start schema generation hook |

**Schema generation script** (`apps/backend/src/scripts/generate-schema.ts`):
- Imports the `GraphQLSchema` from `TypeGraphQL` metadata (uses the existing NestJS DI to build the schema without starting the server)
- Writes to `libs/shared/graphql-schema/schema.gql`
- Called by `npm run graphql:schema` AND by `predev` hook

### 4.2 Shared Schema Package

| File | Purpose |
|---|---|
| `libs/shared/graphql-schema/package.json` | `{"name": "@obsidian/graphql-schema", "version": "1.0.0"}` — consumable by all frontends |
| `libs/shared/graphql-schema/schema.gql` | Committed schema from backend |
| `libs/shared/graphql-schema/README.md` | Documents update workflow |

**Update workflow:**
1. Backend resolver changes land on `main`
2. CI runs `npm run graphql:schema` (or pre-commit hook locally)
3. Schema file updates → git diff → PR review
4. Frontends re-run codegen on schema update

### 4.3 Web Apollo Setup

| File | Purpose |
|---|---|
| `apps/web/gql/client/apollo-provider.tsx` | `'use client'` — wraps app with ApolloProvider |
| `apps/web/gql/client/apollo-client.ts` | ApolloClient instance with all links |
| `apps/web/gql/client/auth-link.ts` | Token injection from cookies |
| `apps/web/gql/client/error-link.ts` | Error categorization + handling |
| `apps/web/gql/client/cache-policies.ts` | Per-query cache policy definitions |
| `apps/web/gql/generated/graphql.ts` | Auto-generated from schema (DO NOT EDIT) |
| `apps/web/gql/generated/hooks.ts` | Auto-generated hooks (DO NOT EDIT) |
| `apps/web/gql/operations/` | Dev-authored `.graphql` files per feature domain |
| `apps/web/codegen.ts` | graphql-codegen config |
| `apps/web/package.json` | Add: `@apollo/client`, `graphql`, `@graphql-codegen/*` |

### 4.4 Dependencies to Add (web `package.json`)

```json
{
  "@apollo/client": "^3.13.0",
  "graphql": "^16.14.0",
  "@graphql-codegen/cli": "^6.0.0",
  "@graphql-codegen/typescript": "^4.0.0",
  "@graphql-codegen/typescript-operations": "^4.0.0",
  "@graphql-codegen/typescript-react-apollo": "^4.0.0",
  "@graphql-codegen/near-operation-file-preset": "^3.0.0"
}
```

### 4.5 Codegen Config (`apps/web/codegen.ts`)

```ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: require.resolve('@obsidian/graphql-schema/schema.gql'),
  documents: 'gql/operations/**/*.graphql',
  generates: {
    'gql/generated/graphql.ts': {
      plugins: ['typescript'],
    },
    'gql/generated/hooks.ts': {
      plugins: ['typescript-operations', 'typescript-react-apollo'],
      config: { withHooks: true },
    },
  },
  hooks: {
    'afterAllFileWrite': ['prettier --write'],
  },
};

export default config;
```

### 4.6 `next.config.js` Update

Add rewrite for GraphQL endpoint:
```js
{ source: '/graphql', destination: 'http://localhost:3000/graphql' }
```

---

## 5. Operation File Naming Convention

```
gql/operations/
├── auth/
│   ├── getMe.gql
│   ├── refreshToken.gql
│   └── logout.gql
├── accounts/
│   ├── getAccount.gql
│   ├── getBalances.gql
│   ├── getPositions.gql
│   └── getLedgerEntries.gql
├── oms/
│   ├── getOrders.gql
│   ├── getOrderById.gql
│   ├── placeOrder.gql        ← mutation
│   ├── cancelOrder.gql        ← mutation
│   └── modifyOrder.gql        ← mutation
├── market/
│   ├── getInstruments.gql
│   ├── getQuotes.gql
│   ├── getWatchlists.gql
│   └── subscribeToQuotes.gql  ← subscription (phase 2)
├── notifications/
│   ├── getNotifications.gql
│   └── markAsRead.gql
├── portfolio/
│   ├── getPositions.gql
│   ├── getDailyStatements.gql
│   └── getPnL.gql
└── settlement/
    ├── getDeposits.gql
    ├── getWithdrawals.gql
    └── createDepositRequest.gql
```

---

## 6. Error Response Contract

Backend GraphQL errors follow this structure (via `AppError` + `GlobalHttpExceptionFilter`):
```json
{
  "errors": [
    {
      "extensions": {
        "code": "UNAUTHENTICATED",
        "originalError": {
          "code": "AUTH_TOKEN_EXPIRED",
          "requestId": "req_abc123",
          "statusCode": 401
        }
      },
      "message": "Access token has expired",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["me"]
    }
  ],
  "data": null
}
```

Frontend `error-link.ts` parses `extensions.code` and `extensions.originalError.statusCode` to route to the appropriate handling (redirect, toast, form field mapping).

---

## 7. Cache Invalidation Strategy

| Event | Invalidation |
|---|---|
| `orderPlaced` mutation | `Cache.modify` on `OrderConnection` + `positions` |
| `orderCancelled` mutation | `Cache.modify` on `OrderConnection` + `positions` |
| `balanceChanged` (outbox event) | Evict `balances` query |
| `positionUpdated` (outbox event) | Evict `positions` query |
| User logs out | `client.clearStore()` |

Use Apollo `cache.updateQuery` and `cache.modify` for surgical updates — avoid full cache eviction unless necessary.

---

## 8. Testing Strategy

| Test Type | Location | Approach |
|---|---|---|
| Unit | `gql/**/*.spec.ts` | Test auth-link, error-link, cache-policies in isolation |
| Integration | `features/**/gql.test.tsx` | Mock Apollo Client with `@apollo/client/testing` |
| E2E | `apps/web-e2e/` | Real GraphQL calls against dev backend |
| Contract | `npm run test:contracts` (backend) | Verify schema matches resolver contracts |

---

## 9. Quality Gates

Before any PR merges:
- [ ] `npm run codegen` passes — generated types up to date
- [ ] `npm run graphql:schema` — backend schema regenerated
- [ ] No `generated/` files have manual edits (codegen owns them)
- [ ] All `operations/*.gql` files parse against schema (codegen validates)
- [ ] `npm run build` passes with Apollo provider mounted

---

## 10. Change Log

| Date | Change |
|---|---|
| 2026-05-22 | Initial spec — Apollo Client + codegen architecture |