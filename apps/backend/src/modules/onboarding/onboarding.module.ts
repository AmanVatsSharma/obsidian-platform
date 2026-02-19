/**
 * @file src/modules/onboarding/onboarding.module.ts
 * @module onboarding
 * @description Onboarding module for KYC profile lifecycle APIs
 * @author BharatERP
 * @created 2026-02-17
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { OnboardingController } from './controllers/onboarding.controller';
import { OnboardingProfileEntity } from './entities/onboarding-profile.entity';
import { OnboardingService } from './services/onboarding.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([OnboardingProfileEntity])],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
