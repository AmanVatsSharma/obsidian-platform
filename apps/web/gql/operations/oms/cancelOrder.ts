import * as Types from '../../generated/graphql';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type CancelOrderMutationVariables = Types.Exact<{
  orderId: Types.Scalars['ID']['input'];
}>;


export type CancelOrderMutation = { __typename?: 'Mutation', cancelOrder?: { __typename?: 'OrderEntity', id: string, clientOrderId: string, status: string, updatedAt: string } | null };


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