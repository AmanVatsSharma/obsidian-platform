/**
 * @file src/modules/dealing/dealing.module.ts
 * @module dealing
 * @description Dealing module scaffold
 * @author BharatERP
 * @created 2026-02-19
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { DealingController } from './controllers/dealing.controller';
import { DealEntity } from './entities/deal.entity';
import { DealingQuoteEntity } from './entities/dealing-quote.entity';
import { DealingService } from './services/dealing.service';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [
    SharedModule,
    RbacModule,
    TypeOrmModule.forFeature([DealEntity, DealingQuoteEntity]),
  ],
  controllers: [DealingController],
  providers: [DealingService],
  exports: [DealingService],
})
export class DealingModule {}
