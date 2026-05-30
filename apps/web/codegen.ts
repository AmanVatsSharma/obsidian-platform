/**
 * File:        apps/web/codegen.ts
 * Module:      web · GraphQL · Codegen
 * Purpose:     graphql-codegen configuration — reads the shared schema and
 *              operation files, generates TypeScript types + typed React hooks.
 *
 * Generated outputs (DO NOT EDIT — machine generated):
 *   - gql/generated/graphql.ts  — all schema types + utility types (Exact, InputMaybe, Scalars, Maybe)
 *   - gql/generated/hooks.ts    — typed useQuery/useMutation hooks + document definitions
 *
 * NOTE: hooks.ts uses Exact, InputMaybe, Scalars, and input types (e.g. PlaceOrderInput)
 * from graphql.ts. The codegen config uses importTypes + typesImportPath to auto-generate
 * the import, but a manual `import type { ... } from './graphql'` is appended as a fallback
 * because the near-operation-file preset does not always emit it correctly.
 *
 * Run:  npm run codegen:web (from apps/web)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-30
 */

import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../backend/src/generated/schema.gql',
  documents: [
    'gql/operations/**/*.gql',
    'features/**/*.gql',
  ],
  generates: {
    'gql/generated/graphql.ts': {
      plugins: ['typescript'],
      config: {
        defaultScalarType: 'unknown',
        scalars: {
          DateTime: 'string',
          UUID: 'string',
          JSON: 'unknown',
          Void: 'void',
          BigInt: 'number',
          Long: 'number',
        },
        strict: true,
        maybeValue: 'T | undefined',
      },
    },
    'gql/generated/hooks.ts': {
      plugins: ['typescript-operations', 'typescript-react-apollo'],
      documents: [
        'gql/operations/**/*.gql',
        'features/**/*.gql',
      ],
      config: {
        importTypes: true,
        typesImportPath: './graphql.ts',
        importTypesPrefix: 'Types',
        noRequireImports: true,
        withHooks: true,
        withComponent: false,
        withMutationFn: true,
        scalars: {
          DateTime: 'string',
          UUID: 'string',
          JSON: 'unknown',
          Void: 'void',
          BigInt: 'number',
          Long: 'number',
        },
      },
    },
  },
};

export default config;