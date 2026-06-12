/**
 * File:        apps/web/features/console/lib/use-console-user.ts
 * Module:      web · Console · Hooks
 * Purpose:     Facade hook every console section uses to read the current user.
 *              Backed by the real backend via @/gql/hooks/useConsoleUser.
 *              Unauthenticated users get emptyConsoleUser() (no fake persona,
 *              no leaked IBANs). Authenticated users get real backend data
 *              with honest empty sentinels for fields the backend doesn't
 *              yet expose — NEVER the seed persona.
 *
 * Exports:
 *   - useConsoleUser() → ConsoleUser
 *   - useConsoleSpark() → readonly number[]
 *   - useConsoleUserStatus() → { loading, error, isAuthenticated, refetch }
 *
 * Depends on:
 *   - @/gql/hooks/useConsoleUser    — real backend aggregator
 *   - ./seed-data                   — ConsoleUser type only (SEED_USER no longer reachable)
 *
 * Side-effects:
 *   - Inherits side-effects of the underlying Apollo queries
 *     (network requests when authenticated, none otherwise)
 *
 * Key invariants:
 *   - The returned reference is stable across renders when neither profile
 *     nor accounts change. The status hook returns metadata for banners.
 *   - No fake persona, no fake IBANs, no fake devices ever leak to a real
 *     signed-in user.
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-12
 */

export { useConsoleUser, useConsoleUserStatus } from '@/gql/hooks/useConsoleUser';
export type { UseConsoleUserStatusResult } from '@/gql/hooks/useConsoleUser';

import type { ConsoleUser } from './seed-data';

/**
 * 30-point equity sparkline series. Returns empty array until the
 * equity-history endpoint is wired. Render the chart's empty state when [].
 * [SonuRamTODO] Wire to a market-data / equity-history resolver once available.
 */
export function useConsoleSpark(): ReadonlyArray<number> {
  return [];
}

// Re-export the ConsoleUser type for sections that import it from this file.
export type { ConsoleUser };
