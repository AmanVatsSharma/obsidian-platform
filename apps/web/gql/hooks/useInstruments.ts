/**
 * File:        apps/web/gql/hooks/useInstruments.ts
 * Module:      web · GraphQL · Hooks · Market
 * Purpose:     Instrument search and lookup hooks — wraps the instruments and instrument
 *              GraphQL queries with debounced search support and typed return values.
 *
 * Exports:
 *   - useInstruments(params) → { data, loading, error }
 *   - useInstrument(exchange, symbol) → { data, loading, error }
 *
 * Depends on:
 *   - @apollo/client                              — useQuery (generated hook base)
 *   - @/gql/generated/graphql                     — InstrumentDto type
 *   - @/gql/generated/hooks                       — useGetInstrumentsQuery, useGetInstrumentQuery
 *
 * Side-effects:
 *   - none (read-only queries)
 *
 * Key invariants:
 *   - Debounced query is passed as-is — caller controls debounce timing.
 *   - useInstrument uses exact exchange + symbol match (no fuzzy search).
 *   - All instruments queries return InstrumentDto[] — not a paginated wrapper.
 *
 * Read order:
 *   1. useInstruments — search with optional filters
 *   2. useInstrument  — lookup single instrument
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-30
 */

import { useQuery } from '@apollo/client';
import type { ApolloQueryResult } from '@apollo/client';
import type { QueryHookOptions } from '@apollo/client';
import { useGetInstrumentsQuery, useGetInstrumentQuery } from '../generated/hooks';
import type {
  GetInstrumentsQuery,
  GetInstrumentsQueryVariables,
  GetInstrumentQuery,
  GetInstrumentQueryVariables,
} from '../generated/hooks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Parameters for instrument search */
export interface UseInstrumentsParams {
  /** Debounced search query (symbol or name fragment) */
  q?: string | null;
  /** Filter by exchange code (e.g. "NSE", "BSE", "NASDAQ") */
  exchangeCode?: string | null;
  /** Filter by instrument type (e.g. "EQUITY", "FUTURE", "OPTION") */
  type?: string | null;
}

export interface UseInstrumentsResult {
  /** Array of matching instruments (null when loading/error) */
  data: GetInstrumentsQuery['instruments'] extends infer T ? T : never;
  loading: boolean;
  error?: Error;
}

/** Parameters for single instrument lookup */
export interface UseInstrumentParams {
  /** Exchange code (required for exact match) */
  exchange: string;
  /** Symbol ticker (required for exact match) */
  symbol: string;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Search instruments with optional exchange and type filters.
 *
 * @param params - { q, exchangeCode, type } — all optional
 * @param options - Apollo useQuery options (pollInterval, fetchPolicy, etc.)
 *
 * Usage:
 *   const [query, setQuery] = useState('');
 *   const [debouncedQuery] = useDebounce(query, 300);
 *   const { data, loading, error } = useInstruments({ q: debouncedQuery, exchangeCode: 'NSE' });
 *
 * Note: Debouncing should be handled by the caller (e.g. useDebounce from a utility
 * library or React state). This hook accepts the already-debounced string to avoid
 * internal timer management.
 */
export function useInstruments(
  params: UseInstrumentsParams = {},
  options?: QueryHookOptions<GetInstrumentsQuery, GetInstrumentsQueryVariables>,
) {
  const { q, exchangeCode, type } = params;

  return useGetInstrumentsQuery({
    variables: {
      q: q ?? undefined,
      exchangeCode: exchangeCode ?? undefined,
      type: type ?? undefined,
    },
    // No fetchPolicy override — rely on apollo-client default (cache-and-network for watchQuery)
    // This allows the caller to control refetch timing via the component tree.
    ...options,
  });
}

/**
 * Lookup a single instrument by exact exchange + symbol.
 * Use for detail pages, order placement pre-validation, etc.
 *
 * @param exchange - Exchange code (e.g. "NSE", "BSE")
 * @param symbol   - Instrument ticker symbol
 *
 * Usage:
 *   const { data, loading, error } = useInstrument('NSE', 'RELIANCE');
 */
export function useInstrument(exchange: string, symbol: string) {
  return useGetInstrumentQuery({
    variables: {
      exchange,
      symbol,
    },
  });
}