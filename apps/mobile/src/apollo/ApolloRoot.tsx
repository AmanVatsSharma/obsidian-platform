/**
 * File:        apps/mobile/src/apollo/ApolloRoot.tsx
 * Module:      mobile · Apollo · Provider
 * Purpose:     Thin client component wrapper around `@apollo/client`'s
 *      `ApolloProvider`. Renders the memoized `getClient()` instance
 *      once, then exposes it via React context to every descendant.
 *
 * Exports:
 *   - ApolloRoot             — client component wrapper
 *
 * Depends on:
 *   - @apollo/client  — ApolloProvider
 *   - ./client        — getClient
 *
 * Side-effects:
 *   - Mounts ApolloProvider into React context (React side-effect).
 *   - No network calls — the client is built at first invocation.
 *
 * Key invariants:
 *   - `getClient()` is memoized, so re-rendering `ApolloRoot` does not
 *     re-create the client. This is what allows the auth context's
 *     `signIn` / `signOut` mutations on the in-memory token cache to
 *     be picked up by the auth link on the very next operation.
 *   - The provider has to live ABOVE the AuthGate so the gate's
 *     GraphQL operations (e.g. `GetViewer`) have a client to call.
 *   - This component has no internal state — it is intentionally a
 *     pure passthrough.
 *
 * Read order:
 *   1. ApolloRoot — single export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { ApolloProvider } from '@apollo/client';
import type { ReactNode } from 'react';

import { getClient } from './client';

export function ApolloRoot({ children }: { children: ReactNode }): React.JSX.Element {
  return <ApolloProvider client={getClient()}>{children}</ApolloProvider>;
}
