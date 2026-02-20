/**
 * @file src/modules/risk-policy/entities/risk-policy.entity.ts
 * @module risk-policy
 * @description Risk policy definitions assignable by tenant and jurisdiction
 * @author BharatERP
 * @created 2026-02-17
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('risk_policies')
export class RiskPolicyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 32 })
  jurisdictionCode!: string;

  @Column({ type: 'varchar', length: 128 })
  policyName!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 1 })
  maxLeverage!: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  maxOrderNotional!: string;

  @Column({ type: 'jsonb', default: [] })
  restrictedProducts!: string[];

  @Column({ type: 'boolean', default: true })
  sanctionsCheckRequired!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
