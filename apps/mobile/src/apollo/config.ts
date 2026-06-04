/**
 * File:        apps/mobile/src/apollo/config.ts
 * Module:      mobile · Apollo · Config
 * Purpose:     Centralized env-var helpers for the mobile Apollo Client.
 *              Mirrors `apps/web/shared/apollo/mock-config.ts` so the
 *              `EXPO_PUBLIC_*` env vars (which Expo statically inlines into
 *              the client bundle at build time) follow the same read-at-call-
 *              time contract as the web `NEXT_PUBLIC_*` vars. This is what
 *              lets the mock link get tree-shaken from a production build
 *              when `EXPO_PUBLIC_MOCK_GQL` is statically falsy.
 *
 * Exports:
 *   - isMockGraphQLEnabled() → boolean
 *   - getGraphQLEndpoint()    → string     — base URL for the GraphQL endpoint
 *   - getApiBaseUrl()         → string     — base URL for REST endpoints (auth, etc.)
 *   - resolveApiConfig()      → ApiConfig  — convenience for the auth helpers
 *
 * Depends on:
 *   - @obsidian/mobile-api-client — ApiConfig shape
 *
 * Side-effects:
 *   - Reads `process.env.EXPO_PUBLIC_*` at call time. No module-load reads.
 *
 * Key invariants:
 *   - `EXPO_PUBLIC_MOCK_GQL` is the single source of truth — only the literal
 *     string `'1'` enables mock mode. `'0'`, `''`, and undefined all resolve
 *     to disabled. The value is read inside the predicate, not at import
 *     time, so the bundler can dead-code-eliminate the mock branch in prod.
 *   - `EXPO_PUBLIC_GRAPHQL_ENDPOINT` defaults to `http://localhost:3000/graphql`
 *     (the local NestJS dev server). The dev backend has `usesCleartextTraffic`
 *     enabled in `android` and the iOS ATS exception in `ios` — see app.json.
 *   - `EXPO_PUBLIC_API_BASE` defaults to the same host without the path, so
 *     `auth/otp/request` and `auth/dev/login` resolve against the dev backend.
 *
 * Read order:
 *   1. isMockGraphQLEnabled — the predicate
 *   2. getGraphQLEndpoint   — the GQL URI
 *   3. getApiBaseUrl        — the REST base
 *   4. resolveApiConfig     — convenience
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import type { ApiConfig } from '@obsidian/mobile-api-client';

const MOCK_GQL_ENV = 'EXPO_PUBLIC_MOCK_GQL';
const GQL_ENDPOINT_ENV = 'EXPO_PUBLIC_GRAPHQL_ENDPOINT';
const API_BASE_ENV = 'EXPO_PUBLIC_API_BASE';

const DEFAULT_GQL_ENDPOINT = 'http://localhost:3000/graphql';
const DEFAULT_API_BASE = 'http://localhost:3000';

/**
 * Returns true when `EXPO_PUBLIC_MOCK_GQL` is exactly the string `'1'`.
 * Mirrors the web `isMockGraphQLEnabled()` predicate for parity.
 */
export function isMockGraphQLEnabled(): boolean {
  return process.env[MOCK_GQL_ENV] === '1';
}

/**
 * Returns the configured GraphQL endpoint. Defaults to the local NestJS
 * dev server in dev. Read at call time so a different deployment can
 * override via `app.json` `extra` or runtime config in a future wave.
 */
export function getGraphQLEndpoint(): string {
  const env = process.env[GQL_ENDPOINT_ENV];
  return env && env.length > 0 ? env : DEFAULT_GQL_ENDPOINT;
}

/**
 * Returns the configured REST base URL (used by the auth helpers that
 * POST to `/auth/otp/request` etc.). Defaults to the same dev host as
 * the GraphQL endpoint.
 */
export function getApiBaseUrl(): string {
  const env = process.env[API_BASE_ENV];
  return env && env.length > 0 ? env : DEFAULT_API_BASE;
}

/**
 * Convenience — wraps the REST base in the `ApiConfig` shape that
 * `libs/mobile-api-client` exports. Used by `auth/login.ts` to construct
 * the per-request URLs.
 */
export function resolveApiConfig(): ApiConfig {
  return { baseUrl: getApiBaseUrl() };
}
