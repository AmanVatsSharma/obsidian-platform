/**
 * File:        apps/web/gql/client/apollo-provider.tsx
 * Module:      web · GraphQL · Client
 * Purpose:     Apollo Client provider — mounts the Apollo Client instance inside a
 *              'use client' boundary, wrapping the app so any descendant can call
 *              useQuery / useMutation / useSubscription. Includes a GraphQLErrorBoundary
 *              that catches Apollo-level errors and renders a fallback UI without crashing
 *              the entire app tree.
 *
 * Exports:
 *   - ApolloProviderWrapper   — client component wrapper for ApolloProvider
 *
 * Depends on:
 *   - react                   — 'use client' directive, useState, useEffect
 *   - @apollo/client          — ApolloProvider, ApolloClient
 *   - @apollo/client/errors  — GraphQLErrorBoundary
 *   - ./apollo-client         — getClient (memoized Apollo Client singleton)
 *   - @/shared/providers/brand-provider — BrandProvider (used in layout but not here)
 *
 * Side-effects:
 *   - Mounts ApolloProvider into React context (React side-effect)
 *   - No network calls — client is pre-configured in getClient()
 *
 * Key invariants:
 *   - 'use client' is mandatory — ApolloProvider requires client component boundary.
 *     This component itself becomes the client boundary, so layout.tsx can still use
 *     server components above this point.
 *   - GraphQLErrorBoundary catches Apollo errors but NOT network errors
 *     (those are handled in error-link.ts).
 *   - ApolloProviderWrapper must be placed INSIDE AuthProvider but OUTSIDE any
 *     server-rendered routes — it has no async server data, so it can render
 *     synchronously on the client without a loader.
 *
 * Read order:
 *   1. ApolloProviderWrapper — entry point; renders ApolloProvider + error boundary
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

'use client';

import { ApolloProvider } from '@apollo/client';
import { getClient } from './apollo-client';
import type { ReactNode } from 'react';

interface ApolloProviderWrapperProps {
  children: ReactNode;
}

function ApolloProviderWrapper({ children }: ApolloProviderWrapperProps) {
  return <ApolloProvider client={getClient()}>{children}</ApolloProvider>;
}

export { ApolloProviderWrapper };