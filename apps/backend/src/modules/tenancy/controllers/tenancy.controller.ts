/**
 * @file src/modules/tenancy/controllers/tenancy.controller.ts
 * @module tenancy
 * @description REST controller for tenant governance and legal entity registration
 * @author BharatERP
 * @created 2026-02-17
 */

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateLegalEntityDto } from '../dtos/create-legal-entity.dto';
import { CreateTenantDto } from '../dtos/create-tenant.dto';
import { LegalEntityEntity } from '../entities/legal-entity.entity';
import { TenantEntity } from '../entities/tenant.entity';
import { TenancyService } from '../services/tenancy.service';

@Controller('tenancy')
export class TenancyController {
  constructor(private readonly tenancyService: TenancyService) {}

  @Post('tenants')
  async createTenant(@Body() dto: CreateTenantDto): Promise<TenantEntity> {
    return this.tenancyService.createTenant(dto);
  }

  @Get('tenants')
  async listTenants(): Promise<TenantEntity[]> {
    return this.tenancyService.listTenants();
  }

  @Post('legal-entities')
  async createLegalEntity(@Body() dto: CreateLegalEntityDto): Promise<LegalEntityEntity> {
    return this.tenancyService.createLegalEntity(dto);
  }

  @Get('legal-entities')
  async listLegalEntities(@Query('tenantId') tenantId?: string): Promise<LegalEntityEntity[]> {
    return this.tenancyService.listLegalEntities(tenantId);
  }
}
