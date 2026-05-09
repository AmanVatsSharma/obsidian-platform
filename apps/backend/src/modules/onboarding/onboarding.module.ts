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
import { KycDocumentEntity } from './entities/kyc-document.entity';
import { OnboardingService } from './services/onboarding.service';
import { KycDocumentService } from './services/kyc-document.service';

@Module({
  imports: [SharedModule, TypeOrmModule.forFeature([OnboardingProfileEntity, KycDocumentEntity])],
  controllers: [OnboardingController],
  providers: [OnboardingService, KycDocumentService],
  exports: [OnboardingService, KycDocumentService],
})
export class OnboardingModule {}
