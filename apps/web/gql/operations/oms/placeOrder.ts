import * as Types from '../../generated/graphql';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type PlaceOrderMutationVariables = Types.Exact<{
  input: Types.PlaceOrderInput;
}>;


export type PlaceOrderMutation = { __typename?: 'Mutation', placeOrder?: { __typename?: 'OrderEntity', id: string, clientOrderId: string, status: string, createdAt: string } | null };


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