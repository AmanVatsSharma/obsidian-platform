/**
 * @file src/modules/tenancy/entities/tenant.entity.ts
 * @module tenancy
 * @description Tenant aggregate root entity for broker SaaS provisioning
 * @author BharatERP
 * @created 2026-02-17
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 128, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  displayName!: string;

  @Column({ type: 'varchar', length: 64, default: 'UTC' })
  timezone!: string;

  @Column({ type: 'varchar', length: 64, default: 'GLOBAL' })
  jurisdictionProfile!: string;

  @Column({ type: 'varchar', length: 32, default: 'PENDING' })
  status!: TenantStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
