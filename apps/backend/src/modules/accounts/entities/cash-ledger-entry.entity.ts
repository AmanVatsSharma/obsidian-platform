/**
 * @file src/modules/accounts/entities/cash-ledger-entry.entity.ts
 * @module accounts
 * @description Cash ledger entries (double-entry style by direction) with idempotency via externalRefId
 * @author BharatERP
 * @created 2025-09-19
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('cash_ledger_entries')
@Index('idx_cash_ledger_account_created', [
  'tenantId',
  'accountId',
  'createdAt',
])
@Index('ux_cash_ledger_ref', ['tenantId', 'externalRefId'], { unique: true })
export class CashLedgerEntryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'amount', type: 'numeric', precision: 28, scale: 8 })
  amount!: string; // positive decimal as string

  @Column({ name: 'currency', type: 'varchar', length: 8 })
  currency!: string;

  @Column({ name: 'direction', type: 'varchar', length: 8 })
  direction!: 'credit' | 'debit';

  @Column({ name: 'kind', type: 'varchar', length: 24 })
  kind!:
    | 'deposit'
    | 'withdrawal'
    | 'fee'
    | 'adjustment'
    | 'trade'
    | 'settlement'
    | 'hold'
    | 'release';

  @Column({ name: 'external_ref_id', type: 'varchar', length: 128 })
  externalRefId!: string;

  @Column({ name: 'meta', type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
