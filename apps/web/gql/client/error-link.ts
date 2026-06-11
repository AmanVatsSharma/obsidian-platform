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
 *
 * Side-effects:
 *   - HTTP 401: navigates to /login
 *   - HTTP 403/500+: shows toast notification (console.warn fallback)
 *   - HTTP 400: errors are kept in Apollo cache for field-level display
 *
 * Key invariants:
 *   - Errors are NOT re-thrown after logging — they propagate to React error boundaries.
 *
 * Read order:
 *   1. createErrorLink — factory function, returns configured ApolloLink
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-11
 */

import { ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { redirect } from 'next/navigation';

/**
 * Lightweight console-based toast fallback. The design system exposes a real toast
 * via `useToast` in browser-only contexts; we don't import it here to keep the
 * error link SSR-safe and free of circular imports.
 */
function showToast(message: string): void {
  if (typeof window !== 'undefined' && typeof console !== 'undefined') {
    // Replace with a real toast (e.g., sonner, react-hot-toast) when integrated.
    console.warn(`[toast] ${message}`);
  }
}

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
          showToast('Access denied. You do not have permission.');
          return;
        }

        // 400 field validation errors — let them propagate to component
        // 500+ server errors
        if (statusCode === 500 || statusCode === 503) {
          showToast('Server error. Please try again later.');
          return;
        }
      }
    }

    if (networkError) {
      showToast('Network error. Check your connection and retry.');
    }
  });
}

export { createErrorLink };
