/**
 * @file src/modules/admin/controllers/admin-audit.controller.ts
 * @module admin
 * @description Admin audit log viewer for order audits
 * @author BharatERP
 * @created 2025-01-09
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../rbac/guards/tenant.guard';
import { PermissionsGuard } from '../../rbac/guards/permissions.guard';
import { Permissions } from '../../rbac/decorators/permissions.decorator';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import { AppLoggerService } from '../../../shared/logger';

@ApiTags('admin/audit')
@Controller('admin/audit')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class AdminAuditController {
  constructor(
    private readonly service: AdminDashboardService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(AdminAuditController.name);
  }

  @Get('orders')
  @Permissions('oms:admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List order audit logs' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiResponse({ status: 200, description: 'Order audits' })
  async listOrderAudits(@Query('limit') limit?: string) {
    const take = limit ? Math.min(parseInt(limit, 10) || 50, 200) : 50;
    this.logger.debug('GET /admin/audit/orders', { take });
    return this.service.listOrderAudits(take);
  }
}

