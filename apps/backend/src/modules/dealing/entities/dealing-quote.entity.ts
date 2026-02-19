/**
 * @file src/modules/dealing/entities/dealing-quote.entity.ts
 * @module dealing
 * @description Quote entity for RFQ and quote tracking
 * @author BharatERP
 * @created 2026-02-19
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('dealing_quotes')
export class DealingQuoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 64 })
  instrumentId!: string;

  @Column({ type: 'decimal', precision: 24, scale: 8 })
  bid!: string;

  @Column({ type: 'decimal', precision: 24, scale: 8 })
  ask!: string;

  @Column({ type: 'varchar', length: 32, default: 'PENDING' })
  status!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
