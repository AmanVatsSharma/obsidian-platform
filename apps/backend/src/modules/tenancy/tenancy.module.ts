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
import { TenancyController } from './controllers/tenancy.controller';
import { LegalEntityEntity } from './entities/legal-entity.entity';
import { TenantEntity } from './entities/tenant.entity';
import { TenancyService } from './services/tenancy.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([TenantEntity, LegalEntityEntity])],
  controllers: [TenancyController],
  providers: [TenancyService],
  exports: [TenancyService],
})
export class TenancyModule {}
