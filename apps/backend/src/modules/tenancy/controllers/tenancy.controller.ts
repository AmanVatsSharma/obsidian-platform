/**
 * @file src/modules/tenancy/controllers/tenancy.controller.ts
 * @module tenancy
 * @description REST controller for tenant governance and legal entity registration
 * @author BharatERP
 * @created 2026-02-17
 * @last-updated 2026-05-09
 */

import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CreateLegalEntityDto } from '../dtos/create-legal-entity.dto';
import { CreateTenantDto } from '../dtos/create-tenant.dto';
import { UpsertBrandConfigDto } from '../dtos/upsert-brand-config.dto';
import { LegalEntityEntity } from '../entities/legal-entity.entity';
import { TenantEntity } from '../entities/tenant.entity';
import { TenantBrandConfigEntity } from '../entities/tenant-brand-config.entity';
import { TenancyService } from '../services/tenancy.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PlatformOwnerGuard } from '../../rbac/guards/platform-owner.guard';

@Controller('tenancy')
export class TenancyController {
  constructor(private readonly tenancyService: TenancyService) {}

  @UseGuards(JwtAuthGuard, PlatformOwnerGuard)
  @Post('tenants')
  async createTenant(@Body() dto: CreateTenantDto): Promise<TenantEntity> {
    return this.tenancyService.createTenant(dto);
  }

  @UseGuards(JwtAuthGuard, PlatformOwnerGuard)
  @Get('tenants')
  async listTenants(): Promise<TenantEntity[]> {
    return this.tenancyService.listTenants();
  }

  @UseGuards(JwtAuthGuard, PlatformOwnerGuard)
  @Post('legal-entities')
  async createLegalEntity(@Body() dto: CreateLegalEntityDto): Promise<LegalEntityEntity> {
    return this.tenancyService.createLegalEntity(dto);
  }

  @UseGuards(JwtAuthGuard, PlatformOwnerGuard)
  @Get('legal-entities')
  async listLegalEntities(@Query('tenantId') tenantId?: string): Promise<LegalEntityEntity[]> {
    return this.tenancyService.listLegalEntities(tenantId);
  }

  /** Public endpoint — no auth guard. Resolved by subdomain in production. */
  @Get('brand-config')
  async getBrandConfig(@Query('slug') slug: string): Promise<TenantBrandConfigEntity | null> {
    return this.tenancyService.getBrandConfig(slug);
  }

  @UseGuards(JwtAuthGuard, PlatformOwnerGuard)
  @Post('tenants/:tenantId/brand-config')
  async upsertBrandConfig(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpsertBrandConfigDto,
  ): Promise<TenantBrandConfigEntity> {
    return this.tenancyService.upsertBrandConfig(tenantId, dto);
  }
}
