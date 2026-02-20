/**
 * @file src/modules/risk-policy/entities/tenant-risk-policy.entity.ts
 * @module risk-policy
 * @description Assignment map for tenant accounts to active risk policies
 * @author BharatERP
 * @created 2026-02-17
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('tenant_risk_policies')
export class TenantRiskPolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  riskPolicyId!: string;

  @Column({ type: 'varchar', length: 64 })
  scopeType!: string;

  @Column({ type: 'varchar', length: 128 })
  scopeValue!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
