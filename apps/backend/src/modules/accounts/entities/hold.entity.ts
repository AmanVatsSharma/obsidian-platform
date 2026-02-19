/**
 * @file src/modules/accounts/entities/hold.entity.ts
 * @module accounts
 * @description Cash hold entity for OMS/margin/withdrawal locks with lifecycle
 * @author BharatERP
 * @created 2025-09-19
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('holds')
@Index('idx_holds_account_state', ['tenantId', 'accountId', 'state'])
@Index('ux_holds_ref', ['tenantId', 'externalRefId'], { unique: true })
export class HoldEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'reason', type: 'varchar', length: 16 })
  reason!: 'ORDER' | 'MARGIN' | 'WITHDRAWAL';

  @Column({ name: 'amount', type: 'numeric', precision: 28, scale: 8 })
  amount!: string;

  @Column({ name: 'currency', type: 'varchar', length: 8 })
  currency!: string;

  @Column({ name: 'state', type: 'varchar', length: 16, default: 'ACTIVE' })
  state!: 'ACTIVE' | 'RELEASED';

  @Column({ name: 'external_ref_id', type: 'varchar', length: 128 })
  externalRefId!: string;

  @Column({ name: 'meta', type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'released_at', nullable: true })
  releasedAt?: Date | null;
}
