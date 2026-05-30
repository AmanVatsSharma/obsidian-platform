import * as Types from '../../generated/graphql';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetQuoteQueryVariables = Types.Exact<{
  exchange?: Types.InputMaybe<Types.Scalars['String']['input']>;
  symbol?: Types.InputMaybe<Types.Scalars['String']['input']>;
  id?: Types.InputMaybe<Types.Scalars['String']['input']>;
  status?: Types.InputMaybe<Types.Scalars['String']['input']>;
}>;


export type GetQuoteQuery = { __typename?: 'Query', quote?: { __typename?: 'QuoteDto', symbol: string, exchange: string, price: number, ts: string } | null };


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