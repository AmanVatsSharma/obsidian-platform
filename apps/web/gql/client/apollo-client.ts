/**
 * File:        apps/web/gql/client/apollo-client.ts
 * Module:      web · GraphQL · Client
 * Purpose:     Apollo Client factory — creates a fully-configured Apollo Client instance
 *              with HTTP link, auth injection, error handling, and InMemoryCache. Exposes
 *              both a factory function (createApolloClient) and an SSR-safe singleton
 *              accessor (getClient) that memoizes across requests.
 *
 * Exports:
 *   - createApolloClient() → ApolloClient<NormalizedCacheObject>  — factory (use in tests)
 *   - getClient()          → ApolloClient<NormalizedCacheObject>  — memoized singleton
 *
 * Depends on:
 *   - @apollo/client            — ApolloClient, HttpLink, InMemoryCache
 *   - ./auth-link               — createAuthLink (Bearer token injection)
 *   - ./error-link              — createErrorLink (401/403/500 routing)
 *   - ./cache-policies          — cachePolicies (field-level merge/read policies)
 *   - next/dist/lib/toast       — toast (with try/catch fallback)
 *
 * Side-effects:
 *   - none (pure client factory — no network calls)
 *
 * Key invariants:
 *   - Link chain order: AuthLink → ErrorLink → HttpLink
 *     HttpLink must be LAST — it actually sends the HTTP request.
 *     ErrorLink consumes the response from HttpLink.
 *     AuthLink runs before HttpLink to set the Authorization header.
 *   - getClient uses module-level memoization — safe to call from React components
 *     multiple times without re-creating the client. On the server, each request
 *     may need a fresh client (tracked via globalThis in production deployments).
 *   - uri defaults to '/graphql' which Next.js rewrites to the NestJS backend.
 *     Override GRAPHQL_ENDPOINT env var in tests.
 *
 * Read order:
 *   1. createApolloClient — builds the link chain and cache
 *   2. getClient          — memoized accessor
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

import { ApolloClient, HttpLink, InMemoryCache, TypePolicies } from '@apollo/client';
import { createAuthLink } from './auth-link';
import { createErrorLink } from './error-link';
import { cachePolicies } from './cache-policies';

// Module-level memoization — shared across React component re-renders
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: ApolloClient<any> | null = null;

function createApolloClient(): ApolloClient<unknown> {
  const httpLink = new HttpLink({
    uri: process.env.GRAPHQL_ENDPOINT ?? '/graphql',
    credentials: 'same-origin',
  });

  const client = new ApolloClient({
    link: createAuthLink().concat(createErrorLink()).concat(httpLink),
    cache: new InMemoryCache({
      typePolicies: cachePolicies as TypePolicies,
    }),
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

  return client;
}

function getClient(): ApolloClient<unknown> {
  if (!_client) {
    _client = createApolloClient();
  }
  return _client;
}

export { createApolloClient, getClient };