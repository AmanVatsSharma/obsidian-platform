/**
 * @file src/modules/compliance/entities/compliance-policy.entity.ts
 * @module compliance
 * @description Tenant-level compliance policy by jurisdiction and risk requirements
 * @author BharatERP
 * @created 2026-02-17
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('compliance_policies')
export class CompliancePolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 32 })
  jurisdictionCode!: string;

  @Column({ type: 'varchar', length: 16 })
  kycTier!: string;

  @Column({ type: 'varchar', length: 16 })
  amlRiskLevel!: string;

  @Column({ type: 'varchar', length: 64, default: 'default-provider' })
  sanctionsProvider!: string;

  @Column({ type: 'jsonb', default: {} })
  suitabilityRules!: Record<string, unknown>;

  @Column({ type: 'int', default: 2555 })
  auditRetentionDays!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
