/**
 * File:        apps/mobile/src/apollo/mock-apollo-link.ts
 * Module:      mobile · Apollo · Mock
 * Purpose:     ApolloLink that short-circuits the network chain with a
 *              generic viewer payload when `EXPO_PUBLIC_MOCK_GQL=1`. Mobile
 *              counterpart to `apps/web/shared/apollo/mock-apollo-link.ts` —
 *              NOT a re-import of the web file (the monorepo's scope tags
 *              forbid mobile → web) but the same shape, so a future Wave 2
 *              fixture map can be lifted wholesale.
 *
 * Exports:
 *   - createMockApolloLink() → ApolloLink
 *       — factory; invoked once at Apollo Client construction time.
 *       — When `isMockGraphQLEnabled()` returns false, the link forwards
 *         the operation untouched, so the production chain is identical
 *         to a chain without this link installed.
 *       — When mock mode is on, the link returns a canned viewer payload
 *         (shape: `{ __typename: 'Query', viewer: { __typename: 'Viewer',
 *         id, email, displayName } }`) for every operation. Wave 2 will
 *         extend this with an operation-name → fixture map.
 *
 * Depends on:
 *   - @apollo/client — ApolloLink, Observable, FetchResult
 *   - ./config       — isMockGraphQLEnabled
 *
 * Side-effects:
 *   - None at module load. The env read happens inside the link callback.
 *
 * Key invariants:
 *   - We never `throw` inside the Observable factory. Throwing tears down
 *     the subscription; emitting a result keeps the Apollo channel open
 *     and surfaces the failure in the standard error pipeline.
 *   - The link's behaviour is checked at call time, not at module load.
 *     A production build with `EXPO_PUBLIC_MOCK_GQL` statically falsy can
 *     dead-code-eliminate the mock branch via the bundler's env inlining.
 *   - The mock payload uses `__typename` markers so Apollo's InMemoryCache
 *     can normalize the record into the cache.
 *
 * Read order:
 *   1. createMockApolloLink — the single export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { ApolloLink, Observable } from '@apollo/client';
import type { FetchResult } from '@apollo/client';

import { isMockGraphQLEnabled } from './config';

/**
 * The canned mock viewer. Wave 2 will swap this for an operation-name
 * → fixture map (mirroring `apps/web/shared/apollo/__fixtures__/`).
 */
const MOCK_VIEWER_PAYLOAD = {
  viewer: {
    __typename: 'Viewer',
    id: 'mock-user',
    email: 'mock@obsidian.local',
    displayName: 'Mock Trader',
  },
} as const;

export function createMockApolloLink(): ApolloLink {
  return new ApolloLink((operation, forward) => {
    if (!isMockGraphQLEnabled()) {
      return forward(operation);
    }

    return new Observable<FetchResult>((observer) => {
      observer.next({ data: MOCK_VIEWER_PAYLOAD });
      observer.complete();
    });
  });
}
