/**
 * @file src/modules/corporate-actions/corporate-actions.module.ts
 * @module corporate-actions
 * @description Corporate actions module scaffold
 * @author BharatERP
 * @created 2026-02-17
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { CorporateActionsController } from './controllers/corporate-actions.controller';
import { CorporateActionEntity } from './entities/corporate-action.entity';
import { CorporateActionsService } from './services/corporate-actions.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([CorporateActionEntity])],
  controllers: [CorporateActionsController],
  providers: [CorporateActionsService],
  exports: [CorporateActionsService],
})
export class CorporateActionsModule {}
