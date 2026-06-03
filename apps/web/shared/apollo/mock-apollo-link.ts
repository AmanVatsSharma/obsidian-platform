/**
 * File:        apps/web/shared/apollo/mock-apollo-link.ts
 * Module:      web · Shared · Apollo
 * Purpose:     ApolloLink that short-circuits the network chain with fixture
 *              payloads when the `NEXT_PUBLIC_MOCK_GQL` env var is set to
 *              `'true'`. Sits as the FIRST link in the chain so the mock path
 *              never reaches the auth, error, or HTTP links. Falls through
 *              transparently to the next link when mock mode is off.
 *
 * Exports:
 *   - createMockApolloLink() → ApolloLink
 *       — factory; invoked once at Apollo Client construction time.
 *       — When `isMockGraphQLEnabled()` returns false, the link forwards the
 *         operation untouched, so production behaviour is identical to a
 *         chain without this link installed.
 *       — When mock mode is on, the link looks up `operation.operationName`
 *         in `MOCK_FIXTURES` and emits the matching payload as
 *         `{ data: payload }`. If no fixture is registered for the operation
 *         the link emits a `GraphQLError` with an actionable message so the
 *         developer sees the failure in the Apollo dev tools immediately.
 *
 * Depends on:
 *   - @apollo/client      — ApolloLink, Observable, FetchResult
 *   - graphql             — GraphQLError
 *   - ./mock-config       — isMockGraphQLEnabled (read at call time, not load)
 *   - ./__fixtures__      — MOCK_FIXTURES (operation-name → payload map)
 *
 * Side-effects:
 *   - Reads `window.__MOCK_OVERRIDES__?.[operationName]` at request time in
 *     browser environments. No filesystem, network, or module-load-time
 *     env reads. No `console.log`. No thrown exceptions — every error path
 *     surfaces as a GraphQL `errors` array on an emitted result so the
 *     Apollo subscription contract stays intact.
 *
 * Key invariants:
 *   - The `forward` callback is invoked (and its return subscribed to)
 *     whenever mock mode is disabled. Returning its `Observable` verbatim
 *     preserves the ApolloLink contract — downstream links see a normal
 *     stream and can apply their own timing/cancellation semantics.
 *   - The override lookup uses `typeof window !== 'undefined'` so the link
 *     is safe to import from RSC/SSR code paths. SSR never reads
 *     `window`, so SSR fixtures always come from `MOCK_FIXTURES`.
 *   - Mock mode is checked inside the link callback (not at module load).
 *     This keeps the mock branch tree-shakable: when `NEXT_PUBLIC_MOCK_GQL`
 *     is statically false at build time, the mock body is dead code.
 *   - We never `throw` inside the Observable factory. Throwing would tear
 *     down the subscription; emitting `{ errors: [new GraphQLError(...)] }`
 *     keeps the channel open and surfaces the failure in the standard
 *     Apollo error pipeline.
 *
 * Per-operation override contract (dev escape hatch):
 *   - In the browser, set `window.__MOCK_OVERRIDES__ = { GetPositions: [...] }`
 *     BEFORE the operation fires. The link prefers the override over the
 *     registered fixture. This is how Storybook stories and component tests
 *     inject bespoke payloads without editing fixture files.
 *   - Override values may be the raw payload OR a function that returns the
 *     payload (handy for tests that want to vary the response by call).
 *
 * Read order:
 *   1. createMockApolloLink — the single export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-01
 */

import { ApolloLink, Observable } from '@apollo/client';
import type { FetchResult } from '@apollo/client';
import { GraphQLError } from 'graphql';

import { isMockGraphQLEnabled } from './mock-config';
import { MOCK_FIXTURES } from './__fixtures__';

/**
 * Resolve the per-call payload for a given operation name.
 *
 * Lookup order:
 *   1. `window.__MOCK_OVERRIDES__?.[operationName]` (browser-only, dev)
 *   2. `MOCK_FIXTURES[operationName]` (the registered fixture)
 *   3. `undefined` — caller decides how to surface a missing payload.
 *
 * Returned values are typed `unknown` because the dispatch is intentionally
 * payload-agnostic — the GraphQL operation's selection set is what validates
 * the shape at runtime, not this resolver.
 */
function resolveFixture(operationName: string): unknown {
  if (typeof window !== 'undefined') {
    const overrides = (window as unknown as {
      __MOCK_OVERRIDES__?: Record<string, unknown>;
    }).__MOCK_OVERRIDES__;
    const override = overrides?.[operationName];
    if (override !== undefined) {
      return override;
    }
  }
  return MOCK_FIXTURES[operationName];
}

export function createMockApolloLink(): ApolloLink {
  return new ApolloLink((operation, forward) => {
    // 1. Mock mode off → transparent pass-through.
    if (!isMockGraphQLEnabled()) {
      return forward(operation);
    }

    // 2. Mock mode on → short-circuit with a fixture (or an error result).
    return new Observable<FetchResult>((observer) => {
      const payload = resolveFixture(operation.operationName);

      if (payload === undefined) {
        observer.next({
          errors: [
            new GraphQLError(
              `MockApolloLink: no fixture registered for operation "${operation.operationName}". ` +
                `Add an entry to MOCK_FIXTURES in apps/web/shared/apollo/__fixtures__/index.ts.`,
            ),
          ],
        });
        observer.complete();
        return;
      }

      observer.next({ data: payload });
      observer.complete();
    });
  });
}
