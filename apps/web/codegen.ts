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
  schema: '/home/amansharma/Desktop/DevOPS/Obsidian/libs/shared/graphql-schema/schema.gql',
  documents: [
    'apps/web/gql/operations/**/*.gql',
    'apps/web/features/**/*.gql',
  ],
  generates: {
    'apps/web/gql/generated/graphql.ts': {
      plugins: ['typescript'],
      config: {
        namingConvention: 'keep-case',
        defaultScalarType: 'unknown',
        scalars: {
          DateTime: 'string',
          UUID: 'string',
          JSON: 'unknown',
          Void: 'void',
        },
      },
    },
    'apps/web/gql/generated/hooks.ts': {
      preset: 'near-operation-file',
      presetConfig: {
        extension: '.ts',
        importPath: '@apollo/client',
      },
      plugins: ['typescript-operations', 'typescript-react-apollo'],
      config: {
        withHooks: true,
        withComponent: false,
        withMutationFn: true,
        strictScalars: true,
      },
    },
  },
  hooks: {
    afterAllFileWrite: ['npx prettier --write'],
  },
};

export default config;