/**
 * @file src/modules/risk-policy/controllers/risk-policy.controller.ts
 * @module risk-policy
 * @description Controller for risk policy creation and tenant assignment APIs
 * @author BharatERP
 * @created 2026-02-17
 */

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AssignRiskPolicyDto, CreateRiskPolicyDto } from '../dtos/create-risk-policy.dto';
import { RiskPolicyEntity } from '../entities/risk-policy.entity';
import { TenantRiskPolicyEntity } from '../entities/tenant-risk-policy.entity';
import { RiskPolicyService } from '../services/risk-policy.service';

@Controller('risk-policy')
export class RiskPolicyController {
  constructor(private readonly riskPolicyService: RiskPolicyService) {}

  @Post('policies')
  async create(@Body() dto: CreateRiskPolicyDto): Promise<RiskPolicyEntity> {
    return this.riskPolicyService.createPolicy(dto);
  }

  @Post('assignments')
  async assign(@Body() dto: AssignRiskPolicyDto): Promise<TenantRiskPolicyEntity> {
    return this.riskPolicyService.assignPolicy(dto);
  }

  @Get('policies')
  async list(@Query('tenantId') tenantId: string): Promise<RiskPolicyEntity[]> {
    return this.riskPolicyService.listPolicies(tenantId);
  }
}
