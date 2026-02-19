/**
 * @file src/modules/accounts/entities/daily-statement.entity.ts
 * @module accounts
 * @description Daily statements snapshot per account and date
 * @author BharatERP
 * @created 2025-09-19
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('daily_statements')
@Unique('ux_daily_statement_account_date', ['tenantId', 'accountId', 'date'])
export class DailyStatementEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'date', type: 'date' })
  date!: string; // UTC date (YYYY-MM-DD)

  @Column({
    name: 'opening_cash',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: 0,
  })
  openingCash!: string;

  @Column({
    name: 'closing_cash',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: 0,
  })
  closingCash!: string;

  @Column({
    name: 'deposits',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: 0,
  })
  deposits!: string;

  @Column({
    name: 'withdrawals',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: 0,
  })
  withdrawals!: string;

  @Column({
    name: 'fees',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: 0,
  })
  fees!: string;

  @Column({
    name: 'realized_pnl',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: 0,
  })
  realizedPnl!: string;

  @Column({
    name: 'unrealized_pnl',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: 0,
  })
  unrealizedPnl!: string;

  @Column({
    name: 'equity',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: 0,
  })
  equity!: string;

  @Column({
    name: 'maintenance_margin',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: 0,
  })
  maintenanceMargin!: string;

  @Column({
    name: 'buying_power',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: 0,
  })
  buyingPower!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
