import * as Types from '../../generated/graphql';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetInstrumentQueryVariables = Types.Exact<{
  exchange?: Types.InputMaybe<Types.Scalars['String']['input']>;
  symbol?: Types.InputMaybe<Types.Scalars['String']['input']>;
}>;


export type GetInstrumentQuery = { __typename?: 'Query', instrument?: { __typename?: 'InstrumentDto', id: string, exchangeCode: string, symbol: string, displayName: string, type: string, status?: string | null } | null };


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