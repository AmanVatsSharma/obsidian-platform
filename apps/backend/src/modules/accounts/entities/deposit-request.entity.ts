/**
 * @file src/modules/accounts/entities/deposit-request.entity.ts
 * @module accounts
 * @description Deposit request entity awaiting admin approval before crediting ledger
 * @author BharatERP
 * @created 2025-01-09
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('deposit_requests')
@Index('idx_deposits_user', ['tenantId', 'userId'])
@Index('ux_deposits_external_ref', ['tenantId', 'externalRefId'], { unique: true })
export class DepositRequestEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'amount', type: 'numeric', precision: 28, scale: 8 })
  amount!: string;

  @Column({ name: 'currency', type: 'varchar', length: 8 })
  currency!: string;

  @Column({ name: 'external_ref_id', type: 'varchar', length: 128 })
  externalRefId!: string;

  @Column({ name: 'reference_note', type: 'varchar', length: 255, nullable: true })
  referenceNote?: string | null;

  @Column({ name: 'proof_url', type: 'varchar', length: 512, nullable: true })
  proofUrl?: string | null;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 24,
    default: 'PENDING',
  })
  status!: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date | null;

  @Column({ name: 'meta', type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

