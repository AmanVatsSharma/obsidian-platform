/**
 * File:        apps/web/gql/hooks/useWatchlists.ts
 * Module:      web · GraphQL · Hooks · Market
 * Purpose:     Watchlist management hooks — wraps the watchlists GraphQL query and
 *              provides typed access to user watchlists with their instruments.
 *
 * Exports:
 *   - useWatchlists() → { data, loading, error, refetch }
 *
 * Depends on:
 *   - @apollo/client                              — useQuery, useMutation (generated hook base)
 *   - @/gql/generated/graphql                     — WatchlistDto, WatchlistItemDto types
 *   - @/gql/operations/market/getWatchlists.gql   — watchlists query
 *
 * Side-effects:
 *   - none (read-only query — mutations are exported separately if needed)
 *
 * Key invariants:
 *   - Returns WatchlistDto[] with nested instruments (if resolver supports items).
 *   - Relies on cache-and-network default fetchPolicy for reactive updates.
 *
 * Read order:
 *   1. useWatchlists — primary hook (fetch user watchlists)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-30
 */

import { useQuery } from '@apollo/client';
import {
  GetWatchlistsQuery,
} from '../operations/market/getWatchlists';
import { GetWatchlistsDocument } from '../operations/market/getWatchlists';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Typed return from useWatchlists */
export interface UseWatchlistsResult {
  /** Array of user's watchlists (null when loading/error) */
  data: GetWatchlistsQuery['watchlists'] | null;
  loading: boolean;
  error?: Error;
  /** Manual refetch function */
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch all watchlists for the authenticated user.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useWatchlists();
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return (
 *     <WatchlistList>
 *       {data.map(w => <WatchlistCard key={w.id} watchlist={w} />)}
 *     </WatchlistList>
 *   );
 */
export function useWatchlists(): UseWatchlistsResult {
  const { data, loading, error, refetch } = useQuery<GetWatchlistsQuery>(
    GetWatchlistsDocument,
    {
      // Default fetchPolicy is cache-and-network — good for watchlists that update
      // when user adds/removes instruments from other parts of the app.
    },
  );

  return {
    data: data?.watchlists ?? null,
    loading,
    error: error ?? undefined,
    refetch,
  } as UseWatchlistsResult;
}