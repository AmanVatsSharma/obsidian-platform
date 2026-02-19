/**
 * @file src/modules/accounts/entities/position-ledger-entry.entity.ts
 * @module accounts
 * @description Position ledger: quantity deltas for instruments; stores fill price & fees
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

@Entity('position_ledger_entries')
@Index('idx_pos_ledger_account_instrument_created', [
  'tenantId',
  'accountId',
  'instrumentId',
  'createdAt',
])
@Index('ux_pos_ledger_ref', ['tenantId', 'externalRefId'], { unique: true })
export class PositionLedgerEntryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'instrument_id', type: 'uuid' })
  instrumentId!: string;

  @Column({ name: 'quantity_delta', type: 'numeric', precision: 28, scale: 8 })
  quantityDelta!: string; // signed

  @Column({ name: 'price', type: 'numeric', precision: 28, scale: 8 })
  price!: string;

  @Column({
    name: 'fees',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: 0,
  })
  fees!: string;

  @Column({ name: 'side', type: 'varchar', length: 8 })
  side!: 'BUY' | 'SELL';

  @Column({ name: 'external_ref_id', type: 'varchar', length: 128 })
  externalRefId!: string;

  @Column({ name: 'meta', type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
