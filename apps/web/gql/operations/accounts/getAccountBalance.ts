import * as Types from '../../generated/graphql';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type GetAccountBalanceQueryVariables = Types.Exact<{
  accountId: Types.Scalars['String']['input'];
  currency?: Types.InputMaybe<Types.Scalars['String']['input']>;
}>;


export type GetAccountBalanceQuery = { __typename?: 'Query', accountBalance?: { __typename?: 'AccountBalancePayload', totalCash: string, lockedCash: string, availableCash: string, positionsValue: string, unrealizedPnl: string, equity: string, buyingPower: string, currency: string } | null };


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