import * as Types from '../../generated/graphql';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetInstrumentsQueryVariables = Types.Exact<{
  exchangeCode?: Types.InputMaybe<Types.Scalars['String']['input']>;
  type?: Types.InputMaybe<Types.Scalars['String']['input']>;
  q?: Types.InputMaybe<Types.Scalars['String']['input']>;
}>;


export type GetInstrumentsQuery = { __typename?: 'Query', instruments: Array<{ __typename?: 'InstrumentDto', id: string, exchangeCode: string, symbol: string, displayName: string, type: string, status?: string | null }> };


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