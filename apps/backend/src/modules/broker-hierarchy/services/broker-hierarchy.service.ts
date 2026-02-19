/**
 * @file src/modules/broker-hierarchy/services/broker-hierarchy.service.ts
 * @module broker-hierarchy
 * @description Service for broker branch/desk/dealer hierarchy and delegated role mapping
 * @author BharatERP
 * @created 2026-02-17
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from '../../../shared/logger';
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

@Injectable()
export class BrokerHierarchyService {
  constructor(
    @InjectRepository(BrokerEntity)
    private readonly brokers: Repository<BrokerEntity>,
    @InjectRepository(BranchEntity)
    private readonly branches: Repository<BranchEntity>,
    @InjectRepository(DeskEntity)
    private readonly desks: Repository<DeskEntity>,
    @InjectRepository(DealerEntity)
    private readonly dealers: Repository<DealerEntity>,
    @InjectRepository(HierarchyRoleMappingEntity)
    private readonly roleMappings: Repository<HierarchyRoleMappingEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(BrokerHierarchyService.name);
  }

  async createBroker(dto: CreateBrokerDto): Promise<BrokerEntity> {
    this.logger.debug('createBroker:start', dto);
    const saved = await this.brokers.save(this.brokers.create(dto));
    this.logger.debug('createBroker:end', { brokerId: saved.id });
    return saved;
  }

  async createBranch(dto: CreateBranchDto): Promise<BranchEntity> {
    this.logger.debug('createBranch:start', dto);
    const saved = await this.branches.save(this.branches.create(dto));
    this.logger.debug('createBranch:end', { branchId: saved.id });
    return saved;
  }

  async createDesk(dto: CreateDeskDto): Promise<DeskEntity> {
    this.logger.debug('createDesk:start', dto);
    const saved = await this.desks.save(this.desks.create(dto));
    this.logger.debug('createDesk:end', { deskId: saved.id });
    return saved;
  }

  async createDealer(dto: CreateDealerDto): Promise<DealerEntity> {
    this.logger.debug('createDealer:start', dto);
    const saved = await this.dealers.save(this.dealers.create(dto));
    this.logger.debug('createDealer:end', { dealerId: saved.id });
    return saved;
  }

  async assignRole(dto: AssignHierarchyRoleDto): Promise<HierarchyRoleMappingEntity> {
    this.logger.debug('assignRole:start', dto);
    const saved = await this.roleMappings.save(this.roleMappings.create(dto));
    this.logger.debug('assignRole:end', { mappingId: saved.id });
    return saved;
  }

  async getHierarchy(tenantId: string): Promise<{
    brokers: BrokerEntity[];
    branches: BranchEntity[];
    desks: DeskEntity[];
    dealers: DealerEntity[];
    roleMappings: HierarchyRoleMappingEntity[];
  }> {
    this.logger.debug('getHierarchy:start', { tenantId });
    const brokers = await this.brokers.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
    const brokerIds = brokers.map((item) => item.id);
    const branches = brokerIds.length
      ? await this.branches.find({ where: brokerIds.map((brokerId) => ({ brokerId })), order: { createdAt: 'DESC' } })
      : [];
    const branchIds = branches.map((item) => item.id);
    const desks = branchIds.length
      ? await this.desks.find({ where: branchIds.map((branchId) => ({ branchId })), order: { createdAt: 'DESC' } })
      : [];
    const deskIds = desks.map((item) => item.id);
    const dealers = deskIds.length
      ? await this.dealers.find({ where: deskIds.map((deskId) => ({ deskId })), order: { createdAt: 'DESC' } })
      : [];
    const roleMappings = await this.roleMappings.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
    this.logger.debug('getHierarchy:end', {
      brokers: brokers.length,
      branches: branches.length,
      desks: desks.length,
      dealers: dealers.length,
      roleMappings: roleMappings.length,
    });
    return { brokers, branches, desks, dealers, roleMappings };
  }
}
