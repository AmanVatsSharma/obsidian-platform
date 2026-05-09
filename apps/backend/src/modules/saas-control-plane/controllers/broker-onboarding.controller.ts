/**
 * File:        apps/backend/src/modules/saas-control-plane/controllers/broker-onboarding.controller.ts
 * Module:      saas-control-plane
 * Purpose:     Platform Owner REST endpoints for broker lifecycle management.
 *
 * Exports:
 *   - BrokerOnboardingController  — @Controller('saas')
 *       POST  /saas/onboard-broker               — full broker onboarding (atomic-ish)
 *       GET   /saas/brokers                      — list all provisioned brokers
 *       GET   /saas/brokers/:tenantCode          — get single broker by slug
 *       POST  /saas/brokers/:tenantCode/suspend  — suspend broker + revoke all tokens
 *
 * Depends on:
 *   - BrokerOnboardingService  — all business logic
 *   - JwtAuthGuard             — validates access token
 *   - PlatformOwnerGuard       — enforces tid='platform' + platform_owner role
 *
 * Side-effects:  DB writes + optional SMS + outbox event (via BrokerOnboardingService)
 *
 * Key invariants:
 *   - Every endpoint is platform-owner gated — no public routes here.
 *   - requestedBy is set from the authenticated user's ID (req.user.userId).
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PlatformOwnerGuard } from '../../rbac/guards/platform-owner.guard';
import { OnboardBrokerDto } from '../dtos/onboard-broker.dto';
import { BrokerOnboardingService } from '../services/broker-onboarding.service';

@UseGuards(JwtAuthGuard, PlatformOwnerGuard)
@Controller('saas')
export class BrokerOnboardingController {
  constructor(private readonly service: BrokerOnboardingService) {}

  @Post('onboard-broker')
  async onboardBroker(
    @Body() dto: OnboardBrokerDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.service.onboardBroker(dto, req.user.userId);
  }

  @Get('brokers')
  async listBrokers() {
    return this.service.listBrokers();
  }

  @Get('brokers/:tenantCode')
  async getBroker(@Param('tenantCode') tenantCode: string) {
    return this.service.getBroker(tenantCode);
  }

  @Post('brokers/:tenantCode/suspend')
  @HttpCode(204)
  async suspendBroker(
    @Param('tenantCode') tenantCode: string,
    @Body('reason') reason?: string,
  ): Promise<void> {
    await this.service.suspendBroker(tenantCode, reason);
  }
}
