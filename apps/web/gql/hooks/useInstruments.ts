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
 *   - @/gql/operations/market/getInstruments.gql  — search query
 *   - @/gql/operations/market/getInstrument.gql   — single instrument query
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

import { useQuery, useSuspenseQuery } from '@apollo/client';
import {
  GetInstrumentsQuery,
  GetInstrumentsQueryVariables,
} from '../operations/market/getInstruments';
import {
  GetInstrumentQuery,
  GetInstrumentQueryVariables,
} from '../operations/market/getInstrument';
import { GetInstrumentsDocument } from '../operations/market/getInstruments';
import { GetInstrumentDocument } from '../operations/market/getInstrument';

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
export function useInstruments(params: UseInstrumentsParams = {}) {
  const { q, exchangeCode, type } = params;

  return useQuery<GetInstrumentsQuery, GetInstrumentsQueryVariables>(
    GetInstrumentsDocument,
    {
      variables: {
        q: q ?? undefined,
        exchangeCode: exchangeCode ?? undefined,
        type: type ?? undefined,
      },
      // No fetchPolicy override — rely on apollo-client default (cache-and-network for watchQuery)
      // This allows the caller to control refetch timing via the component tree.
    },
  );
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
  return useQuery<GetInstrumentQuery, GetInstrumentQueryVariables>(
    GetInstrumentDocument,
    {
      variables: {
        exchange,
        symbol,
      },
    },
  );
}