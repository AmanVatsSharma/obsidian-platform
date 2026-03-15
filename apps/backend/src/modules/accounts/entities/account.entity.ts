/**
 * @file src/modules/accounts/entities/account.entity.ts
 * @module accounts
 * @description Trading account entity bound to user and tenant; supports multi-account and multi-currency
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

@Entity('accounts')
@Index('idx_accounts_user', ['tenantId', 'userId'])
@Index('idx_accounts_status', ['status'])
@Index('idx_accounts_tenant_user_type', ['tenantId', 'userId', 'accountType'])
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string; // references users.id

  @Column({ name: 'account_type', type: 'varchar', length: 16, default: 'LIVE' })
  accountType!: 'LIVE' | 'DEMO';

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'ACTIVE' })
  status!: 'ACTIVE' | 'DISABLED';

  @Column({ name: 'base_currency', type: 'varchar', length: 8, default: 'INR' })
  baseCurrency!: string; // e.g., INR, USD

  @Column({ name: 'preferences', type: 'jsonb', nullable: true })
  preferences?: Record<string, unknown> | null; // includes statement timezone preference

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
