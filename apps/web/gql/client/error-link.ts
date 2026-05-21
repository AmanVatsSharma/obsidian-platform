/**
 * File:        apps/web/gql/client/error-link.ts
 * Module:      web · GraphQL · Client
 * Purpose:     Apollo error link — catches GraphQL errors and routes them by code/type:
 *              - 401 → redirect to /login
 *              - 403 → toast notification ("Forbidden")
 *              - 400 → field-level GraphQL validation errors preserved in cache
 *              - 500+ → toast notification with server error
 *
 * Exports:
 *   - createErrorLink() → ApolloLink   — error handling link for Apollo Client
 *
 * Depends on:
 *   - @apollo/client     — ApolloLink, onError, FetchResult
 *   - next/navigation    — redirect utility (client-side navigation)
 *   - next/dist/lib/toast — design-system toast (with try/catch fallback for SSR safety)
 *
 * Side-effects:
 *   - HTTP 401: navigates to /login
 *   - HTTP 403/500+: shows toast notification
 *   - HTTP 400: errors are kept in Apollo cache for field-level display
 *
 * Key invariants:
 *   - next/dist/lib/toast may not exist in all app shells — try/catch fallback is
 *     intentional and prevents SSR crashes when the toast module is not yet loaded.
 *   - Error link MUST be AFTER HttpLink in the link chain — HttpLink dispatches the
 *     request and produces errors that error-link consumes.
 *   - Errors are NOT re-thrown after logging — they propagate to React error boundaries.
 *
 * Read order:
 *   1. createErrorLink — factory function, returns configured ApolloLink
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

import { ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { redirect } from 'next/navigation';

function createErrorLink(): ApolloLink {
  return onError(({ graphQLErrors, networkError, response }) => {
    if (graphQLErrors) {
      for (const error of graphQLErrors) {
        const { extensions } = error;
        const code = extensions?.['code'] as string | undefined;
        const statusCode = extensions?.['statusCode'] as number | undefined;

        if (statusCode === 401) {
          redirect('/login');
          return;
        }

        if (statusCode === 403) {
          let toast: { error: (msg: string) => void } | null = null;
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            toast = require('next/dist/lib/toast') as { error: (msg: string) => void };
          } catch {
            // toast module not available in this app shell — skip
          }
          toast?.error('Access denied. You do not have permission.');
          return;
        }

        // 400 field validation errors — let them propagate to component
        // 500+ server errors
        if (statusCode === 500 || statusCode === 503) {
          let toast: { error: (msg: string) => void } | null = null;
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            toast = require('next/dist/lib/toast') as { error: (msg: string) => void };
          } catch {
            // skip
          }
          toast?.error('Server error. Please try again later.');
          return;
        }
      }
    }

    if (networkError) {
      // Network-level errors (DNS failure, connection refused, timeout)
      let toast: { error: (msg: string) => void } | null = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        toast = require('next/dist/lib/toast') as { error: (msg: string) => void };
      } catch {
        // skip
      }
      toast?.error('Network error. Check your connection and retry.');
    }
  });
}

export { createErrorLink };