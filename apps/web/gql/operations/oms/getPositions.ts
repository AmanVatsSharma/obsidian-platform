import * as Types from '../../generated/graphql';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetPositionsQueryVariables = Types.Exact<{
  accountId?: Types.InputMaybe<Types.Scalars['ID']['input']>;
  currency?: Types.InputMaybe<Types.Scalars['String']['input']>;
  limit?: Types.InputMaybe<Types.Scalars['Int']['input']>;
  offset?: Types.InputMaybe<Types.Scalars['Int']['input']>;
}>;


export type GetPositionsQuery = { __typename?: 'Query', positions?: { __typename?: 'PositionConnection', total: number, limit: number, offset: number, data: Array<{ __typename?: 'PositionRow', instrumentId: string, netQty: number, avgPrice: number, realizedPnl: number, lastPrice: number, mtmPnl: number, value: number }> } | null };


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