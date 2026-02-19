/**
 * @file src/modules/onboarding/controllers/onboarding.controller.ts
 * @module onboarding
 * @description API scaffold for onboarding and KYC profile management
 * @author BharatERP
 * @created 2026-02-17
 */

import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UpsertOnboardingProfileDto } from '../dtos/upsert-onboarding-profile.dto';
import { OnboardingProfileEntity } from '../entities/onboarding-profile.entity';
import { OnboardingService } from '../services/onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('profiles')
  async upsert(@Body() dto: UpsertOnboardingProfileDto): Promise<OnboardingProfileEntity> {
    return this.onboardingService.upsertProfile(dto);
  }

  @Get('profiles')
  async list(@Query('tenantId') tenantId: string): Promise<OnboardingProfileEntity[]> {
    return this.onboardingService.listProfiles(tenantId);
  }
}
