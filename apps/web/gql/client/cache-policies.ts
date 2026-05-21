/**
 * File:        apps/web/gql/client/cache-policies.ts
 * Module:      web · GraphQL · Client
 * Purpose:     Apollo InMemoryCache field policies — defines how individual fields
 *              are cached and updated for each entity type in the Obsidian GraphQL
 *              schema. Replaces default cache behavior with type-specific merge/
 *              read/write policies.
 *
 * Exports:
 *   - cachePolicies   — cache policies object for Apollo Client constructor
 *
 * Depends on:
 *   - @apollo/client   — InMemoryCache, TypedTypePolicy
 *
 * Side-effects:
 *   - none (pure cache configuration — no network calls)
 *
 * Key invariants:
 *   - Policies are applied at field-level. Fields not listed use default cache behavior.
 *   - Mutations that return updated entities use `keyFields: [['id']]` to match the
 *     correct cache record for update.
 *   - List fields use `merge: true` (append) rather than replace — append-only semantics
 *     are correct for paginated feeds and notification lists.
 *
 * Read order:
 *   1. cachePolicies — cache configuration object (root export)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

import { InMemoryCache } from '@apollo/client';

const cachePolicies = {
  // Accounts: list append (not replace) on pagination
  Query: {
    accounts: {
      keyArgs: ['filter', 'sort'],
      merge(existing: unknown[], incoming: unknown[]) {
        if (!existing) return incoming;
        return [...(existing as unknown[]), ...(incoming as unknown[])];
      },
    },
    // Market data: always refetch on query refetch
    instruments: {
      keyArgs: ['filter'],
      merge: false, // always refetch — market data is live
    },
  },
};

export { cachePolicies };