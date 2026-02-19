/**
 * @file src/modules/admin/admin.module.ts
 * @module admin
 * @description Admin dashboard module exposing stats and audit log APIs
 * @author BharatERP
 * @created 2025-01-09
 */

import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminAuditController } from './controllers/admin-audit.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderAuditEntity } from '../oms/entities/order-audit.entity';
import { OrderEntity } from '../oms/entities/order.entity';
import { AccountEntity } from '../accounts/entities/account.entity';
import { UserEntity } from '../users/entities/user.entity';
import { AdminDashboardService } from './services/admin-dashboard.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([OrderAuditEntity, OrderEntity, AccountEntity, UserEntity]),
  ],
  controllers: [AdminDashboardController, AdminAuditController],
  providers: [AdminDashboardService],
})
export class AdminModule {}

