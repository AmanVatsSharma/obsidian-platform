# GraphQL Web Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task via supervisor+subagent pattern.

**Goal:** Wire the Next.js web app to the NestJS GraphQL backend using Apollo Client + graphql-codegen. Schema owned by backend, consumed by all frontends.

**Architecture:**
- Backend generates GraphQL schema to `libs/shared/graphql-schema/schema.gql` (committed, backend-owned)
- Web app consumes schema via graphql-codegen, generates `gql/generated/` (typed hooks + types)
- Apollo Provider wraps the app with cookie-based auth injection + enterprise error handling
- Developers author `.gql` operation strings in feature `lib/` folders; codegen produces typed hooks

**Tech Stack:** Apollo Client 3.x, graphql-codegen, TypeScript, Next.js App Router

---

## File Map

| Layer | File | Responsibility |
|---|---|---|
| Backend | `apps/backend/src/scripts/generate-schema.ts` | Build schema from TypeGraphQL metadata, write to shared path |
| Backend | `apps/backend/src/app.module.ts` | Update autoSchemaFile path to shared schema |
| Backend | `apps/backend/src/main.ts` | Run schema gen on startup |
| Shared | `libs/shared/graphql-schema/package.json` | `@obsidian/graphql-schema` package manifest |
| Shared | `libs/shared/graphql-schema/schema.gql` | Committed GraphQL schema (generated) |
| Shared | `libs/shared/graphql-schema/README.md` | Schema update workflow docs |
| Web | `apps/web/gql/client/apollo-client.ts` | ApolloClient: HttpLink + AuthLink + ErrorLink + InMemoryCache |
| Web | `apps/web/gql/client/auth-link.ts` | setContext: reads access_token cookie -> Bearer header |
| Web | `apps/web/gql/client/error-link.ts` | onError: 401->redirect, 403->toast, 400->field errors, 500->boundary |
| Web | `apps/web/gql/client/cache-policies.ts` | Named cache policy constants |
| Web | `apps/web/gql/client/apollo-provider.tsx` | 'use client' ApolloProvider wrapper with ErrorBoundary |
| Web | `apps/web/gql/client/cookie.ts` | SSR-safe getCookie helper |
| Web | `apps/web/codegen.ts` | graphql-codegen config: schema + documents -> generated/ |
| Web | `apps/web/gql/operations/auth/getMe.gql` | { me { id email role tenant } } query |
| Web | `apps/web/gql/operations/market/getWatchlists.gql` | Watchlist with instrument edges |
| Web | `apps/web/gql/operations/oms/getOrders.gql` | Orders with pagination |
| Web | `apps/web/gql/operations/oms/placeOrder.gql` | Order placement mutation |
| Web | `apps/web/gql/generated/graphql.ts` | Auto-generated types (DO NOT EDIT) |
| Web | `apps/web/gql/generated/hooks.ts` | Auto-generated hooks (DO NOT EDIT) |
| Web | `apps/web/features/trading-terminal/lib/gql-service.ts` | GraphQL data layer for trading terminal |
| Web | `apps/web/app/layout.tsx` | Mount ApolloProviderWrapper in provider chain |
| Web | `apps/web/next.config.js` | Add /graphql rewrite -> backend |
| Backend | `apps/backend/src/common/guards/auth.guard.ts` | Support both header + cookie auth |

---

## TASK 1: Backend Schema Generation (Foundation)

**Dependency:** None. Start here.
**Files:**
- Create: `apps/backend/src/scripts/generate-schema.ts`
- Modify: `apps/backend/src/app.module.ts` (line 67: autoSchemaFile path)
- Modify: `apps/backend/package.json` (add graphql:schema script + predev hook)

---

- [ ] **Step 1: Read app.module.ts lines 60-90**

Read the GraphQLModule.forRoot block to understand current autoSchemaFile config.

---

- [ ] **Step 2: Create generate-schema.ts**

Create: `apps/backend/src/scripts/generate-schema.ts`

```ts
/**
 * File:        apps/backend/src/scripts/generate-schema.ts
 * Module:      backend · Build
 * Purpose:     Standalone schema generator — builds the TypeGraphQL schema
 *              from app module metadata without starting the HTTP server, then
 *              writes the SDL to libs/shared/graphql-schema/schema.gql.
 *
 * Usage:       npx ts-node apps/backend/src/scripts/generate-schema.ts
 *              (also called via predev hook and CI pipeline)
 *
 * Side-effects: Writes schema.gql file to shared schema package
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

import { join } from 'path';
import { writeFileSync } from 'fs';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { GraphQLSchema } from 'graphql';

const outputPath = join(__dirname, '../../../../libs/shared/graphql-schema/schema.gql');

// All 32 resolvers explicitly listed so buildSchema can discover decorators
const resolverPaths: string[] = [
  '@/modules/auth/auth.resolver',
  '@/modules/accounts/accounts.resolver',
  '@/modules/market/market.resolver',
  '@/modules/oms/oms.resolver',
  '@/modules/users/users.resolver',
  '@/modules/rbac/rbac.resolver',
  '@/modules/notifications/notifications.resolver',
  '@/modules/admin/admin.resolver',
  '@/modules/broker-hierarchy/broker-hierarchy.resolver',
  '@/modules/onboarding/onboarding.resolver',
  '@/modules/tenancy/tenancy.resolver',
  '@/modules/execution-gateway/execution-gateway.resolver',
  '@/modules/compliance/compliance.resolver',
  '@/modules/risk-policy/risk-policy.resolver',
  '@/modules/settlement/settlement.resolver',
  '@/modules/reconciliation/reconciliation.resolver',
  '@/modules/corporate-actions/corporate-actions.resolver',
  '@/modules/limits-and-controls/limits-and-controls.resolver',
  '@/modules/saas-control-plane/saas-control-plane.resolver',
  '@/modules/realtime/prana-stream/realtime.resolver',
  '@/modules/dealing/dealing.resolver',
  '@/modules/support/support.resolver',
  '@/modules/partners/partners.resolver',
  '@/modules/developer-platform/developer-platform.resolver',
  '@/modules/demo-accounts/demo-accounts.resolver',
  '@/modules/copy-trading/copy-trading.resolver',
  '@/modules/pamm/pamm.resolver',
  '@/modules/lp-routing/lp-routing.resolver',
  '@/modules/crm/crm.resolver',
  '@/modules/promotions/promotions.resolver',
  '@/modules/reports/reports.resolver',
  '@/modules/rules-engine/rules-engine.resolver',
];

async function generate() {
  const resolvers = resolverPaths.map((p) => {
    // Dynamically import each resolver module
    const module = require(p);
    // Get the default export or the only export
    return module.default ?? Object.values(module)[0];
  });

  const schema: GraphQLSchema = await buildSchema({
    resolvers: resolvers as any[],
    validate: false,
    dateScalarMode: 'isoDate',
  });

  const { printSchema } = await import('graphql');
  const schemaString = printSchema(schema);

  writeFileSync(outputPath, schemaString, 'utf-8');

  const typeCount = (schemaString.match(/^type /gm) ?? []).length;
  const enumCount = (schemaString.match(/^enum /gm) ?? []).length;
  console.log(`[generate-schema] Schema written to ${outputPath}`);
  console.log(`[generate-schema] Types: ${typeCount}, Enums: ${enumCount}`);
}

generate().catch((err) => {
  console.error('[generate-schema] FAILED:', err);
  process.exit(1);
});
```

---

- [ ] **Step 3: Update autoSchemaFile path in app.module.ts**

Modify: `apps/backend/src/app.module.ts` line 67

```ts
// OLD
autoSchemaFile: join(process.cwd(), 'src/generated/schema.gql'),

// NEW
autoSchemaFile: join(process.cwd(), '../../libs/shared/graphql-schema/schema.gql'),
```

Keep `sortSchema: true`.

---

- [ ] **Step 4: Read apps/backend/package.json, find scripts section, add scripts**

Modify: `apps/backend/package.json` — append to scripts:

```json
"graphql:schema": "npx ts-node apps/backend/src/scripts/generate-schema.ts",
"predev": "npm run graphql:schema"
```

---

- [ ] **Step 5: Add pre-start schema generation to main.ts**

Read: `apps/backend/src/main.ts`

Find the bootstrap function or the line before `app.listen()`. Add:

```ts
// Ensure GraphQL schema exists before serving
import { execSync } from 'child_process';
try {
  execSync('npx ts-node apps/backend/src/scripts/generate-schema.ts', {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
  console.log('[bootstrap] GraphQL schema generated');
} catch (e) {
  console.warn('[bootstrap] Schema generation skipped:', (e as Error).message);
}
```

Place this before `await app.listen(PORT)`.

---

- [ ] **Step 6: Run schema generation and verify**

Run: `cd /home/amansharma/Desktop/DevOPS/Obsidian && npx ts-node apps/backend/src/scripts/generate-schema.ts 2>&1`

Expected: "Schema written to .../schema.gql" + type/enum counts

---

- [ ] **Step 7: Verify schema file exists and has content**

Run: `wc -l libs/shared/graphql-schema/schema.gql`

Expected: >100 lines

---

- [ ] **Step 8: Commit**

```bash
git add apps/backend/src/scripts/generate-schema.ts apps/backend/src/app.module.ts apps/backend/src/main.ts apps/backend/package.json
git commit -m "feat(backend): add schema generation script -> shared graphql-schema"
```

---

## TASK 2: Shared Schema Package

**Files:**
- Create: `libs/shared/graphql-schema/package.json`
- Create: `libs/shared/graphql-schema/README.md`

---

- [ ] **Step 1: Create package.json**

Create: `libs/shared/graphql-schema/package.json`

```json
{
  "name": "@obsidian/graphql-schema",
  "version": "1.0.0",
  "description": "Committed GraphQL schema -- source of truth for all frontend consumers",
  "main": "schema.gql",
  "files": ["schema.gql"],
  "keywords": ["graphql", "obsidian"],
  "license": "UNLICENSED",
  "private": true
}
```

---

- [ ] **Step 2: Create README.md**

Create: `libs/shared/graphql-schema/README.md`

```markdown
# @obsidian/graphql-schema

**Owner: Backend team.** All changes go through the backend PR pipeline.

## Schema Update Workflow

1. Backend resolver is added/modified on a feature branch
2. CI / pre-commit runs `npm run graphql:schema`
3. `schema.gql` is updated -- git diff shows exactly what changed
4. PR review includes schema diff as part of the backend review
5. On `main` merge, schema is committed
6. Frontend teams run `npm run codegen` to regenerate typed hooks

## For Frontend Developers

Do NOT edit `schema.gql` manually. It is machine-generated.

To regenerate types:
```bash
cd apps/web && npm run codegen
```

Codegen produces `gql/generated/graphql.ts` (types) and `gql/generated/hooks.ts` (React hooks).
```

---

- [ ] **Step 3: Commit**

```bash
git add libs/shared/graphql-schema/
git commit -m "feat(shared): add @obsidian/graphql-schema package with update workflow"
```

---

## TASK 3: Web Apollo Client Setup

**Dependency:** TASK 1 must complete first (schema must exist for codegen to validate).
**Files:**
- Modify: `package.json` (add dependencies)
- Create: `apps/web/gql/client/cookie.ts`
- Create: `apps/web/gql/client/auth-link.ts`
- Create: `apps/web/gql/client/error-link.ts`
- Create: `apps/web/gql/client/cache-policies.ts`
- Create: `apps/web/gql/client/apollo-client.ts`
- Create: `apps/web/gql/client/apollo-provider.tsx`
- Modify: `apps/web/app/layout.tsx` (mount ApolloProviderWrapper)
- Modify: `apps/web/next.config.js` (add /graphql rewrite)

---

- [ ] **Step 1: Read root package.json, find dependencies section, add deps**

Modify: `package.json` — add to `dependencies`:

```json
"@apollo/client": "^3.13.0",
"graphql": "^16.14.0"
```

Add to `devDependencies`:

```json
"@graphql-codegen/cli": "^6.0.0",
"@graphql-codegen/typescript": "^4.0.0",
"@graphql-codegen/typescript-operations": "^4.0.0",
"@graphql-codegen/typescript-react-apollo": "^4.0.0",
"@graphql-codegen/near-operation-file-preset": "^3.0.0"
```

---

- [ ] **Step 2: Create cookie helper**

Create: `apps/web/gql/client/cookie.ts`

```ts
/**
 * File:        apps/web/gql/client/cookie.ts
 * Module:      web · GraphQL
 * Purpose:     SSR-safe browser cookie read.
 *
 * Exports:
 *   - getCookie(name: string) -> string | null
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\\/+^])/g, '\\$1') + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}
```

---

- [ ] **Step 3: Create auth-link.ts**

Create: `apps/web/gql/client/auth-link.ts`

```ts
/**
 * File:        apps/web/gql/client/auth-link.ts
 * Module:      web · GraphQL
 * Purpose:     Apollo setContext link -- reads access_token and tenant_code
 *              cookies on every outgoing request and injects them as headers.
 *
 * Exports:
 *   - createAuthLink() -> AuthLink (Apollo Link)
 *
 * Depends on:
 *   - @apollo/client/link/context -> setContext
 *   - cookie.ts -> getCookie
 *
 * Side-effects: none (read-only)
 *
 * Key invariants:
 *   - SSR-safe: cookies only read on client (typeof window guard)
 *   - Does not overwrite Authorization if already set
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

import { setContext } from '@apollo/client/link/context';
import { getCookie } from './cookie';

export function createAuthLink() {
  return setContext((_, { headers }) => {
    if (typeof window === 'undefined') return { headers };

    const token = getCookie('access_token');
    const tenantCode = getCookie('tenant_code');

    return {
      headers: {
        ...headers,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(tenantCode ? { 'x-tenant-id': tenantCode } : {}),
      },
    };
  });
}
```

---

- [ ] **Step 4: Create error-link.ts**

Create: `apps/web/gql/client/error-link.ts`

```ts
/**
 * File:        apps/web/gql/client/error-link.ts
 * Module:      web · GraphQL
 * Purpose:     Apollo ErrorLink -- classifies GraphQL errors by extension code
 *              and routes to appropriate UI response.
 *
 * Exports:
 *   - createErrorLink() -> ErrorLink (Apollo Link)
 *
 * Depends on:
 *   - @apollo/client/link/error -> onError
 *   - @obsidian/obsidian-ui -> toast
 *
 * Side-effects: May redirect to /login (401) or show toast (403/500)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

import { onError } from '@apollo/client/link/error';
// Import toast from the design system -- verify the actual import path
// from @obsidian/obsidian-ui
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let toast: any;
try {
  toast = require('@obsidian/obsidian-ui').toast;
} catch {
  // Fallback if design system toast not available
  toast = {
    error: (msg: string) => console.error('[toast]', msg),
  };
}

export function createErrorLink() {
  return onError(({ graphQLErrors, networkError, forward }) => {
    if (graphQLErrors) {
      for (const err of graphQLErrors) {
        const code = err.extensions?.code as string | undefined;
        const originalError = err.extensions?.originalError as { statusCode?: number } | undefined;
        const statusCode = originalError?.statusCode ?? (err.extensions as any)?.statusCode;

        // 401: clear session, redirect to login
        if (code === 'UNAUTHENTICATED' || statusCode === 401) {
          console.warn('[error-link] UNAUTHENTICATED -- redirecting to /login');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return;
        }

        // 403: toast permission error, stay on page
        if (code === 'FORBIDDEN' || statusCode === 403) {
          toast.error(err.message || 'You do not have permission for this action', { duration: 5000 });
          return;
        }

        // 400: let calling component handle field-level errors
        if (code === 'BAD_USER_INPUT' || statusCode === 400) {
          console.warn('[error-link] BAD_USER_INPUT:', err.message);
          return;
        }

        // 500+: server error toast
        if (statusCode && statusCode >= 500) {
          toast.error('Something went wrong. Please try again.', { duration: 6000 });
          return;
        }

        // Unknown error: log + toast
        console.error('[error-link] GraphQL error:', code, err.message);
        toast.error(err.message || 'An unexpected error occurred', { duration: 5000 });
      }
    }

    if (networkError) {
      console.error('[error-link] Network error:', networkError);
      toast.error('Connection lost. Please check your network.', { duration: 0 });
    }
  });
}
```

---

- [ ] **Step 5: Create cache-policies.ts**

Create: `apps/web/gql/client/cache-policies.ts`

```ts
/**
 * File:        apps/web/gql/client/cache-policies.ts
 * Module:      web · GraphQL
 * Purpose:     Named Apollo cache policy constants for consistent per-query caching.
 *
 * Exports:
 *   - CachePolicy (type alias for WatchQueryOptions['fetchPolicy'])
 *   - policies: { cacheFirst, cacheAndNetwork, networkOnly, noCache }
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

import type { WatchQueryOptions } from '@apollo/client';

export type CachePolicy = WatchQueryOptions['fetchPolicy'];

export const policies = {
  /** Static/rarely changing -- instruments, account config, RBAC roles */
  cacheFirst: 'cache-first' as CachePolicy,
  /** User-facing data that should refresh: positions, balances, orders */
  cacheAndNetwork: 'cache-and-network' as CachePolicy,
  /** Always fresh: live prices, fills (phase 2 subscriptions) */
  networkOnly: 'network-only' as CachePolicy,
  /** Never cached: mutations */
  noCache: 'no-cache' as CachePolicy,
} as const;
```

---

- [ ] **Step 6: Create apollo-client.ts**

Create: `apps/web/gql/client/apollo-client.ts`

```ts
/**
 * File:        apps/web/gql/client/apollo-client.ts
 * Module:      web · GraphQL
 * Purpose:     Factory -- builds ApolloClient instance composing HttpLink +
 *              AuthLink + ErrorLink + InMemoryCache with Relay-style pagination.
 *
 * Exports:
 *   - createApolloClient() -> ApolloClient (singleton per browser session)
 *   - getClient() -> ApolloClient (SSR-safe: returns new client on server,
 *              singleton on client)
 *
 * Depends on:
 *   - auth-link.ts, error-link.ts
 *   - @apollo/client
 *
 * Side-effects: Creates singleton on client; new instance per server request
 *
 * Key invariants:
 *   - uri is /graphql (Next.js rewrites -> backend localhost:3000)
 *   - cache uses typePolicies for composite keys (typename + id)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
} from '@apollo/client';
import { createAuthLink } from './auth-link';
import { createErrorLink } from './error-link';

let _client: ApolloClient<object> | null = null;

export function createApolloClient() {
  const httpLink = new HttpLink({
    uri: '/graphql',
    credentials: 'same-origin',
  });

  const authLink = createAuthLink();
  const errorLink = createErrorLink();

  const link = ApolloLink.from([authLink, errorLink, httpLink]);

  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Relay-style cursor pagination -- merge not replace
          orders: { merge: true },
          positions: { merge: true },
          notifications: { merge: true },
          transactions: { merge: true },
        },
      },
      // Cache key: __typename + id for all entities
      Account: { keyFields: ['id'] },
      Position: { keyFields: ['id'] },
      Order: { keyFields: ['id'] },
      Instrument: { keyFields: ['id'] },
      Notification: { keyFields: ['id'] },
    },
  });

  return new ApolloClient({
    link,
    cache,
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' },
      query: { fetchPolicy: 'cache-first', errorPolicy: 'all' },
      mutate: { errorPolicy: 'all' },
    },
  });
}

export function getClient() {
  if (typeof window === 'undefined') {
    // Server-side: new client per request, no auth (server session handles it)
    return new ApolloClient({
      link: new HttpLink({ uri: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/graphql' }),
      cache: new InMemoryCache(),
    });
  }
  if (!_client) {
    _client = createApolloClient();
  }
  return _client;
}
```

---

- [ ] **Step 7: Create apollo-provider.tsx**

Create: `apps/web/gql/client/apollo-provider.tsx`

```ts
/**
 * File:        apps/web/gql/client/apollo-provider.tsx
 * Module:      web · GraphQL
 * Purpose:     'use client' -- mounts ApolloProvider with the configured client
 *              and wraps children in a GraphQLErrorBoundary.
 *
 * Exports:
 *   - ApolloProviderWrapper(props) -> JSX.Element
 *
 * Depends on:
 *   - apollo-client.ts -> getClient()
 *   - @apollo/client -> ApolloProvider
 *
 * Side-effects: Mounts ApolloProvider React context
 *
 * Key invariants:
 *   - MUST be 'use client' component
 *   - Placed in layout.tsx inside AuthProvider (client) tree
 *   - ErrorBoundary renders Obsidian dark terminal error state on failure
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

'use client';

import React, { Component, type ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client';
import { getClient } from './apollo-client';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class GraphQLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: 'var(--bg-primary, #0a0c10)',
            color: 'var(--text-primary, #e2e8f0)',
            fontFamily: 'var(--font-ui, monospace)',
            padding: '2rem',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>GraphQL Error</h1>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', textAlign: 'center' }}>
            Something went wrong with the data layer.<br />Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ApolloProviderWrapper({ children }: Props) {
  const client = getClient();
  return (
    <ApolloProvider client={client}>
      <GraphQLErrorBoundary>{children}</GraphQLErrorBoundary>
    </ApolloProvider>
  );
}
```

---

- [ ] **Step 8: Update layout.tsx to mount ApolloProviderWrapper**

Read: `apps/web/app/layout.tsx`

Find the AuthProvider wrapping. Change:

```tsx
// BEFORE
<AuthProvider>
  <BrandProvider>{children}</BrandProvider>
</AuthProvider>

// AFTER
<AuthProvider>
  <ApolloProviderWrapper>
    <BrandProvider>{children}</BrandProvider>
  </ApolloProviderWrapper>
</AuthProvider>
```

`ApolloProviderWrapper` is `'use client'` so it must live inside the `AuthProvider` client tree (RootLayout is server, AuthProvider is client boundary).

---

- [ ] **Step 9: Update next.config.js -- add /graphql rewrite**

Read: `apps/web/next.config.js`

Find the rewrites function. Add to the array:

```js
{ source: '/graphql', destination: 'http://localhost:3000/graphql' }
```

Add it before the catch-all `/api/:path*` rewrite.

---

- [ ] **Step 10: Commit**

```bash
git add apps/web/gql/client/ apps/web/app/layout.tsx apps/web/next.config.js package.json
git commit -m "feat(web): add Apollo Client with auth injection + error handling"
```

---

## TASK 4: graphql-codegen Setup

**Dependency:** TASK 3 must complete first (Apollo must be installed before codegen runs).
**Files:**
- Create: `apps/web/codegen.ts`
- Create: `apps/web/gql/operations/auth/getMe.gql`
- Create: `apps/web/gql/operations/market/getWatchlists.gql`
- Create: `apps/web/gql/operations/oms/getOrders.gql`
- Create: `apps/web/gql/operations/oms/placeOrder.gql`
- Modify: `package.json` (add codegen scripts)
- Generate: `apps/web/gql/generated/graphql.ts` (codegen output)
- Generate: `apps/web/gql/generated/hooks.ts` (codegen output)

---

- [ ] **Step 1: Create codegen.ts**

Create: `apps/web/codegen.ts`

```ts
/**
 * File:        apps/web/codegen.ts
 * Module:      web · GraphQL
 * Purpose:     graphql-codegen configuration -- reads the shared schema and
 *              .gql operation files, generates TypeScript types + typed React hooks.
 *
 * Generated outputs (DO NOT EDIT -- machine generated):
 *   - gql/generated/graphql.ts  -- all schema types
 *   - gql/generated/hooks.ts    -- typed useQuery/useMutation hooks
 *
 * Run:  npm run codegen (from repo root)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Schema: absolute path to shared backend-owned schema
  schema: '/home/amansharma/Desktop/DevOPS/Obsidian/libs/shared/graphql-schema/schema.gql',

  // Documents: .gql operation strings (co-located with feature lib)
  documents: [
    'apps/web/gql/operations/**/*.gql',
    'apps/web/features/**/*.gql',
  ],

  // Generates two outputs in one pass
  generates: {
    // Types: all schema scalar + object types as TypeScript interfaces
    'apps/web/gql/generated/graphql.ts': {
      plugins: ['typescript'],
      config: {
        namingConvention: 'keep-case',
        defaultScalarType: 'unknown',
        scalars: {
          DateTime: 'string',
          UUID: 'string',
          JSON: 'unknown',
          Void: 'void',
          BigInt: 'number',
          Decimal: 'string',
        },
      },
    },

    // Hooks: one hook per .gql file (near-operation-file preset)
    'apps/web/gql/generated/hooks.ts': {
      preset: 'near-operation-file',
      presetConfig: {
        extension: '.ts',
        importPath: '@apollo/client',
      },
      plugins: ['typescript-operations', 'typescript-react-apollo'],
      config: {
        withHooks: true,
        withComponent: false,
        withMutationFn: true,
        strictScalars: true,
      },
    },
  },

  hooks: {
    afterAllFileWrite: ['npx prettier --write'],
  },

  failOnConflict: true,
};

export default config;
```

---

- [ ] **Step 2: Create operation files**

Create: `apps/web/gql/operations/auth/getMe.gql`

```graphql
query GetMe {
  me {
    id
    email
    role
    tenant {
      id
      code
      name
    }
  }
}
```

Create: `apps/web/gql/operations/market/getWatchlists.gql`

```graphql
query GetWatchlists {
  watchlists {
    edges {
      node {
        id
        name
        isDefault
        items {
          edges {
            node {
              id
              instrument {
                id
                symbol
                name
                category
                digits
                bid
                ask
                change
                changePct
              }
            }
          }
        }
      }
    }
  }
}
```

Create: `apps/web/gql/operations/oms/getOrders.gql`

```graphql
query GetOrders($accountId: ID!, $status: OrderStatus, $limit: Int) {
  orders(accountId: $accountId, status: $status, limit: $limit) {
    edges {
      node {
        id
        clientOrderId
        side
        type
        status
        quantity
        filledQty
        price
        avgFillPrice
        instrument {
          symbol
          name
        }
        createdAt
        updatedAt
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

Create: `apps/web/gql/operations/oms/placeOrder.gql`

```graphql
mutation PlaceOrder($input: PlaceOrderInput!) {
  placeOrder(input: $input) {
    id
    clientOrderId
    status
    message
    createdAt
  }
}
```

---

- [ ] **Step 3: Add codegen scripts to package.json**

Read: `package.json` — find scripts section, add:

```json
"codegen:web": "cd apps/web && npx graphql-codegen",
"codegen": "npm run codegen:web",
"prebuild": "npm run codegen"
```

---

- [ ] **Step 4: Run codegen**

Run: `cd /home/amansharma/Desktop/DevOPS/Obsidian && npm run codegen 2>&1`

Expected: `graphql.ts` + `hooks.ts` generated in `apps/web/gql/generated/`

If path errors: verify the schema path in codegen.ts matches the actual file location.

---

- [ ] **Step 5: Verify generated files**

Run: `head -30 apps/web/gql/generated/graphql.ts`

Expected: TypeScript types generated from schema (no errors)

---

- [ ] **Step 6: Commit**

```bash
git add apps/web/codegen.ts apps/web/gql/generated/ apps/web/gql/operations/ package.json
git commit -m "feat(web): add graphql-codegen config + initial operation files"
```

---

## TASK 5: Migrate Trading Terminal to GraphQL

**Dependency:** TASK 4 must complete first (codegen hooks must exist).
**Files:**
- Create: `apps/web/gql/operations/trading-terminal/getMarketData.gql`
- Create: `apps/web/gql/operations/trading-terminal/placeOrder.gql`
- Create: `apps/web/features/trading-terminal/lib/gql-service.ts`
- Modify: `apps/web/features/trading-terminal/components/trading-workstation.tsx`
- Modify: `apps/web/features/trading-terminal/index.ts`

---

- [ ] **Step 1: Read existing trading terminal files**

Read: `apps/web/features/trading-terminal/index.ts` (component entry point)
Read: `apps/web/features/trading-terminal/components/trading-workstation.tsx` (main component)

---

- [ ] **Step 2: Create trading terminal GraphQL operations**

Create: `apps/web/gql/operations/trading-terminal/getMarketData.gql`

```graphql
query GetMarketData($accountId: ID!) {
  account(id: $accountId) {
    id
    balances {
      equity
      margin
      freeMargin
      leverage
      currency
    }
    positions {
      edges {
        node {
          id
          instrumentId
          side
          quantity
          entryPrice
          currentPrice
          unrealizedPnl
          unrealizedPnlPct
          margin
          swap
        }
      }
    }
  }
  instruments(category: FX, limit: 100) {
    edges {
      node {
        id
        symbol
        name
        category
        bid
        ask
        change
        changePct
        high
        low
        spread
        pip
        digits
      }
    }
  }
}
```

Create: `apps/web/gql/operations/trading-terminal/placeOrder.gql`

```graphql
mutation PlaceOrder($input: PlaceOrderInput!) {
  placeOrder(input: $input) {
    id
    clientOrderId
    status
    message
    filledQty
    avgFillPrice
    createdAt
  }
}
```

---

- [ ] **Step 3: Create gql-service.ts for trading terminal**

Create: `apps/web/features/trading-terminal/lib/gql-service.ts`

```ts
/**
 * File:        apps/web/features/trading-terminal/lib/gql-service.ts
 * Module:      web · trading-terminal
 * Purpose:     GraphQL data access layer -- wraps codegen'd hooks with
 *              feature-specific logic, cache policies, and error mapping.
 *
 * Exports:
 *   - useMarketData(accountId)    -> { data, loading, error }
 *   - usePlaceOrder()             -> { placeOrder, loading, error }
 *   - MARKET_DATA_QUERY           -> gql document (for useQuery directly)
 *   - PLACE_ORDER_MUTATION        -> gql document (for useMutation directly)
 *
 * Depends on:
 *   - @apollo/client -> useQuery, useMutation, gql
 *
 * Side-effects: none (pure React hooks)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

import { useQuery, useMutation, gql } from '@apollo/client';

// --- Market Data Query ---
export const MARKET_DATA_QUERY = gql`
  query GetMarketData($accountId: ID!) {
    account(id: $accountId) {
      id
      balances {
        equity
        margin
        freeMargin
        leverage
        currency
      }
      positions {
        edges {
          node {
            id
            instrumentId
            side
            quantity
            entryPrice
            currentPrice
            unrealizedPnl
            unrealizedPnlPct
            margin
            swap
          }
        }
      }
    }
    instruments(category: FX, limit: 100) {
      edges {
        node {
          id
          symbol
          name
          category
          bid
          ask
          change
          changePct
          high
          low
          spread
          pip
          digits
        }
      }
    }
  }
`;

export function useMarketData(accountId: string) {
  return useQuery(MARKET_DATA_QUERY, {
    variables: { accountId },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });
}

// --- Place Order Mutation ---
export const PLACE_ORDER_MUTATION = gql`
  mutation PlaceOrder($input: PlaceOrderInput!) {
    placeOrder(input: $input) {
      id
      clientOrderId
      status
      message
      filledQty
      avgFillPrice
      createdAt
    }
  }
`;

export function usePlaceOrder() {
  return useMutation(PLACE_ORDER_MUTATION, {
    refetchQueries: [{ query: MARKET_DATA_QUERY, variables: {} }],
    awaitRefetchQueries: true,
  });
}
```

---

- [ ] **Step 4: Update trading-workstation.tsx -- migrate from REST to GraphQL**

Read: `apps/web/features/trading-terminal/components/trading-workstation.tsx`

The component currently uses `fetchJson` from `workstation-api.ts` for:
1. Market data (watchlists, instruments)
2. Order submission

Replace the REST calls with GraphQL hooks:

```tsx
// In the component body, replace:
const [instruments, setInstruments] = useState<Instrument[]>(baseInstruments);
const [positions, setPositions] = useState<Position[]>([]);
const [loading, setLoading] = useState(true);

// With:
const accountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID ?? '';
const { data, loading, error } = useMarketData(accountId);
const [placeOrder, { loading: ordering }] = usePlaceOrder();

// Extract from data:
const instruments = data?.instruments?.edges?.map((e) => e.node) ?? baseInstruments;
const positions = data?.account?.positions?.edges?.map((e) => e.node) ?? [];
const balances = data?.account?.balances;

// For order submission, replace submitOrderToOms with:
const handlePlaceOrder = async (uiOrder: PlaceUiOrder) => {
  const result = await placeOrder({ variables: { input: { ... } } });
  // handle result.data.placeOrder
};
```

Keep the existing UI structure (price table, order form, watchlist panel) intact. Only swap the data source from REST fetchJson to GraphQL useQuery.

---

- [ ] **Step 5: Verify TypeScript compilation**

Run: `cd /home/amansharma/Desktop/DevOPS/Obsidian && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -30`

Fix any type mismatches.

---

- [ ] **Step 6: Commit**

```bash
git add apps/web/gql/operations/trading-terminal/ apps/web/features/trading-terminal/
git commit -m "feat(web): migrate trading terminal from REST to GraphQL"
```

---

## TASK 6: Backend Auth Guard -- Dual Auth Support

**Files:**
- Find and modify: `apps/backend/src/common/guards/auth.guard.ts`

---

- [ ] **Step 1: Find the existing auth guard**

Run: `find apps/backend/src -name '*.guard.ts' | xargs grep -l "AuthGuard\|@UseGuards" 2>/dev/null | head -5`

Read the relevant guard file.

---

- [ ] **Step 2: Update auth guard to support both header and cookie**

The guard's `canActivate` or `validate` method should:
1. Try `req.headers.authorization` first (Bearer token)
2. Fall back to parsing `req.headers.cookie` for `access_token`

```ts
// After reading Bearer token:
const authHeader = req.headers.authorization;
if (authHeader?.startsWith('Bearer ')) {
  const token = authHeader.slice(7);
  return this.validateToken(token);
}

// Fall back to cookie
const cookieHeader = req.headers.cookie;
if (cookieHeader) {
  const match = cookieHeader.match(/access_token=([^;]+)/);
  if (match) return this.validateToken(match[1]);
}

// No valid auth
return false;
```

Read the full guard file first, understand the validateToken method, then add cookie support.

---

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/common/guards/
git commit -m "feat(auth): support both Bearer header and cookie auth in GraphQL guard"
```

---

## TASK 7: Quality Gates + Final Push

**Dependency:** All previous tasks must complete first.

---

- [ ] **Step 1: Run schema generation**

Run: `cd /home/amansharma/Desktop/DevOPS/Obsidian && npm run graphql:schema 2>&1`

---

- [ ] **Step 2: Run codegen**

Run: `npm run codegen 2>&1`

---

- [ ] **Step 3: TypeScript check**

Run: `cd /home/amansharma/Desktop/DevOPS/Obsidian && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -30`

---

- [ ] **Step 4: Lint check**

Run: `npm run lint -- --projects=web 2>&1 | head -30`

---

- [ ] **Step 5: Header check**

Run: `npm run check:headers 2>&1 | head -20`

---

- [ ] **Step 6: Build check**

Run: `cd /home/amansharma/Desktop/DevOPS/Obsidian && npx nx build web 2>&1 | tail -20`

---

- [ ] **Step 7: Cycle check**

Run: `npm run check:cycles 2>&1 | head -10`

---

- [ ] **Step 8: Final push**

```bash
git pull --rebase
git push
git status
# Must show clean
```

---

## Dependency Graph

```
TASK 1 (Backend Schema Gen) ──> TASK 2 (Shared Package)
        │
        └─────> TASK 3 (Web Apollo Setup) ──> TASK 4 (Codegen) ──> TASK 5 (Feature Migration)
                                        │
                                        └────────> TASK 6 (Auth Guard)
                                                    │
                                                    └──> TASK 7 (Quality Gates + Push)
```

**Parallel groups:**
- TASK 1 can start immediately
- TASK 2 runs in parallel with TASK 1
- TASK 3 runs in parallel with TASK 1 (they're independent of each other)
- TASK 4 depends on TASK 1 + TASK 3
- TASK 5 depends on TASK 4
- TASK 6 depends on TASK 1
- TASK 7 depends on all previous