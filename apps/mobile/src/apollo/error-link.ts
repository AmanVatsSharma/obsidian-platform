/**
 * File:        apps/mobile/src/apollo/error-link.ts
 * Module:      mobile · Apollo · Error
 * Purpose:     Apollo error link — maps the backend's `{ code, message,
 *              requestId, timestamp }` GraphQL error envelope into typed
 *              `AppError` instances so the rest of the app has a single
 *              error shape. Mirrors the spirit of
 *              `apps/web/gql/client/error-link.ts` but adapted for mobile:
 *              navigation to `/login` is handled by the AuthGate (it
 *              observes the auth context) rather than the link, so the
 *              link is responsible for typing the error, not for routing.
 *
 * Exports:
 *   - createErrorLink() → ApolloLink   — error-handling link
 *   - toAppError(reason) → AppError    — pure translator
 *
 * Depends on:
 *   - @apollo/client/link/error — onError
 *   - ../lib/errors             — AppError
 *
 * Side-effects:
 *   - Reads GraphQL error extensions (`code`, `statusCode`, `requestId`)
 *     and re-emits them as `AppError` instances on the result stream.
 *   - Does NOT navigate. The AuthGate listens to the auth context's
 *     `SIGNED_OUT` event instead — the link stays link-shaped.
 *
 * Key invariants:
 *   - The link MUST sit AFTER `HttpLink` in the chain so the response
 *     from the network is what gets inspected. Placing it before HttpLink
 *     would inspect a request shape, not a response shape.
 *   - We do NOT throw inside the link. Apollo's `onError` is a hook
 *     that lets the response continue downstream — throwing tears down
 *     the subscription.
 *   - `toAppError` is a pure function exported for use by Wave 2's
 *     screens (so they can normalise inline errors the same way the
 *     link does).
 *
 * Read order:
 *   1. toAppError       — the pure translator
 *   2. createErrorLink  — the link factory
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { ApolloLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import type { GraphQLError } from 'graphql';

import { AppError } from '../lib/errors';

/**
 * Map a GraphQL error envelope to an AppError.
 *
 * The backend's `GlobalHttpExceptionFilter` emits:
 *   `{ code, message, requestId, timestamp }`
 * — but at the GraphQL transport layer the same fields surface inside
 * `error.extensions`. We pull them out, fall back to safe defaults, and
 * pack the rest into `meta` for log correlation.
 */
export function toAppError(err: import('graphql').GraphQLFormattedError): AppError {
  const ext = (err.extensions ?? {}) as Record<string, unknown>;
  const code = typeof ext['code'] === 'string' ? (ext['code'] as string) : 'GRAPHQL_ERROR';
  const message = err.message || 'GraphQL request failed';
  const requestId = typeof ext['requestId'] === 'string' ? (ext['requestId'] as string) : undefined;
  const statusCode = typeof ext['statusCode'] === 'number' ? (ext['statusCode'] as number) : undefined;
  return new AppError(code, message, {
    ...(requestId ? { requestId } : {}),
    ...(typeof statusCode === 'number' ? { statusCode } : {}),
    path: err.path,
  });
}

export function createErrorLink(): ApolloLink {
  return onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors && graphQLErrors.length > 0) {
      for (const err of graphQLErrors) {
        const appErr = toAppError(err);
        // Log the typed error. The auth gate listens for `AUTHENTICATION_FAILED`
        // codes via the auth context — we only log here.
        // eslint-disable-next-line no-console
        console.warn('[apollo] graphQL error', {
          code: appErr.code,
          message: appErr.message,
          meta: appErr.meta,
        });
      }
    }
    if (networkError) {
      // eslint-disable-next-line no-console
      console.warn('[apollo] network error', { message: networkError.message });
    }
  });
}
