/**
 * @file src/modules/accounts/entities/bank-account.entity.ts
 * @module accounts
 * @description Bank account entity for funding and withdrawals with verification status
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

@Entity('bank_accounts')
@Index('idx_bank_accounts_user', ['tenantId', 'userId'])
@Index('idx_bank_accounts_primary', ['tenantId', 'userId', 'isPrimary'])
@Index('ux_bank_accounts_unique', ['tenantId', 'userId', 'accountNumber'], {
  unique: true,
})
export class BankAccountEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'account_id', type: 'uuid', nullable: true })
  accountId?: string | null;

  @Column({ name: 'holder_name', type: 'varchar', length: 128 })
  holderName!: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 128 })
  bankName!: string;

  @Column({ name: 'account_number', type: 'varchar', length: 64 })
  accountNumber!: string;

  @Column({ name: 'account_number_masked', type: 'varchar', length: 64 })
  accountNumberMasked!: string;

  @Column({ name: 'ifsc_code', type: 'varchar', length: 16 })
  ifscCode!: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 32,
    default: 'PENDING_VERIFICATION',
  })
  status!: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ name: 'verification_meta', type: 'jsonb', nullable: true })
  verificationMeta?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

