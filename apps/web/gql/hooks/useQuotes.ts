/**
 * File:        apps/web/gql/hooks/useQuotes.ts
 * Module:      web · GraphQL · Hooks · Market
 * Purpose:     Real-time quote lookup hook — wraps the quote GraphQL query for
 *              fetching current price data for a given instrument.
 *
 * Exports:
 *   - useQuote(exchange, symbol) → { data, loading, error }
 *
 * Depends on:
 *   - @apollo/client                          — useQuery (generated hook base)
 *   - @/gql/generated/graphql                 — QuoteDto type
 *   - @/gql/operations/market/getQuote.gql     — quote query
 *
 * Side-effects:
 *   - none (read-only query)
 *
 * Key invariants:
 *   - Exchange + symbol uniquely identifies a quoted instrument.
 *   - For live streaming quotes, prefer the WebSocket (PranaStream) subscription
 *     pattern — this hook is for on-demand snapshots.
 *
 * Read order:
 *   1. useQuote — snapshot quote fetch
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-30
 */

import { useQuery } from '@apollo/client';
import {
  GetQuoteQuery,
  GetQuoteQueryVariables,
} from '../operations/market/getQuote';
import { GetQuoteDocument } from '../operations/market/getQuote';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Parameters for quote lookup */
export interface UseQuoteParams {
  /** Exchange code (e.g. "NSE", "BSE") */
  exchange: string;
  /** Symbol ticker */
  symbol: string;
  /** Optional quote ID */
  id?: string | null;
  /** Optional status filter */
  status?: string | null;
}

/** Typed return from useQuote */
export interface UseQuoteResult {
  data: GetQuoteQuery['quote'] extends infer T ? T : never;
  loading: boolean;
  error?: Error;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch a real-time price snapshot for a given instrument.
 *
 * @param params - { exchange, symbol, id?, status? }
 * @param options - Apollo useQuery options (pollInterval, fetchPolicy, etc.)
 *
 * Usage:
 *   const { data, loading, error } = useQuote({ exchange: 'NSE', symbol: 'RELIANCE' });
 *   // Poll every 2 s for near-real-time updates:
 *   const { data } = useQuote({ exchange, symbol }, { pollInterval: 2000 });
 *
 *   if (loading) return <Skeleton />;
 *   if (!data) return null;
 *
 *   return <PriceDisplay price={data.price} timestamp={data.ts} />;
 */
export function useQuote(
  params: UseQuoteParams,
  options?: Omit<Parameters<typeof useQuery<GetQuoteQuery, GetQuoteQueryVariables>>[1], 'variables'>,
) {
  const { exchange, symbol, id, status } = params;

  return useQuery<GetQuoteQuery, GetQuoteQueryVariables>(GetQuoteDocument, {
    variables: {
      exchange,
      symbol,
      id: id ?? undefined,
      status: status ?? undefined,
    },
    ...options,
  });
}