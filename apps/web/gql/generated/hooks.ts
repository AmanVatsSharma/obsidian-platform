import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
import type { Exact, InputMaybe, Scalars, PlaceOrderInput } from './graphql';

const defaultOptions = {} as const;
export type CancelBracketGroupMutationVariables = Exact<{
  parentOrderId: Scalars['ID']['input'];
}>;

export type CancelBracketGroupMutation = { __typename?: 'Mutation', cancelBracketGroup?: { __typename?: 'OrderEntity', id: string, clientOrderId: string, status: string, updatedAt: string } | null };

export type GetAccountBalanceQueryVariables = Exact<{
  accountId: Scalars['String']['input'];
  currency?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetAccountBalanceQuery = { __typename?: 'Query', accountBalance?: { __typename?: 'AccountBalancePayload', totalCash: string, lockedCash: string, availableCash: string, positionsValue: string, unrealizedPnl: string, equity: string, buyingPower: string, currency: string } | null };

export type GetMeQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMeQuery = { __typename?: 'Query', me?: { __typename?: 'CurrentUserDto', userId: string, tenantId: string } | null };

export type GetInstrumentQueryVariables = Exact<{
  exchange?: InputMaybe<Scalars['String']['input']>;
  symbol?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetInstrumentQuery = { __typename?: 'Query', instrument?: { __typename?: 'InstrumentDto', id: string, exchangeCode: string, symbol: string, displayName: string, type: string, status?: string | null } | null };

export type GetInstrumentsQueryVariables = Exact<{
  exchangeCode?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  q?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetInstrumentsQuery = { __typename?: 'Query', instruments: Array<{ __typename?: 'InstrumentDto', id: string, exchangeCode: string, symbol: string, displayName: string, type: string, status?: string | null }> };

export type GetQuoteQueryVariables = Exact<{
  exchange?: InputMaybe<Scalars['String']['input']>;
  symbol?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetQuoteQuery = { __typename?: 'Query', quote?: { __typename?: 'QuoteDto', symbol: string, exchange: string, price: number, ts: string } | null };

export type GetWatchlistsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetWatchlistsQuery = { __typename?: 'Query', watchlists: Array<{ __typename?: 'WatchlistDto', id: string, name: string, createdAt: string }> };

export type CancelOrderMutationVariables = Exact<{
  orderId: Scalars['ID']['input'];
}>;


export type CancelOrderMutation = { __typename?: 'Mutation', cancelOrder?: { __typename?: 'OrderEntity', id: string, clientOrderId: string, status: string, updatedAt: string } | null };

export type GetOrdersQueryVariables = Exact<{
  accountId?: InputMaybe<Scalars['ID']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  side?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetOrdersQuery = { __typename?: 'Query', orders?: { __typename?: 'OrderConnection', total: number, limit: number, offset: number, data: Array<{ __typename?: 'OrderEntity', id: string, clientOrderId: string, externalRefId: string, instrumentId: string, side: string, type: string, quantity: number, filledQty: number, remainingQty: number, price?: number | null, slPrice?: number | null, tpPrice?: number | null, status: string, timeInForce: string, createdAt: string, updatedAt: string, triggerPrice?: number | null, triggerCondition?: string | null, algoType?: string | null }> } | null };

export type GetPositionsQueryVariables = Exact<{
  accountId?: InputMaybe<Scalars['ID']['input']>;
  currency?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetPositionsQuery = { __typename?: 'Query', positions?: { __typename?: 'PositionConnection', total: number, limit: number, offset: number, data: Array<{ __typename?: 'PositionRow', instrumentId: string, netQty: number, avgPrice: number, realizedPnl: number, lastPrice: number, mtmPnl: number, value: number }> } | null };

export type ModifyOrderMutationVariables = Exact<{
  orderId: Scalars['ID']['input'];
  price?: InputMaybe<Scalars['Float']['input']>;
  quantity?: InputMaybe<Scalars['Float']['input']>;
}>;


export type ModifyOrderMutation = { __typename?: 'Mutation', modifyOrder?: { __typename?: 'OrderEntity', id: string, clientOrderId: string, status: string, price?: number | null, quantity: number, filledQty: number, remainingQty: number, updatedAt: string } | null };

export type PlaceOrderMutationVariables = Exact<{
  input: PlaceOrderInput;
}>;


export type PlaceOrderMutation = { __typename?: 'Mutation', placeOrder?: { __typename?: 'OrderEntity', id: string, clientOrderId: string, status: string, createdAt: string } | null };


export const GetAccountBalanceDocument = gql`
    query GetAccountBalance($accountId: String!, $currency: String) {
  accountBalance(accountId: $accountId, currency: $currency) {
    totalCash
    lockedCash
    availableCash
    positionsValue
    unrealizedPnl
    equity
    buyingPower
    currency
  }
}
    `;

/**
 * __useGetAccountBalanceQuery__
 *
 * To run a query within a React component, call `useGetAccountBalanceQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAccountBalanceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAccountBalanceQuery({
 *   variables: {
 *      accountId: // value for 'accountId'
 *      currency: // value for 'currency'
 *   },
 * });
 */
export function useGetAccountBalanceQuery(baseOptions: Apollo.QueryHookOptions<GetAccountBalanceQuery, GetAccountBalanceQueryVariables> & ({ variables: GetAccountBalanceQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetAccountBalanceQuery, GetAccountBalanceQueryVariables>(GetAccountBalanceDocument, options);
      }
export function useGetAccountBalanceLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetAccountBalanceQuery, GetAccountBalanceQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetAccountBalanceQuery, GetAccountBalanceQueryVariables>(GetAccountBalanceDocument, options);
        }
// @ts-ignore
export function useGetAccountBalanceSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetAccountBalanceQuery, GetAccountBalanceQueryVariables>): Apollo.UseSuspenseQueryResult<GetAccountBalanceQuery, GetAccountBalanceQueryVariables>;
export function useGetAccountBalanceSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAccountBalanceQuery, GetAccountBalanceQueryVariables>): Apollo.UseSuspenseQueryResult<GetAccountBalanceQuery | undefined, GetAccountBalanceQueryVariables>;
export function useGetAccountBalanceSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAccountBalanceQuery, GetAccountBalanceQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetAccountBalanceQuery, GetAccountBalanceQueryVariables>(GetAccountBalanceDocument, options);
        }
export type GetAccountBalanceQueryHookResult = ReturnType<typeof useGetAccountBalanceQuery>;
export type GetAccountBalanceLazyQueryHookResult = ReturnType<typeof useGetAccountBalanceLazyQuery>;
export type GetAccountBalanceSuspenseQueryHookResult = ReturnType<typeof useGetAccountBalanceSuspenseQuery>;
export type GetAccountBalanceQueryResult = Apollo.QueryResult<GetAccountBalanceQuery, GetAccountBalanceQueryVariables>;
export const GetMeDocument = gql`
    query GetMe {
  me {
    userId
    tenantId
  }
}
    `;

/**
 * __useGetMeQuery__
 *
 * To run a query within a React component, call `useGetMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMeQuery(baseOptions?: Apollo.QueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
      }
export function useGetMeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
        }
// @ts-ignore
export function useGetMeSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetMeQuery, GetMeQueryVariables>): Apollo.UseSuspenseQueryResult<GetMeQuery, GetMeQueryVariables>;
export function useGetMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMeQuery, GetMeQueryVariables>): Apollo.UseSuspenseQueryResult<GetMeQuery | undefined, GetMeQueryVariables>;
export function useGetMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetMeQuery, GetMeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetMeQuery, GetMeQueryVariables>(GetMeDocument, options);
        }
export type GetMeQueryHookResult = ReturnType<typeof useGetMeQuery>;
export type GetMeLazyQueryHookResult = ReturnType<typeof useGetMeLazyQuery>;
export type GetMeSuspenseQueryHookResult = ReturnType<typeof useGetMeSuspenseQuery>;
export type GetMeQueryResult = Apollo.QueryResult<GetMeQuery, GetMeQueryVariables>;
export const GetInstrumentDocument = gql`
    query GetInstrument($exchange: String, $symbol: String) {
  instrument(exchange: $exchange, symbol: $symbol) {
    id
    exchangeCode
    symbol
    displayName
    type
    status
  }
}
    `;

/**
 * __useGetInstrumentQuery__
 *
 * To run a query within a React component, call `useGetInstrumentQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetInstrumentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetInstrumentQuery({
 *   variables: {
 *      exchange: // value for 'exchange'
 *      symbol: // value for 'symbol'
 *   },
 * });
 */
export function useGetInstrumentQuery(baseOptions?: Apollo.QueryHookOptions<GetInstrumentQuery, GetInstrumentQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetInstrumentQuery, GetInstrumentQueryVariables>(GetInstrumentDocument, options);
      }
export function useGetInstrumentLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetInstrumentQuery, GetInstrumentQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetInstrumentQuery, GetInstrumentQueryVariables>(GetInstrumentDocument, options);
        }
// @ts-ignore
export function useGetInstrumentSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetInstrumentQuery, GetInstrumentQueryVariables>): Apollo.UseSuspenseQueryResult<GetInstrumentQuery, GetInstrumentQueryVariables>;
export function useGetInstrumentSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetInstrumentQuery, GetInstrumentQueryVariables>): Apollo.UseSuspenseQueryResult<GetInstrumentQuery | undefined, GetInstrumentQueryVariables>;
export function useGetInstrumentSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetInstrumentQuery, GetInstrumentQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetInstrumentQuery, GetInstrumentQueryVariables>(GetInstrumentDocument, options);
        }
export type GetInstrumentQueryHookResult = ReturnType<typeof useGetInstrumentQuery>;
export type GetInstrumentLazyQueryHookResult = ReturnType<typeof useGetInstrumentLazyQuery>;
export type GetInstrumentSuspenseQueryHookResult = ReturnType<typeof useGetInstrumentSuspenseQuery>;
export type GetInstrumentQueryResult = Apollo.QueryResult<GetInstrumentQuery, GetInstrumentQueryVariables>;
export const GetInstrumentsDocument = gql`
    query GetInstruments($exchangeCode: String, $type: String, $q: String) {
  instruments(exchangeCode: $exchangeCode, type: $type, q: $q) {
    id
    exchangeCode
    symbol
    displayName
    type
    status
  }
}
    `;

/**
 * __useGetInstrumentsQuery__
 *
 * To run a query within a React component, call `useGetInstrumentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetInstrumentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetInstrumentsQuery({
 *   variables: {
 *      exchangeCode: // value for 'exchangeCode'
 *      type: // value for 'type'
 *      q: // value for 'q'
 *   },
 * });
 */
export function useGetInstrumentsQuery(baseOptions?: Apollo.QueryHookOptions<GetInstrumentsQuery, GetInstrumentsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetInstrumentsQuery, GetInstrumentsQueryVariables>(GetInstrumentsDocument, options);
      }
export function useGetInstrumentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetInstrumentsQuery, GetInstrumentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetInstrumentsQuery, GetInstrumentsQueryVariables>(GetInstrumentsDocument, options);
        }
// @ts-ignore
export function useGetInstrumentsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetInstrumentsQuery, GetInstrumentsQueryVariables>): Apollo.UseSuspenseQueryResult<GetInstrumentsQuery, GetInstrumentsQueryVariables>;
export function useGetInstrumentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetInstrumentsQuery, GetInstrumentsQueryVariables>): Apollo.UseSuspenseQueryResult<GetInstrumentsQuery | undefined, GetInstrumentsQueryVariables>;
export function useGetInstrumentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetInstrumentsQuery, GetInstrumentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetInstrumentsQuery, GetInstrumentsQueryVariables>(GetInstrumentsDocument, options);
        }
export type GetInstrumentsQueryHookResult = ReturnType<typeof useGetInstrumentsQuery>;
export type GetInstrumentsLazyQueryHookResult = ReturnType<typeof useGetInstrumentsLazyQuery>;
export type GetInstrumentsSuspenseQueryHookResult = ReturnType<typeof useGetInstrumentsSuspenseQuery>;
export type GetInstrumentsQueryResult = Apollo.QueryResult<GetInstrumentsQuery, GetInstrumentsQueryVariables>;
export const GetQuoteDocument = gql`
    query GetQuote($exchange: String, $symbol: String, $id: String, $status: String) {
  quote(exchange: $exchange, symbol: $symbol, id: $id, status: $status) {
    symbol
    exchange
    price
    ts
  }
}
    `;

/**
 * __useGetQuoteQuery__
 *
 * To run a query within a React component, call `useGetQuoteQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetQuoteQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetQuoteQuery({
 *   variables: {
 *      exchange: // value for 'exchange'
 *      symbol: // value for 'symbol'
 *      id: // value for 'id'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGetQuoteQuery(baseOptions?: Apollo.QueryHookOptions<GetQuoteQuery, GetQuoteQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetQuoteQuery, GetQuoteQueryVariables>(GetQuoteDocument, options);
      }
export function useGetQuoteLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetQuoteQuery, GetQuoteQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetQuoteQuery, GetQuoteQueryVariables>(GetQuoteDocument, options);
        }
// @ts-ignore
export function useGetQuoteSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetQuoteQuery, GetQuoteQueryVariables>): Apollo.UseSuspenseQueryResult<GetQuoteQuery, GetQuoteQueryVariables>;
export function useGetQuoteSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetQuoteQuery, GetQuoteQueryVariables>): Apollo.UseSuspenseQueryResult<GetQuoteQuery | undefined, GetQuoteQueryVariables>;
export function useGetQuoteSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetQuoteQuery, GetQuoteQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetQuoteQuery, GetQuoteQueryVariables>(GetQuoteDocument, options);
        }
export type GetQuoteQueryHookResult = ReturnType<typeof useGetQuoteQuery>;
export type GetQuoteLazyQueryHookResult = ReturnType<typeof useGetQuoteLazyQuery>;
export type GetQuoteSuspenseQueryHookResult = ReturnType<typeof useGetQuoteSuspenseQuery>;
export type GetQuoteQueryResult = Apollo.QueryResult<GetQuoteQuery, GetQuoteQueryVariables>;
export const GetWatchlistsDocument = gql`
    query GetWatchlists {
  watchlists {
    id
    name
    createdAt
  }
}
    `;

/**
 * __useGetWatchlistsQuery__
 *
 * To run a query within a React component, call `useGetWatchlistsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWatchlistsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWatchlistsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetWatchlistsQuery(baseOptions?: Apollo.QueryHookOptions<GetWatchlistsQuery, GetWatchlistsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetWatchlistsQuery, GetWatchlistsQueryVariables>(GetWatchlistsDocument, options);
      }
export function useGetWatchlistsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetWatchlistsQuery, GetWatchlistsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetWatchlistsQuery, GetWatchlistsQueryVariables>(GetWatchlistsDocument, options);
        }
// @ts-ignore
export function useGetWatchlistsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetWatchlistsQuery, GetWatchlistsQueryVariables>): Apollo.UseSuspenseQueryResult<GetWatchlistsQuery, GetWatchlistsQueryVariables>;
export function useGetWatchlistsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetWatchlistsQuery, GetWatchlistsQueryVariables>): Apollo.UseSuspenseQueryResult<GetWatchlistsQuery | undefined, GetWatchlistsQueryVariables>;
export function useGetWatchlistsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetWatchlistsQuery, GetWatchlistsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetWatchlistsQuery, GetWatchlistsQueryVariables>(GetWatchlistsDocument, options);
        }
export type GetWatchlistsQueryHookResult = ReturnType<typeof useGetWatchlistsQuery>;
export type GetWatchlistsLazyQueryHookResult = ReturnType<typeof useGetWatchlistsLazyQuery>;
export type GetWatchlistsSuspenseQueryHookResult = ReturnType<typeof useGetWatchlistsSuspenseQuery>;
export type GetWatchlistsQueryResult = Apollo.QueryResult<GetWatchlistsQuery, GetWatchlistsQueryVariables>;
export const CancelOrderDocument = gql`
    mutation CancelOrder($orderId: ID!) {
  cancelOrder(orderId: $orderId) {
    id
    clientOrderId
    status
    updatedAt
  }
}
    `;
export type CancelOrderMutationFn = Apollo.MutationFunction<CancelOrderMutation, CancelOrderMutationVariables>;

/**
 * __useCancelOrderMutation__
 *
 * To run a mutation, you first call `useCancelOrderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelOrderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelOrderMutation, { data, loading, error }] = useCancelOrderMutation({
 *   variables: {
 *      orderId: // value for 'orderId'
 *   },
 * });
 */
export function useCancelOrderMutation(baseOptions?: Apollo.MutationHookOptions<CancelOrderMutation, CancelOrderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CancelOrderMutation, CancelOrderMutationVariables>(CancelOrderDocument, options);
      }
export type CancelOrderMutationHookResult = ReturnType<typeof useCancelOrderMutation>;
export type CancelOrderMutationResult = Apollo.MutationResult<CancelOrderMutation>;
export type CancelOrderMutationOptions = Apollo.BaseMutationOptions<CancelOrderMutation, CancelOrderMutationVariables>;
export const GetOrdersDocument = gql`
    query GetOrders($accountId: ID, $status: String, $side: String, $limit: Int, $offset: Int) {
  orders(
    accountId: $accountId
    status: $status
    side: $side
    limit: $limit
    offset: $offset
  ) {
    data {
      id
      clientOrderId
      externalRefId
      instrumentId
      side
      type
      quantity
      filledQty
      remainingQty
      price
      slPrice
      tpPrice
      status
      timeInForce
      createdAt
      updatedAt
      triggerPrice
      triggerCondition
      algoType
    }
    total
    limit
    offset
  }
}
    `;

/**
 * __useGetOrdersQuery__
 *
 * To run a query within a React component, call `useGetOrdersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOrdersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOrdersQuery({
 *   variables: {
 *      accountId: // value for 'accountId'
 *      status: // value for 'status'
 *      side: // value for 'side'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetOrdersQuery(baseOptions?: Apollo.QueryHookOptions<GetOrdersQuery, GetOrdersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetOrdersQuery, GetOrdersQueryVariables>(GetOrdersDocument, options);
      }
export function useGetOrdersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetOrdersQuery, GetOrdersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetOrdersQuery, GetOrdersQueryVariables>(GetOrdersDocument, options);
        }
// @ts-ignore
export function useGetOrdersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetOrdersQuery, GetOrdersQueryVariables>): Apollo.UseSuspenseQueryResult<GetOrdersQuery, GetOrdersQueryVariables>;
export function useGetOrdersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetOrdersQuery, GetOrdersQueryVariables>): Apollo.UseSuspenseQueryResult<GetOrdersQuery | undefined, GetOrdersQueryVariables>;
export function useGetOrdersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetOrdersQuery, GetOrdersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetOrdersQuery, GetOrdersQueryVariables>(GetOrdersDocument, options);
        }
export type GetOrdersQueryHookResult = ReturnType<typeof useGetOrdersQuery>;
export type GetOrdersLazyQueryHookResult = ReturnType<typeof useGetOrdersLazyQuery>;
export type GetOrdersSuspenseQueryHookResult = ReturnType<typeof useGetOrdersSuspenseQuery>;
export type GetOrdersQueryResult = Apollo.QueryResult<GetOrdersQuery, GetOrdersQueryVariables>;
export const GetPositionsDocument = gql`
    query GetPositions($accountId: ID, $currency: String, $limit: Int, $offset: Int) {
  positions(
    accountId: $accountId
    currency: $currency
    limit: $limit
    offset: $offset
  ) {
    data {
      instrumentId
      netQty
      avgPrice
      realizedPnl
      lastPrice
      mtmPnl
      value
    }
    total
    limit
    offset
  }
}
    `;

/**
 * __useGetPositionsQuery__
 *
 * To run a query within a React component, call `useGetPositionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPositionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPositionsQuery({
 *   variables: {
 *      accountId: // value for 'accountId'
 *      currency: // value for 'currency'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetPositionsQuery(baseOptions?: Apollo.QueryHookOptions<GetPositionsQuery, GetPositionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPositionsQuery, GetPositionsQueryVariables>(GetPositionsDocument, options);
      }
export function useGetPositionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPositionsQuery, GetPositionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPositionsQuery, GetPositionsQueryVariables>(GetPositionsDocument, options);
        }
// @ts-ignore
export function useGetPositionsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetPositionsQuery, GetPositionsQueryVariables>): Apollo.UseSuspenseQueryResult<GetPositionsQuery, GetPositionsQueryVariables>;
export function useGetPositionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPositionsQuery, GetPositionsQueryVariables>): Apollo.UseSuspenseQueryResult<GetPositionsQuery | undefined, GetPositionsQueryVariables>;
export function useGetPositionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetPositionsQuery, GetPositionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetPositionsQuery, GetPositionsQueryVariables>(GetPositionsDocument, options);
        }
export type GetPositionsQueryHookResult = ReturnType<typeof useGetPositionsQuery>;
export type GetPositionsLazyQueryHookResult = ReturnType<typeof useGetPositionsLazyQuery>;
export type GetPositionsSuspenseQueryHookResult = ReturnType<typeof useGetPositionsSuspenseQuery>;
export type GetPositionsQueryResult = Apollo.QueryResult<GetPositionsQuery, GetPositionsQueryVariables>;
export const ModifyOrderDocument = gql`
    mutation ModifyOrder($orderId: ID!, $price: Float, $quantity: Float) {
  modifyOrder(orderId: $orderId, price: $price, quantity: $quantity) {
    id
    clientOrderId
    status
    price
    quantity
    filledQty
    remainingQty
    updatedAt
  }
}
    `;
export type ModifyOrderMutationFn = Apollo.MutationFunction<ModifyOrderMutation, ModifyOrderMutationVariables>;

/**
 * __useModifyOrderMutation__
 *
 * To run a mutation, you first call `useModifyOrderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useModifyOrderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [modifyOrderMutation, { data, loading, error }] = useModifyOrderMutation({
 *   variables: {
 *      orderId: // value for 'orderId'
 *      price: // value for 'price'
 *      quantity: // value for 'quantity'
 *   },
 * });
 */
export function useModifyOrderMutation(baseOptions?: Apollo.MutationHookOptions<ModifyOrderMutation, ModifyOrderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ModifyOrderMutation, ModifyOrderMutationVariables>(ModifyOrderDocument, options);
      }
export type ModifyOrderMutationHookResult = ReturnType<typeof useModifyOrderMutation>;
export type ModifyOrderMutationResult = Apollo.MutationResult<ModifyOrderMutation>;
export type ModifyOrderMutationOptions = Apollo.BaseMutationOptions<ModifyOrderMutation, ModifyOrderMutationVariables>;
export const PlaceOrderDocument = gql`
    mutation PlaceOrder($input: PlaceOrderInput!) {
  placeOrder(input: $input) {
    id
    clientOrderId
    status
    createdAt
  }
}
    `;
export type PlaceOrderMutationFn = Apollo.MutationFunction<PlaceOrderMutation, PlaceOrderMutationVariables>;

/**
 * __usePlaceOrderMutation__
 *
 * To run a mutation, you first call `usePlaceOrderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePlaceOrderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [placeOrderMutation, { data, loading, error }] = usePlaceOrderMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function usePlaceOrderMutation(baseOptions?: Apollo.MutationHookOptions<PlaceOrderMutation, PlaceOrderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PlaceOrderMutation, PlaceOrderMutationVariables>(PlaceOrderDocument, options);
      }
export type PlaceOrderMutationHookResult = ReturnType<typeof usePlaceOrderMutation>;
export type PlaceOrderMutationResult = Apollo.MutationResult<PlaceOrderMutation>;
export type PlaceOrderMutationOptions = Apollo.BaseMutationOptions<PlaceOrderMutation, PlaceOrderMutationVariables>;
export const CancelBracketGroupDocument = gql`
    mutation CancelBracketGroup($parentOrderId: ID!) {
  cancelBracketGroup(parentOrderId: $parentOrderId) {
    id
    clientOrderId
    status
    updatedAt
  }
}
    `;
export type CancelBracketGroupMutationFn = Apollo.MutationFunction<CancelBracketGroupMutation, CancelBracketGroupMutationVariables>;

/**
 * __useCancelBracketGroupMutation__
 *
 * To run a mutation, you first call `useCancelBracketGroupMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelBracketGroupMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelBracketGroupMutation, { data, loading, error }] = useCancelBracketGroupMutation({
 *   variables: {
 *      parentOrderId: // value for 'parentOrderId'
 *   },
 * });
 */
export function useCancelBracketGroupMutation(baseOptions?: Apollo.MutationHookOptions<CancelBracketGroupMutation, CancelBracketGroupMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CancelBracketGroupMutation, CancelBracketGroupMutationVariables>(CancelBracketGroupDocument, options);
      }
export type CancelBracketGroupMutationHookResult = ReturnType<typeof useCancelBracketGroupMutation>;
export type CancelBracketGroupMutationResult = Apollo.MutationResult<CancelBracketGroupMutation>;
export type CancelBracketGroupMutationOptions = Apollo.BaseMutationOptions<CancelBracketGroupMutation, CancelBracketGroupMutationVariables>;