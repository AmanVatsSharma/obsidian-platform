/**
 * File:        apps/web/codegen.ts
 * Module:      web · GraphQL · Codegen
 * Purpose:     graphql-codegen configuration — reads the shared schema and
 *              operation files, generates TypeScript types + typed React hooks.
 *
 * Generated outputs (DO NOT EDIT — machine generated):
 *   - gql/generated/graphql.ts  — all schema types
 *   - gql/generated/hooks.ts    — typed useQuery/useMutation hooks
 *
 * Run:  npm run codegen (from repo root)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
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
    'apps/web/gql/generated/hooks.ts': {
      preset: 'near-operation-file',
      presetConfig: {
        extension: '.ts',
        importPath: '@apollo/client',
        baseTypesPath: './graphql.ts',
      },
      plugins: ['typescript-operations', 'typescript-react-apollo'],
      config: {
        withHooks: true,
        withComponent: false,
        withMutationFn: true,
        strictScalars: false,
      },
    },
  },
};

export default config;