import * as Types from '../../generated/graphql';

import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
const defaultOptions = {} as const;
export type ModifyOrderMutationVariables = Types.Exact<{
  orderId: Types.Scalars['ID']['input'];
  price?: Types.InputMaybe<Types.Scalars['Float']['input']>;
  quantity?: Types.InputMaybe<Types.Scalars['Float']['input']>;
}>;


export type ModifyOrderMutation = { __typename?: 'Mutation', modifyOrder?: { __typename?: 'OrderEntity', id: string, clientOrderId: string, status: string, price?: number | null, quantity: number, filledQty: number, remainingQty: number, updatedAt: string } | null };


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