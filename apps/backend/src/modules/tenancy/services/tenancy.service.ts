/**
 * File:        apps/backend/src/modules/tenancy/services/tenancy.service.ts
 * Module:      tenancy
 * Purpose:     Business service for tenant lifecycle, legal-entity, and brand config.
 *
 * Exports:
 *   - TenancyService.createTenant(dto) → TenantEntity
 *   - TenancyService.listTenants() → TenantEntity[]
 *   - TenancyService.createLegalEntity(dto) → LegalEntityEntity
 *   - TenancyService.listLegalEntities(tenantId?) → LegalEntityEntity[]
 *   - TenancyService.getBrandConfig(slugOrDomain) → TenantBrandConfigEntity | null
 *   - TenancyService.upsertBrandConfig(tenantId, dto) → TenantBrandConfigEntity
 *
 * Depends on:
 *   - TenantBrandConfigEntity — brand config table
 *
 * Side-effects: DB writes
 * Key invariants:
 *   - getBrandConfig resolves by tenant.code (slug) first, then brandConfig.customDomain
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppError } from '../../../common/errors/app-error';
import { AppLoggerService } from '../../../shared/logger';
import { CreateLegalEntityDto } from '../dtos/create-legal-entity.dto';
import { CreateTenantDto } from '../dtos/create-tenant.dto';
import { UpsertBrandConfigDto } from '../dtos/upsert-brand-config.dto';
import { LegalEntityEntity } from '../entities/legal-entity.entity';
import { TenantEntity } from '../entities/tenant.entity';
import { TenantBrandConfigEntity } from '../entities/tenant-brand-config.entity';

@Injectable()
export class TenancyService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(LegalEntityEntity)
    private readonly legalEntities: Repository<LegalEntityEntity>,
    @InjectRepository(TenantBrandConfigEntity)
    private readonly brandConfigs: Repository<TenantBrandConfigEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(TenancyService.name);
  }

  async createTenant(dto: CreateTenantDto): Promise<TenantEntity> {
    this.logger.debug('createTenant:start', dto);
    const existing = await this.tenants.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new AppError('DUPLICATE_RESOURCE', `Tenant code ${dto.code} already exists`);
    }

    const entity = this.tenants.create({
      code: dto.code,
      displayName: dto.displayName,
      timezone: dto.timezone ?? 'UTC',
      jurisdictionProfile: dto.jurisdictionProfile ?? 'GLOBAL',
      status: dto.status ?? 'PENDING',
    });
    const saved = await this.tenants.save(entity);
    this.logger.debug('createTenant:end', { tenantId: saved.id });
    return saved;
  }

  async listTenants(): Promise<TenantEntity[]> {
    this.logger.debug('listTenants:start');
    const items = await this.tenants.find({ order: { createdAt: 'DESC' } });
    this.logger.debug('listTenants:end', { count: items.length });
    return items;
  }

  async createLegalEntity(dto: CreateLegalEntityDto): Promise<LegalEntityEntity> {
    this.logger.debug('createLegalEntity:start', dto);
    const tenant = await this.tenants.findOne({ where: { id: dto.tenantId } });
    if (!tenant) {
      throw new AppError('RESOURCE_NOT_FOUND', `Tenant ${dto.tenantId} not found`);
    }

    const entity = this.legalEntities.create(dto);
    const saved = await this.legalEntities.save(entity);
    this.logger.debug('createLegalEntity:end', { legalEntityId: saved.id });
    return saved;
  }

  async listLegalEntities(tenantId?: string): Promise<LegalEntityEntity[]> {
    this.logger.debug('listLegalEntities:start', { tenantId });
    const items = await this.legalEntities.find({
      where: tenantId ? { tenantId } : {},
      order: { createdAt: 'DESC' },
    });
    this.logger.debug('listLegalEntities:end', { count: items.length });
    return items;
  }

  async findByCode(code: string): Promise<TenantEntity | null> {
    return this.tenants.findOne({ where: { code } });
  }

  async getBrandConfig(slugOrDomain: string): Promise<TenantBrandConfigEntity | null> {
    this.logger.debug('getBrandConfig:start', { slugOrDomain });
    const tenant = await this.tenants.findOne({ where: { code: slugOrDomain } });
    if (tenant) {
      return this.brandConfigs.findOne({ where: { tenantId: tenant.id } });
    }
    return this.brandConfigs.findOne({ where: { customDomain: slugOrDomain } });
  }

  async upsertBrandConfig(tenantId: string, dto: UpsertBrandConfigDto): Promise<TenantBrandConfigEntity> {
    this.logger.debug('upsertBrandConfig:start', { tenantId });
    const existing = await this.brandConfigs.findOne({ where: { tenantId } });
    const merged = this.brandConfigs.create({
      ...(existing ?? {}),
      tenantId,
      ...dto,
      features: { ...(existing?.features ?? {}), ...(dto.features ?? {}) },
    });
    const saved = await this.brandConfigs.save(merged);
    this.logger.debug('upsertBrandConfig:end', { tenantId });
    return saved;
  }
}
