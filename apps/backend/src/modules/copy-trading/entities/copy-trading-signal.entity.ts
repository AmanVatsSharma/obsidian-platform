/**
 * File:        apps/backend/src/modules/copy-trading/entities/copy-trading-signal.entity.ts
 * Module:      copy-trading
 * Purpose:     Copy trading signal entity — trades copied from master to slave accounts
 *
 * Exports:
 *   - CopyTradingSignalEntity — signal record
 *
 * Depends on:
 *   - none
 *
 * Side-effects:  none
 *
 * Key invariants:
 *   - direction is BUY or SELL
 *
 * Read order:
 *   1. CopyTradingSignalEntity — data shape
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-16
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('copy_trading_signals')
export class CopyTradingSignalEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  masterUserId!: string;

  @Column({ type: 'varchar', length: 64 })
  symbol!: string;

  @Column({ type: 'varchar', length: 4 })
  direction!: string;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  lots!: string;

  @Column({ type: 'varchar', length: 32, default: 'PENDING' })
  status!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}