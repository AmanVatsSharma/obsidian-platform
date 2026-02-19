/**
 * @file src/modules/broker-hierarchy/controllers/broker-hierarchy.controller.ts
 * @module broker-hierarchy
 * @description Controller for broker hierarchy and delegated-role control plane scaffolds
 * @author BharatERP
 * @created 2026-02-17
 */

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AssignHierarchyRoleDto } from '../dtos/assign-hierarchy-role.dto';
import { CreateBranchDto } from '../dtos/create-branch.dto';
import { CreateBrokerDto } from '../dtos/create-broker.dto';
import { CreateDealerDto } from '../dtos/create-dealer.dto';
import { CreateDeskDto } from '../dtos/create-desk.dto';
import { BranchEntity } from '../entities/branch.entity';
import { BrokerEntity } from '../entities/broker.entity';
import { DealerEntity } from '../entities/dealer.entity';
import { DeskEntity } from '../entities/desk.entity';
import { HierarchyRoleMappingEntity } from '../entities/hierarchy-role-mapping.entity';
import { BrokerHierarchyService } from '../services/broker-hierarchy.service';

@Controller('broker-hierarchy')
export class BrokerHierarchyController {
  constructor(private readonly brokerHierarchyService: BrokerHierarchyService) {}

  @Post('brokers')
  async createBroker(@Body() dto: CreateBrokerDto): Promise<BrokerEntity> {
    return this.brokerHierarchyService.createBroker(dto);
  }

  @Post('branches')
  async createBranch(@Body() dto: CreateBranchDto): Promise<BranchEntity> {
    return this.brokerHierarchyService.createBranch(dto);
  }

  @Post('desks')
  async createDesk(@Body() dto: CreateDeskDto): Promise<DeskEntity> {
    return this.brokerHierarchyService.createDesk(dto);
  }

  @Post('dealers')
  async createDealer(@Body() dto: CreateDealerDto): Promise<DealerEntity> {
    return this.brokerHierarchyService.createDealer(dto);
  }

  @Post('roles')
  async assignRole(@Body() dto: AssignHierarchyRoleDto): Promise<HierarchyRoleMappingEntity> {
    return this.brokerHierarchyService.assignRole(dto);
  }

  @Get('tenant/:tenantId')
  async getHierarchy(@Param('tenantId') tenantId: string) {
    return this.brokerHierarchyService.getHierarchy(tenantId);
  }
}
