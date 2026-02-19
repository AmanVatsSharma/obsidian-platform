/**
 * @file src/modules/accounts/entities/withdrawal-request.entity.ts
 * @module accounts
 * @description Withdrawal requests requiring admin approval workflow
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

@Entity('withdrawal_requests')
@Index('idx_withdrawal_account_state', ['tenantId', 'accountId', 'state'])
export class WithdrawalRequestEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'amount', type: 'numeric', precision: 28, scale: 8 })
  amount!: string;

  @Column({ name: 'currency', type: 'varchar', length: 8 })
  currency!: string;

  @Column({ name: 'state', type: 'varchar', length: 16, default: 'PENDING' })
  state!: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED';

  @Column({
    name: 'external_ref_id',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  externalRefId?: string | null; // reference to payout id when fulfilled

  @Column({ name: 'meta', type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
