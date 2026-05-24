/**
 * File:        apps/backend/src/scripts/generate-schema.ts
 * Module:      backend · Build
 * Purpose:     Build the GraphQL SDL from all NestJS resolver files and
 *              write it to libs/shared/graphql-schema/schema.gql for
 *              cross-frontend consumption (GraphQL code-gen, schema checks).
 *
 * Usage:       npx ts-node --transpile-only --project apps/backend/tsconfig.app.json --require ./path-register.js apps/backend/src/scripts/generate-schema.ts
 *              or via: npm run graphql:schema
 *
 * Side-effects: Writes schema.gql to libs/shared/graphql-schema/
 *
 * Key invariants:
 *   - path-register.js resolves @obsidian/* path aliases in source .ts files
 *   - tsconfig.app.json provides experimentalDecorators + emitDecoratorMetadata
 *   - Uses NestJS AppModule directly for complete DI resolution, with error recovery
 *     for providers that fail in SCHEMA_GEN mode (TypeORM stubs, seeder DB calls)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import 'reflect-metadata';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

// MUST be set before AppModule imports (both for TypeORM and for the buildTypeOrmConfig stub)
process.env.SCHEMA_GEN = 'true';

void (async () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));

  // Output path: libs/shared/graphql-schema/schema.gql
  const OUTPUT_PATH = resolve(__dirname, '..', '..', '..', '..', '..', 'libs', 'shared', 'graphql-schema', 'schema.gql');

  console.log('[generate-schema] Starting schema build...');

  const { NestFactory } = await import('@nestjs/core');

  // ts-node needs .ts extension for transpilation; dynamic import of app.module.ts
  const appModule = await import('../app.module.ts');
  const AppModule = appModule.AppModule ?? appModule.default;

  let app: Parameters<typeof NestFactory.createApplicationContext>[0] = AppModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app = await NestFactory.createApplicationContext(AppModule as any, { logger: ['error', 'warn'] });
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = err as any;
    const msg = (err as Error)?.message ?? '';
    const partialApp = e?.app ?? e?.context;
    const isRecoverable = partialApp || msg.includes('Ident authentication failed') ||
      msg.includes('Cannot read properties of undefined') ||
      msg.includes('connectTimeout') || msg.includes('ETIMEDOUT') ||
      msg.includes('ECONNREFUSED');
    if (isRecoverable) {
      console.warn('[generate-schema] Expected failure (SCHEMA_GEN mode): ' + msg.split('\n')[0]);
      if (partialApp) {
        app = partialApp;
        console.warn('[generate-schema] Recovered partial app context.');
      }
    }
    if (app === AppModule) throw err;
  }

  const { GraphQLSchemaBuilder } = await import('@nestjs/graphql/dist/graphql-schema.builder');
  const schemaBuilder = (app as { get: (t: unknown) => unknown }).get(GraphQLSchemaBuilder) as {
    generateSchema: (r: unknown, path: string, opts: unknown, sort: boolean) => Promise<void>;
  };

  await schemaBuilder.generateSchema([], OUTPUT_PATH, { dateScalarMode: 'isoDate' }, true);

  const sdl = readFileSync(OUTPUT_PATH, 'utf-8');
  const typeCount = (sdl.match(/^type\s+\w+/gm) ?? []).length;
  const enumCount = (sdl.match(/^enum\s+\w+/gm) ?? []).length;
  const inputCount = (sdl.match(/^input\s+\w+/gm) ?? []).length;
  console.log('[generate-schema] Schema written to ' + OUTPUT_PATH);
  console.log('[generate-schema] Types: ' + typeCount + ' | Enums: ' + enumCount + ' | Inputs: ' + inputCount);

  await (app as { close: () => unknown }).close();
})().catch((err) => {
  console.error('[generate-schema] Fatal:', err);
  process.exit(1);
});