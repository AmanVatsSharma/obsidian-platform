/**
 * @file src/app.module.ts
 * @module app
 * @description Root application module wiring shared infra and feature modules
 * @author BharatERP
 * @created 2025-09-18
 */

import { Module, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { buildConfigModuleOptions } from './shared/config/app.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmConfig } from './shared/database/typeorm.config';
import { UsersModule } from '@nesttrade/backend-users';
import { AuthModule } from '@nesttrade/backend-auth';
import { RbacModule } from '@nesttrade/backend-rbac';
import { MarketModule } from '@nesttrade/backend-market';
import { AccountsModule } from '@nesttrade/backend-accounts';
import { OmsModule } from '@nesttrade/backend-oms';
import { RequestContextMiddleware } from './shared/request-id.middleware';
import { PranaStreamModule } from '@nesttrade/backend-realtime';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { NotificationsModule } from '@nesttrade/backend-notifications';
import { AdminModule } from '@nesttrade/backend-admin';
import { ObservabilityModule } from './shared/observability/observability.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'docs', 'ws'),
      serveRoot: '/docs/ws',
    }),
    ConfigModule.forRoot(buildConfigModuleOptions()),
    TypeOrmModule.forRoot(buildTypeOrmConfig()),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    UsersModule,
    AuthModule,
    RbacModule,
    MarketModule,
    AccountsModule,
    OmsModule,
    PranaStreamModule,
    NotificationsModule,
    AdminModule,
    ObservabilityModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
