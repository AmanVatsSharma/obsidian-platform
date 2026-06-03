/**
 * File:        apps/web/shared/apollo/mock-config.ts
 * Module:      web · Shared · Apollo
 * Purpose:     Centralized env-var helper that decides whether the Apollo Client
 *              should run against the mock GraphQL layer (SchemaLink with
 *              `mock-graphql/*` resolvers) instead of the real NestJS endpoint.
 *              Exposed as a pure read at call time so Next.js can tree-shake the
 *              mock branch out of the bundle when NEXT_PUBLIC_MOCK_GQL is
 *              statically false at build time.
 *
 * Exports:
 *   - MockMode                              — typed string union: 'enabled' | 'disabled'
 *   - isMockGraphQLEnabled() → boolean      — strict 'true' check on NEXT_PUBLIC_MOCK_GQL
 *   - getMockMode() → MockMode              — typed wrapper around isMockGraphQLEnabled
 *
 * Depends on:
 *   - none (reads process.env at call time, not at module load)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - NEXT_PUBLIC_MOCK_GQL is the single source of truth — only the literal
 *     string 'true' enables mock mode. 'TRUE', '1', '', and undefined all
 *     resolve to disabled.
 *   - Reading happens at call time, not at module load. This is intentional:
 *     if we captured the value at import time, Next.js's bundler could not
 *     dead-code-eliminate the mock branch when the env var is statically
 *     false in a production build.
 *   - No console output, no exceptions. This is a leaf utility consumed by
 *     Apollo client bootstrap and resolvers.
 *
 * Read order:
 *   1. MockMode        — the typed string union
 *   2. isMockGraphQLEnabled — the predicate
 *   3. getMockMode     — the typed accessor
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-01
 */

export type MockMode = 'enabled' | 'disabled';

/**
 * The env-var name. Exposed as a constant for testability and to keep the
 * string literal in exactly one place — if this ever needs to be renamed,
 * the rename happens here, not in the call sites.
 */
export const MOCK_GQL_ENV_VAR = 'NEXT_PUBLIC_MOCK_GQL' as const;

/**
 * Returns true when NEXT_PUBLIC_MOCK_GQL is exactly the string 'true'.
 * Case-sensitive, strict equality. Any other value (including 'TRUE',
 * '1', '', or undefined) returns false.
 */
export function isMockGraphQLEnabled(): boolean {
  return process.env[MOCK_GQL_ENV_VAR] === 'true';
}

/**
 * Typed wrapper around isMockGraphQLEnabled — returns 'enabled' | 'disabled'.
 * Use this when consumers want a string switch (e.g. for log payloads or
 * Apollo client config) instead of a boolean.
 */
export function getMockMode(): MockMode {
  return isMockGraphQLEnabled() ? 'enabled' : 'disabled';
}
