/**
 * @file src/modules/broker-hierarchy/broker-hierarchy.module.ts
 * @module broker-hierarchy
 * @description Module for broker branch/desk/dealer hierarchy and delegation model
 * @author BharatERP
 * @created 2026-02-17
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { BrokerHierarchyController } from './controllers/broker-hierarchy.controller';
import { BranchEntity } from './entities/branch.entity';
import { BrokerEntity } from './entities/broker.entity';
import { DealerEntity } from './entities/dealer.entity';
import { DeskEntity } from './entities/desk.entity';
import { HierarchyRoleMappingEntity } from './entities/hierarchy-role-mapping.entity';
import { BrokerHierarchyService } from './services/broker-hierarchy.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([
      BrokerEntity,
      BranchEntity,
      DeskEntity,
      DealerEntity,
      HierarchyRoleMappingEntity,
    ]),
  ],
  controllers: [BrokerHierarchyController],
  providers: [BrokerHierarchyService],
  exports: [BrokerHierarchyService],
})
export class BrokerHierarchyModule {}
