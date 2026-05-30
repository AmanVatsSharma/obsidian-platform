import * as Types from '../../generated/graphql';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetWatchlistsQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type GetWatchlistsQuery = { __typename?: 'Query', watchlists: Array<{ __typename?: 'WatchlistDto', id: string, name: string, createdAt: string }> };


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