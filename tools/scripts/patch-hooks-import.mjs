/**
 * File:        tools/scripts/patch-hooks-import.mjs
 * Module:      web · GraphQL · Codegen patch
 * Purpose:     Post-codegen patch for gql/generated/hooks.ts.
 *              Appends `import type { Exact, InputMaybe, Scalars, PlaceOrderInput } from './graphql'`
 *              after the Apollo imports. This is needed because the graphql-codegen
 *              `importTypes` / `typesImportPath` options do not reliably emit this import
 *              in the `typescript-react-apollo` plugin output.
 *
 * Run: called automatically by `npm run codegen:web` after codegen completes
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-30
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Default path when run from the repo root (after `cd apps/web && ...`)
const DEFAULT_HOOKS = resolve(__dirname, '../../apps/web/gql/generated/hooks.ts');
const HOOKS_PATH = resolve(process.argv[2] ?? DEFAULT_HOOKS);

const content = readFileSync(HOOKS_PATH, 'utf-8');
const APOLLO_IMPORT = "import * as Apollo from '@apollo/client';\nconst defaultOptions";
const PATCH = "import * as Apollo from '@apollo/client';\nimport type { Exact, InputMaybe, Scalars, PlaceOrderInput } from './graphql';\n\nconst defaultOptions";

if (content.includes(PATCH)) {
  // Already patched
  process.exit(0);
}

if (!content.includes(APOLLO_IMPORT)) {
  console.error(`patch-hooks-import: could not find anchor "${APOLLO_IMPORT}" in ${HOOKS_PATH}`);
  process.exit(1);
}

const patched = content.replace(APOLLO_IMPORT, PATCH);
writeFileSync(HOOKS_PATH, patched, 'utf-8');
console.log(`patch-hooks-import: patched ${HOOKS_PATH}`);
