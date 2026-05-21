/**
 * File:        apps/web/gql/client/auth-link.ts
 * Module:      web · GraphQL · Client
 * Purpose:     Apollo auth link — injects access_token from httpOnly cookies into
 *              every outgoing GraphQL request as a Bearer Authorization header. Runs
 *              on both server (SSR) and client contexts transparently.
 *
 * Exports:
 *   - createAuthLink() → ApolloLink   — auth middleware link for Apollo Client
 *
 * Depends on:
 *   - @apollo/client           — ApolloLink, setContext
 *   - ./cookie                 — getCookie (SSR-safe cookie reader)
 *
 * Side-effects:
 *   - none (pure link — no network calls)
 *
 * Key invariants:
 *   - Only sets Authorization when access_token cookie is present. Allows unauthenticated
 *     introspection / health queries to pass through without a header.
 *   - AuthLink must be placed BEFORE HttpLink in the link chain so the header is set
 *     before the HTTP request is dispatched.
 *
 * Read order:
 *   1. createAuthLink — factory function, returns configured ApolloLink
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

import { ApolloLink, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getCookie } from './cookie';

function createAuthLink(): ApolloLink {
  return setContext((_, { headers }) => {
    const token = getCookie('access_token');

    const outgoingHeaders: Record<string, string> = { ...headers };

    if (token) {
      outgoingHeaders['Authorization'] = `Bearer ${token}`;
    }

    return {
      headers: outgoingHeaders,
    };
  });
}

export { createAuthLink };