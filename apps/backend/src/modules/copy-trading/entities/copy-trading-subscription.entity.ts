/**
 * File:        apps/backend/src/modules/copy-trading/entities/copy-trading-subscription.entity.ts
 * Module:      copy-trading
 * Purpose:     Copy trading subscription entity — links a slave user to a master user
 *
 * Exports:
 *   - CopyTradingSubscriptionEntity — subscription record
 *
 * Depends on:
 *   - none
 *
 * Side-effects:  none
 *
 * Key invariants:
 *   - none
 *
 * Read order:
 *   1. CopyTradingSubscriptionEntity — data shape
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-16
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('copy_trading_subscriptions')
export class CopyTradingSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  masterUserId!: string;

  @Column({ type: 'uuid' })
  slaveUserId!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  copyPct!: string;

  @Column({ type: 'varchar', length: 32, default: 'ACTIVE' })
  status!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}