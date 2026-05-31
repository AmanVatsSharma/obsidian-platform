/**
 * File:        apps/backend/src/shared/cache/cache.module.ts
 * Module:      shared/cache
 * Purpose:     @Global() module providing ICacheService (RedisCacheService implementation).
 *              All read-heavy paths (instruments, quotes, balance) should use this.
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-31
 */

import { Global, Module } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';

@Global()
@Module({
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class CacheModule {}