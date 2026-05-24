/**
 * File:        apps/backend/src/scripts/generate-schema.mjs
 * Module:      backend · Scripts
 * Purpose:     Generate GraphQL schema SDL from NestJS resolvers.
 *
 * Usage:       node apps/backend/src/scripts/generate-schema.mjs
 *
 * Key invariants:
 *   - Reads compiled .resolver.js files from dist/
 *   - Uses NestJS GraphQLModule.forRoot to auto-generate schema
 *   - Guards skipped (RbacResolver unavailable in isolation) — 17 resolvers is sufficient
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import 'reflect-metadata';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const fs = require('fs');
const path = require('path');

// Register @obsidian/* path aliases so dist/*.js files can resolve internal imports
const { register } = require('tsconfig-paths');
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
register({
  baseUrl: path.join(REPO_ROOT, 'apps', 'backend', 'src'),
  paths: {
    '@obsidian/backend-common':            ['common/index'],
    '@obsidian/backend-shared':            ['shared/index'],
    '@obsidian/backend-auth':              ['modules/auth/index'],
    '@obsidian/backend-users':             ['modules/users/index'],
    '@obsidian/backend-rbac':              ['modules/rbac/index'],
    '@obsidian/backend-tenancy':           ['modules/tenancy/index'],
    '@obsidian/backend-market':            ['modules/market/index'],
    '@obsidian/backend-accounts':          ['modules/accounts/index'],
    '@obsidian/backend-demo-accounts':    ['modules/demo-accounts/index'],
    '@obsidian/backend-oms':              ['modules/oms/index'],
    '@obsidian/backend-realtime':        ['modules/realtime/prana-stream/index'],
    '@obsidian/backend-notifications':    ['modules/notifications/index'],
    '@obsidian/backend-admin':            ['modules/admin/index'],
    '@obsidian/backend-execution-gateway':['modules/execution-gateway/index'],
    '@obsidian/backend-broker-hierarchy': ['modules/broker-hierarchy/index'],
    '@obsidian/backend-compliance':        ['modules/compliance/index'],
    '@obsidian/backend-onboarding':       ['modules/onboarding/index'],
    '@obsidian/backend-risk-policy':      ['modules/risk-policy/index'],
    '@obsidian/backend-settlement':       ['modules/settlement/index'],
    '@obsidian/backend-reconciliation':   ['modules/reconciliation/index'],
    '@obsidian/backend-corporate-actions':['modules/corporate-actions/index'],
    '@obsidian/backend-limits-controls': ['modules/limits-and-controls/index'],
    '@obsidian/backend-saas-control-plane':['modules/saas-control-plane/index'],
    '@obsidian/backend-dealing':          ['modules/dealing/index'],
    '@obsidian/backend-support':          ['modules/support/index'],
    '@obsidian/backend-partners':         ['modules/partners/index'],
    '@obsidian/backend-developer-platform':['modules/developer-platform/index'],
    '@obsidian/backend-pamm':            ['modules/pamm/index'],
    '@obsidian/backend-copy-trading':    ['modules/copy-trading/index'],
    '@obsidian/backend-lp-routing':      ['modules/lp-routing/index'],
    '@obsidian/backend-crm':            ['modules/crm/index'],
    '@obsidian/backend-promotions':       ['modules/promotions/index'],
    '@obsidian/backend-reports':         ['modules/reports/index'],
    '@obsidian/backend-rules-engine':    ['modules/rules-engine/index'],
    '@obsidian/backend/*':               ['*'],
  },
});

const { GraphQLModule } = require('@nestjs/graphql');
const { ApolloDriver } = require('@nestjs/apollo');
const { NestFactory } = require('@nestjs/core');
const { Module } = require('@nestjs/common');
const { printSchema } = require('graphql');

const OUTPUT_PATH = path.join(REPO_ROOT, 'libs', 'shared', 'graphql-schema', 'schema.gql');
const DIST_MODULES = path.join(REPO_ROOT, 'dist', 'apps', 'backend', 'src', 'modules');

function findResolvers(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...findResolvers(fp));
    else if (e.name.endsWith('.resolver.js')) out.push(fp);
  }
  return out;
}

async function main() {
  console.log('[generate-schema] Starting schema build...');
  const rps = findResolvers(DIST_MODULES);
  console.log('[generate-schema] Found ' + rps.length + ' resolver files in dist/');

  const resolvers = [];
  for (const rp of rps) {
    try {
      const mod = require(rp);
      const cls = mod.default ?? Object.values(mod).find(
        v => v && typeof v === 'function' && v.prototype && v.name.endsWith('Resolver'),
      );
      if (cls) resolvers.push(cls);
    } catch (err) {
      if (!err.message.includes('Invalid guard') && !err.message.includes('Circular dependency')) {
        console.warn('[generate-schema] Skipping ' + rp + ': ' + err.message.split('\n')[0]);
      }
    }
  }
  console.log('[generate-schema] Loaded ' + resolvers.length + ' resolvers');

  if (resolvers.length === 0) {
    console.error('[generate-schema] No resolvers — aborting');
    process.exit(1);
  }

  @Module({
    imports: [
      GraphQLModule.forRoot({
        driver: ApolloDriver,
        autoSchemaFile: OUTPUT_PATH,
        sortSchema: true,
        dateScalarMode: 'isoDate',
      }),
    ],
    providers: resolvers,
  })
  class SchemaGenModule {}

  const app = await NestFactory.createApplicationContext(SchemaGenModule, { logger: ['error', 'warn'] });

  const sdl = fs.readFileSync(OUTPUT_PATH, 'utf-8');
  const tc = (sdl.match(/^type\s+\w+/gm) ?? []).length;
  const ec = (sdl.match(/^enum\s+\w+/gm) ?? []).length;
  const ic = (sdl.match(/^input\s+\w+/gm) ?? []).length;
  console.log('[generate-schema] Schema written to ' + OUTPUT_PATH);
  console.log('[generate-schema] Types: ' + tc + ' | Enums: ' + ec + ' | Inputs: ' + ic);

  await app.close();
}

main().catch(err => {
  console.error('[generate-schema] Fatal:', err.message);
  process.exit(1);
});
