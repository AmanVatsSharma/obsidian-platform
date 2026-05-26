/**
 * File:        apps/web/features/console/lib/use-console-user.ts
 * Module:      web · Console · Hooks
 * Purpose:     Single hook every section uses to read the current user. Today it
 *              returns SEED_USER synchronously; tomorrow it can swap to a real
 *              fetch (TanStack Query, SWR, or the existing AuthProvider) without
 *              touching any caller.
 *
 * Exports:
 *   - useConsoleUser() → ConsoleUser
 *   - useConsoleSpark() → readonly number[]
 *
 * Depends on:
 *   - ./seed-data — SEED_USER, SEED_SPARK, ConsoleUser
 *
 * Side-effects:
 *   - none today
 *   - [SonuRamTODO] When wired: GET /v1/users/me once the BFF aggregator exists.
 *     Each section also needs sub-fetches (devices, sessions, accounts, transactions)
 *     — keep this hook aggregating so call-sites don't multiply.
 *
 * Key invariants:
 *   - The returned reference is stable across renders (mock). When wired to a real
 *     query client, return the cached snapshot — sections shouldn't be defensive
 *     against `undefined` user during this PR.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import type { ConsoleUser } from './seed-data';
import { SEED_SPARK, SEED_USER } from './seed-data';

export function useConsoleUser(): ConsoleUser {
  return SEED_USER;
}

export function useConsoleSpark(): ReadonlyArray<number> {
  return SEED_SPARK;
}
