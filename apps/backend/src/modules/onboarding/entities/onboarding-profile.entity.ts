/**
 * @file src/modules/onboarding/entities/onboarding-profile.entity.ts
 * @module onboarding
 * @description Onboarding and KYC tracking profile for tenant users
 * @author BharatERP
 * @created 2026-02-17
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('onboarding_profiles')
export class OnboardingProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  countryCode!: string;

  @Column({ type: 'varchar', length: 16 })
  kycTier!: string;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status!: string;

  @Column({ type: 'jsonb', default: {} })
  amlFlags!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
