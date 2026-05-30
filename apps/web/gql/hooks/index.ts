/**
 * File:        apps/web/gql/hooks/index.ts
 * Module:      web · GraphQL · Hooks
 * Purpose:     Barrel export for all GraphQL hooks.
 *
 * Exports:
 *   - usePositions          — positions hook
 *   - useAccountBalance     — account balance hook
 *   - useInstruments        — instrument search hook
 *   - useInstrument         — single instrument lookup hook
 *   - useWatchlists         — user watchlists hook
 *   - useQuote              — price quote snapshot hook
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-30
 */

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