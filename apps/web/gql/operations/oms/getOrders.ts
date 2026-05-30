import * as Types from '../../generated/graphql';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetOrdersQueryVariables = Types.Exact<{
  accountId?: Types.InputMaybe<Types.Scalars['ID']['input']>;
  status?: Types.InputMaybe<Types.Scalars['String']['input']>;
  side?: Types.InputMaybe<Types.Scalars['String']['input']>;
  limit?: Types.InputMaybe<Types.Scalars['Int']['input']>;
  offset?: Types.InputMaybe<Types.Scalars['Int']['input']>;
}>;


export type GetOrdersQuery = { __typename?: 'Query', orders?: { __typename?: 'OrderConnection', total: number, limit: number, offset: number, data: Array<{ __typename?: 'OrderEntity', id: string, clientOrderId: string, externalRefId: string, instrumentId: string, side: string, type: string, quantity: number, filledQty: number, remainingQty: number, price?: number | null, slPrice?: number | null, tpPrice?: number | null, status: string, timeInForce: string, createdAt: string, updatedAt: string, triggerPrice?: number | null, triggerCondition?: string | null, algoType?: string | null }> } | null };


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