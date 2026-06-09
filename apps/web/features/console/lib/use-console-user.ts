/**
 * File:        apps/web/features/console/lib/use-console-user.ts
 * Module:      web · Console · Hooks
 * Purpose:     Facade hook every console section uses to read the current user.
 *              Now backed by the real backend via @/gql/hooks/useConsoleUser
 *              with graceful fallback to SEED_USER when unauthenticated or on
 *              error. Sections keep their existing `useConsoleUser()` call —
 *              no caller needs to change.
 *
 * Exports:
 *   - useConsoleUser() → ConsoleUser
 *   - useConsoleSpark() → readonly number[]
 *   - useConsoleUserStatus() → { loading, error, isAuthenticated, refetch }
 *
 * Depends on:
 *   - @/gql/hooks/useConsoleUser    — real backend aggregator
 *   - ./seed-data                   — SEED_USER, SEED_SPARK, ConsoleUser
 *
 * Side-effects:
 *   - Inherits side-effects of the underlying Apollo queries
 *     (network requests when authenticated, none otherwise)
 *
 * Key invariants:
 *   - The returned reference is stable across renders when neither profile
 *     nor accounts change. The status hook returns metadata for banners.
 *   - When the backend isn't reachable, SEED_USER is returned so sections
 *     never have to guard against undefined fields.
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-09
 */

export { useConsoleUser, useConsoleUserStatus } from '@/gql/hooks/useConsoleUser';
export type { UseConsoleUserStatusResult } from '@/gql/hooks/useConsoleUser';

import type { ConsoleUser } from './seed-data';
import { SEED_SPARK } from './seed-data';

/**
 * 30-point equity sparkline series.
 * [SonuRamTODO] Wire to a market-data / equity-history resolver once available.
 */
export function useConsoleSpark(): ReadonlyArray<number> {
  return SEED_SPARK;
}

// Re-export the ConsoleUser type for sections that import it from this file.
export type { ConsoleUser };
