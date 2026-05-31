/**
 * File:        apps/web/gql/hooks/index.ts
 * Module:      web · GraphQL · Hooks
 * Purpose:     Barrel export for all GraphQL hooks.
 *
 * Exports:
 *   - Codegen hooks (from ../generated/hooks)
 *   - Custom wrapper hooks with enriched types (from local files)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-31
 */

// ---------------------------------------------------------------------------
// Codegen hooks — typed hooks produced by the enterprise codegen pipeline
// ---------------------------------------------------------------------------

// Query & lazy-query hooks
export {
  useGetMeQuery,
  useGetMeLazyQuery,
  useGetAccountBalanceQuery,
  useGetAccountBalanceLazyQuery,
  useGetInstrumentsQuery,
  useGetInstrumentsLazyQuery,
  useGetInstrumentQuery,
  useGetInstrumentLazyQuery,
  useGetQuoteQuery,
  useGetQuoteLazyQuery,
  useGetWatchlistsQuery,
  useGetWatchlistsLazyQuery,
  useGetOrdersQuery,
  useGetOrdersLazyQuery,
  useGetPositionsQuery,
  useGetPositionsLazyQuery,
} from '../generated/hooks';

// Mutation hooks
export {
  usePlaceOrderMutation,
  useCancelOrderMutation,
  useModifyOrderMutation,
  useCancelBracketGroupMutation,
} from '../generated/hooks';

// Type re-exports from codegen (isolatedModules requires explicit `export type`)
export type {
  PlaceOrderMutationHookResult,
  PlaceOrderMutationResult,
  PlaceOrderMutationOptions,
  CancelOrderMutationHookResult,
  CancelOrderMutationResult,
  CancelOrderMutationOptions,
  ModifyOrderMutationHookResult,
  ModifyOrderMutationResult,
  ModifyOrderMutationOptions,
  CancelBracketGroupMutationHookResult,
  CancelBracketGroupMutationResult,
  CancelBracketGroupMutationOptions,
} from '../generated/hooks';

// ---------------------------------------------------------------------------
// Custom wrapper hooks — preserve these as they have enriched types / logic
// ---------------------------------------------------------------------------

// Positions hook
export {
  usePositions,
  type PositionFilters,
  type Position,
  type UsePositionsResult,
} from './usePositions';

// Account balance hook
export {
  useAccountBalance,
  type AccountBalance,
  type ParsedBalance,
  type UseAccountBalanceOptions,
  type UseAccountBalanceResult,
} from './useAccountBalance';

// Instrument search & lookup hooks
export {
  useInstruments,
  useInstrument,
  type UseInstrumentsParams,
  type UseInstrumentsResult,
  type UseInstrumentParams,
} from './useInstruments';

// Watchlist hooks
export { useWatchlists, type UseWatchlistsResult } from './useWatchlists';

// Quote hooks
export { useQuote, type UseQuoteParams, type UseQuoteResult } from './useQuotes';

// Order management hooks
export {
  useOrders,
  type OrderFilters,
  type Order,
  type UseOrdersResult,
} from './useOrders';

export {
  usePlaceOrder,
  type PlaceOrderInput,
  type PlaceOrderResult,
  type UsePlaceOrderResult,
  PlaceOrderDocument,
} from './usePlaceOrder';

export {
  useCancelOrder,
  type CancelOrderResult,
  type UseCancelOrderResult,
  CancelOrderDocument,
} from './useCancelOrder';

export {
  useCancelBracketGroup,
  type CancelBracketGroupResult,
  type UseCancelBracketGroupResult,
  CancelBracketGroupDocument,
} from './useCancelBracketGroup';

export {
  useModifyOrder,
  type ModifyOrderResult,
  type UseModifyOrderResult,
  ModifyOrderDocument,
} from './useModifyOrder';