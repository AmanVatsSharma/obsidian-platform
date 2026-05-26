/**
 * File:        apps/backend/src/scripts/generate-schema.js
 * Module:      backend · Build
 * Purpose:     Build the GraphQL SDL from all NestJS resolver decorators and
 *              write it to libs/shared/graphql-schema/schema.gql for cross-frontend
 *              consumption (GraphQL code-gen, schema checks).
 *
 *              Uses @nestjs/graphql's LazyMetadataStorage + GraphQLSchemaFactory
 *              directly — no NestJS DI container, no DB connection, no AppModule.
 *              Resolver classes are discovered via file-system scan.
 *
 * Usage:       node apps/backend/src/scripts/generate-schema.js
 *
 * Side-effects: Writes schema.gql to libs/shared/graphql-schema/
 *
 * Key invariants:
 *   - Pure CommonJS .js (no TypeScript compilation needed)
 *   - tsconfig-paths register for @obsidian/* aliases before loading resolvers
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

'use strict';

const { join, resolve } = require('path');
const { writeFileSync, readdirSync } = require('fs');
const { printSchema } = require('graphql');
require('reflect-metadata');

// ---------------------------------------------------------------------------
// Register @obsidian/* path aliases from tsconfig so resolvers can import
// their service dependencies (e.g. accounts.resolver.ts imports @obsidian/backend-auth).
// ---------------------------------------------------------------------------
const { loadConfig, register } = require('tsconfig-paths');
const { absoluteBaseUrl, paths } = loadConfig(resolve(__dirname, '..'));
console.log('[generate-schema] tsconfig baseUrl:', absoluteBaseUrl);
register({ baseUrl: absoluteBaseUrl, paths });

// ---------------------------------------------------------------------------
// Load NestJS GraphQL schema-building infrastructure
// ---------------------------------------------------------------------------
const { LazyMetadataStorage } = require('@nestjs/graphql/dist/schema-builder/storages/lazy-metadata.storage');
const { TypeMetadataStorage } = require('@nestjs/graphql/dist/schema-builder/storages/type-metadata.storage');
const { GraphQLSchemaFactory } = require('@nestjs/graphql/dist/schema-builder/graphql-schema.factory');

const BACKEND_SRC = resolve(__dirname, '..');
const OUTPUT_PATH = resolve(
  __dirname, '..', '..', '..', '..',
  'libs', 'shared', 'graphql-schema', 'schema.gql',
);

// ---------------------------------------------------------------------------
// Collect all .resolver.ts files under apps/backend/src/modules/
// ---------------------------------------------------------------------------
function collectResolverPaths(dir) {
  const paths = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        paths.push(...collectResolverPaths(full));
      } else if (entry.name.endsWith('.resolver.ts')) {
        paths.push(full);
      }
    }
  } catch (e) {
    console.error('[generate-schema] Cannot read directory:', dir, e.message);
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('[generate-schema] Starting schema build...');

  // Step 1: discover resolver files
  const resolverPaths = collectResolverPaths(join(BACKEND_SRC, 'modules'));
  console.log(`[generate-schema] Found ${resolverPaths.length} resolver files`);

  // Step 2: load resolver classes via absolute paths (tsconfig-paths resolves @obsidian/*)
  const resolvers = [];
  for (const rp of resolverPaths) {
    try {
      const mod = require(rp);
      const resolver = mod.default ?? Object.values(mod)[0];
      if (resolver) resolvers.push(resolver);
    } catch (err) {
      console.warn(`[generate-schema] Skipping ${rp}: ${err.message}`);
    }
  }
  console.log(`[generate-schema] Loaded ${resolvers.length} resolvers`);

  if (resolvers.length === 0) {
    console.error('[generate-schema] No resolvers loaded — aborting');
    process.exit(1);
  }

  // Step 3: build schema using LazyMetadataStorage + GraphQLSchemaFactory
  LazyMetadataStorage.load(resolvers);

  const schemaFactory = new GraphQLSchemaFactory();
  const schema = await schemaFactory.create(resolvers, {
    skipCheck: true,
    orphanedTypes: [],
  });

  const sdl = printSchema(schema);
  writeFileSync(OUTPUT_PATH, sdl, 'utf-8');

  const typeCount = (sdl.match(/^type\s+\w+/gm) ?? []).length;
  const enumCount = (sdl.match(/^enum\s+\w+/gm) ?? []).length;
  const inputCount = (sdl.match(/^input\s+\w+/gm) ?? []).length;
  console.log(`[generate-schema] Schema written to ${OUTPUT_PATH}`);
  console.log(`[generate-schema] Types: ${typeCount} | Enums: ${enumCount} | Inputs: ${inputCount}`);
}

main().catch((err) => {
  console.error('[generate-schema] Fatal:', err);
  process.exit(1);
});
