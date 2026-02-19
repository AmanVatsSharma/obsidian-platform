/**
 * @file src/modules/dealing/entities/deal.entity.ts
 * @module dealing
 * @description Deal entity for capture and status tracking
 * @author BharatERP
 * @created 2026-02-19
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('dealing_deals')
export class DealEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 64 })
  instrumentId!: string;

  @Column({ type: 'varchar', length: 16 })
  side!: string;

  @Column({ type: 'decimal', precision: 24, scale: 8 })
  quantity!: string;

  @Column({ type: 'decimal', precision: 24, scale: 8 })
  price!: string;

  @Column({ type: 'varchar', length: 32, default: 'PENDING' })
  status!: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
