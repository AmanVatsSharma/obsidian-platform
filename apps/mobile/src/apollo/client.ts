/**
 * File:        apps/mobile/src/apollo/client.ts
 * Module:      mobile · Apollo · Client
 * Purpose:     Apollo Client factory and memoized singleton for the
 *              mobile app. Mirrors the link chain shape used by the
 *              web trader terminal in `apps/web/gql/client/apollo-client.ts`
 *              so a future Wave 2 operation can be lifted to a shared
 *              `apps/mobile/src/graphql/operations/<name>.gql` file
 *              without re-thinking the chain.
 *
 * Exports:
 *   - createApolloClient() → ApolloClient<unknown>  — factory (used in tests)
 *   - getClient()          → ApolloClient<unknown>  — module-level singleton
 *
 * Depends on:
 *   - @apollo/client       — ApolloClient, HttpLink, InMemoryCache
 *   - ./config             — getGraphQLEndpoint, isMockGraphQLEnabled
 *   - ./mock-apollo-link   — createMockApolloLink
 *   - ./auth-link          — createAuthLink
 *   - ./error-link         — createErrorLink
 *
 * Side-effects:
 *   - none (pure client factory — no network calls at construction)
 *
 * Key invariants:
 *   - Link chain order: MockLink → AuthLink → ErrorLink → HttpLink
 *     MockLink first so it can short-circuit the network when
 *     `EXPO_PUBLIC_MOCK_GQL=1`. AuthLink before HttpLink so the
 *     `Authorization` header is attached before the request is sent.
 *     ErrorLink after HttpLink so it can read the response envelope.
 *   - `getClient` uses module-level memoization so React re-renders
 *     never re-create the client. The token cache is shared too —
 *     `signIn`/`signOut` mutate the in-memory token cache that the
 *     auth link reads on every operation.
 *   - `defaultOptions.watchQuery.fetchPolicy` is `cache-and-network` —
 *     same as web — so a quote that changed since the last render
 *     surfaces immediately when the user navigates back to the tab.
 *
 * Read order:
 *   1. createApolloClient — builds the link chain and cache
 *   2. getClient          — memoized accessor
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
} from '@apollo/client';

import { createAuthLink } from './auth-link';
import { createErrorLink } from './error-link';
import { createMockApolloLink } from './mock-apollo-link';
import { getGraphQLEndpoint } from './config';

let _client: ApolloClient<unknown> | null = null;

export function createApolloClient(): ApolloClient<unknown> {
  const httpLink = new HttpLink({
    uri: getGraphQLEndpoint(),
  });

  const link = createMockApolloLink()
    .concat(createAuthLink())
    .concat(createErrorLink())
    .concat(httpLink);

  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  });
}

export function getClient(): ApolloClient<unknown> {
  if (!_client) {
    _client = createApolloClient();
  }
  return _client;
}
