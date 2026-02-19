/**
 * @file src/modules/admin/services/admin-dashboard.service.ts
 * @module admin
 * @description Provides KPIs and audit listings for admin dashboard
 * @author BharatERP
 * @created 2025-01-09
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { OrderAuditEntity } from '../../oms/entities/order-audit.entity';
import { OrderEntity } from '../../oms/entities/order.entity';
import { AccountEntity } from '../../accounts/entities/account.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { getRequestContext } from '../../../shared/request-context';
import { AppLoggerService } from '../../../shared/logger';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(OrderAuditEntity)
    private readonly orderAudits: Repository<OrderAuditEntity>,
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
    @InjectRepository(AccountEntity)
    private readonly accounts: Repository<AccountEntity>,
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(AdminDashboardService.name);
  }

  async getStats(from?: string, to?: string) {
    const ctx = getRequestContext();
    const where: any = { tenantId: ctx?.tenantId };
    const dateRange =
      from && to ? { createdAt: Between(new Date(from), new Date(to)) } : undefined;

    const [userCount, accountCount, orderCount] = await Promise.all([
      this.users.count({ where: { ...where, ...(dateRange ?? {}) } }),
      this.accounts.count({ where: { ...where, ...(dateRange ?? {}) } }),
      this.orders.count({ where: { ...where, ...(dateRange ?? {}) } }),
    ]);

    const latestAudits = await this.orderAudits.find({
      where,
      order: { createdAt: 'DESC' } as any,
      take: 5,
    });

    return {
      users: userCount,
      accounts: accountCount,
      orders: orderCount,
      sampleAudits: latestAudits.map((a) => ({
        action: a.action,
        orderId: a.orderId,
        createdAt: a.createdAt,
      })),
    };
  }

  async listOrderAudits(limit = 50) {
    const ctx = getRequestContext();
    const where: any = { tenantId: ctx?.tenantId };
    return this.orderAudits.find({
      where,
      order: { createdAt: 'DESC' } as any,
      take: limit,
    });
  }
}

