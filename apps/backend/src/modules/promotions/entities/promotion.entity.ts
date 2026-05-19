/**
 * File:        apps/backend/src/modules/promotions/entities/promotion.entity.ts
 * Module:      promotions
 * Purpose:     Promotion entity — bonus, cashback, and discount campaigns per tenant
 *
 * Exports:
 *   - PromotionEntity — promotion record
 *
 * Depends on:
 *   - none
 *
 * Side-effects:  none
 *
 * Key invariants:
 *   - endDate must be >= startDate (validation in DTO)
 *
 * Read order:
 *   1. PromotionEntity — data shape
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-16
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('promotions')
export class PromotionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 64 })
  type!: string;

  @Column({ type: 'varchar', length: 32, default: 'DRAFT' })
  status!: string;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date' })
  endDate!: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  budget!: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  spent!: string;

  @Column({ type: 'jsonb', nullable: true })
  config!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}