/**
 * @file src/modules/admin/controllers/admin-dashboard.controller.ts
 * @module admin
 * @description Admin dashboard KPIs (multi-tenant scoped)
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

@ApiTags('admin/dashboard')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class AdminDashboardController {
  constructor(
    private readonly service: AdminDashboardService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(AdminDashboardController.name);
  }

  @Get('stats')
  @Permissions('oms:admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'High-level KPIs' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date string' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date string' })
  @ApiResponse({ status: 200, description: 'KPI snapshot' })
  async getStats(@Query('from') from?: string, @Query('to') to?: string) {
    this.logger.debug('GET /admin/dashboard/stats', { from, to });
    return this.service.getStats(from, to);
  }
}

