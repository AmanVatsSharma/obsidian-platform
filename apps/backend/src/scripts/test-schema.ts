/**
 * File:        apps/backend/src/scripts/test-schema.ts
 * Module:      backend · Scripts
 * Purpose:     Test schema generation script (dev-only).
 *
 * Usage:       node apps/backend/src/scripts/test-schema.ts
 *
 * Key invariants: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { ObjectType, Field, ID, Query, Resolver } from '@nestjs/graphql';

@ObjectType()
class TestType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;
}

@Resolver(() => TestType)
class TestResolver {
  @Query(() => TestType)
  test() { return new TestType(); }
}

async function main() {
  try {
    const schema = await buildSchema({ resolvers: [TestResolver], validate: false });
    const { printSchema } = await import('graphql');
    console.log('SUCCESS: type-graphql + @nestjs/graphql decorators work together');
    console.log(printSchema(schema));
  } catch (e) {
    console.error('FAILED:', (e as Error).message);
  }
}

main();