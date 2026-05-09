/**
 * File:        apps/backend/src/modules/broker-hierarchy/broker-hierarchy.module.ts
 * Module:      broker-hierarchy
 * Purpose:     Broker hierarchy (branches, desks, dealers, IB trees) plus per-broker
 *              exchange access control.
 *
 * Exports:
 *   - BrokerHierarchyService      — hierarchy CRUD
 *   - IbCommissionService         — IB commission rules and ledger
 *   - BrokerExchangeConfigService — isExchangeEnabled() used by OMS
 *
 * Depends on:
 *   - SharedModule — AppLoggerService (global)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - BrokerExchangeConfigService is exported so OmsModule can inject it
 *
 * Read order:
 *   1. @Module declaration
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-08
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { RbacModule } from '../rbac/rbac.module';
import { BrokerHierarchyController } from './controllers/broker-hierarchy.controller';
import { BranchEntity } from './entities/branch.entity';
import { BrokerEntity } from './entities/broker.entity';
import { DealerEntity } from './entities/dealer.entity';
import { DeskEntity } from './entities/desk.entity';
import { HierarchyRoleMappingEntity } from './entities/hierarchy-role-mapping.entity';
import { IbRelationshipEntity } from './entities/ib-relationship.entity';
import { IbCommissionRuleEntity } from './entities/ib-commission-rule.entity';
import { IbCommissionLedgerEntity } from './entities/ib-commission-ledger.entity';
import { BrokerExchangeConfigEntity } from './entities/broker-exchange-config.entity';
import { BrokerHierarchyService } from './services/broker-hierarchy.service';
import { IbCommissionService } from './services/ib-commission.service';
import { BrokerExchangeConfigService } from './services/broker-exchange-config.service';

@Module({
  imports: [
    SharedModule,
    RbacModule,
    TypeOrmModule.forFeature([
      BrokerEntity,
      BranchEntity,
      DeskEntity,
      DealerEntity,
      HierarchyRoleMappingEntity,
      IbRelationshipEntity,
      IbCommissionRuleEntity,
      IbCommissionLedgerEntity,
      BrokerExchangeConfigEntity,
    ]),
  ],
  controllers: [BrokerHierarchyController],
  providers: [BrokerHierarchyService, IbCommissionService, BrokerExchangeConfigService],
  exports: [BrokerHierarchyService, IbCommissionService, BrokerExchangeConfigService],
})
export class BrokerHierarchyModule {}
