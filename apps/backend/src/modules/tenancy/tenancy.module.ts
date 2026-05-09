/**
 * @file src/modules/tenancy/tenancy.module.ts
 * @module tenancy
 * @description Tenancy module managing tenant and legal-entity control plane data
 * @author BharatERP
 * @created 2026-02-17
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { RbacModule } from '../rbac/rbac.module';
import { TenancyController } from './controllers/tenancy.controller';
import { LegalEntityEntity } from './entities/legal-entity.entity';
import { TenantEntity } from './entities/tenant.entity';
import { TenantBrandConfigEntity } from './entities/tenant-brand-config.entity';
import { TenancyService } from './services/tenancy.service';
import { SubdomainResolverMiddleware } from './middleware/subdomain-resolver.middleware';

@Module({
  imports: [SharedModule, RbacModule, TypeOrmModule.forFeature([TenantEntity, LegalEntityEntity, TenantBrandConfigEntity])],
  controllers: [TenancyController],
  providers: [TenancyService, SubdomainResolverMiddleware],
  exports: [TenancyService, SubdomainResolverMiddleware],
})
export class TenancyModule {}
