/**
 * @file src/shared/shared.module.ts
 * @module shared
 * @description Global shared module exporting AppLoggerService
 * @author BharatERP
 * @created 2025-09-18
 */

import { Global, Module } from '@nestjs/common';
import { AppLoggerService } from './logger';
import { AwsSnsService } from './aws/sns.service';
import { RedisService } from './redis/redis.service';
import { FxService } from './fx/fx.service';

@Global()
@Module({
  providers: [AppLoggerService, AwsSnsService, RedisService, FxService],
  exports: [AppLoggerService, AwsSnsService, RedisService, FxService],
})
export class SharedModule {}
