/**
 * File:        apps/backend/src/debug-types.ts
 * Module:      (debug script)
 * Purpose:     Debug script to list all registered GraphQL ObjectTypes
 *
 * Exports:
 *   - (standalone script — no exports)
 *
 * Depends on:
 *   - @nestjs/graphql (TypeMetadataStorage)
 *   - path-register (tsconfig path aliases)
 *
 * Side-effects:
 *   - Reads NestJS GraphQL type metadata
 *
 * Key invariants:
 *   - Run manually against a live backend process
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-31
 */
require('../../../path-register');
import 'reflect-metadata';
import { TypeMetadataStorage } from '@nestjs/graphql';

async function main() {
  console.log('=== Registered ObjectType metadata ===');
  const metadata = TypeMetadataStorage.getObjectTypesMetadata();
  console.log(`Total: ${metadata.length}`);
  metadata.forEach((m: any, i: number) => {
    console.log(`${i+1}. name=${m.name} target=${m.target?.name || m.target?.toString()}`);
  });

  // Check for duplicates by name
  const names = metadata.map((m: any) => m.name);
  const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
  if (duplicates.length > 0) {
    console.log('\n=== DUPLICATE NAMES ===');
    duplicates.forEach(d => console.log(' DUPLICATE:', d));
  }
}
main().catch(console.error);