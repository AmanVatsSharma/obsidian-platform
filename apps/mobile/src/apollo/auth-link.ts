/**
 * File:        apps/mobile/src/apollo/auth-link.ts
 * Module:      mobile · Apollo · Auth
 * Purpose:     Apollo auth link — injects the current access token from
 *              `expo-secure-store` (via the sync cache primed at app boot)
 *              into every outgoing GraphQL request as a `Bearer`
 *              `Authorization` header. The mobile counterpart to
 *              `apps/web/gql/client/auth-link.ts`; the web reads the
 *              access_token from an httpOnly cookie, mobile reads it
 *              from the in-memory token cache populated by
 *              `secure-store.primeAccessTokenCache()`.
 *
 * Exports:
 *   - createAuthLink() → ApolloLink   — auth middleware link
 *
 * Depends on:
 *   - @apollo/client/link/context — setContext
 *   - ../auth/secure-store        — loadAccessTokenSync
 *
 * Side-effects:
 *   - none (pure link — no network calls)
 *
 * Key invariants:
 *   - Only sets `Authorization` when a token is in the cache. Allows
 *     unauthenticated introspection / health queries to pass through
 *     without a header — the backend treats a missing header as
 *     unauthenticated and the error link will route the user back to
 *     the login screen.
 *   - The link MUST be placed BEFORE `HttpLink` in the chain so the
 *     header is set before the HTTP request is dispatched.
 *   - We read the token via `loadAccessTokenSync()` (a module-level
 *     cache), NOT `loadTokens()` (an async secure-store read). The
 *     auth link is a synchronous middleware — awaiting inside the
 *     link would break Apollo's link contract.
 *
 * Read order:
 *   1. createAuthLink — factory function
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

import { loadAccessTokenSync } from '../auth/secure-store';

export function createAuthLink(): ApolloLink {
  return setContext((_, { headers }) => {
    const token = loadAccessTokenSync();

    const outgoingHeaders: Record<string, string> = {
      ...(headers as Record<string, string> | undefined),
    };

    if (token) {
      outgoingHeaders['Authorization'] = `Bearer ${token}`;
    }

    return { headers: outgoingHeaders };
  });
}
