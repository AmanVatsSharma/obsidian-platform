/**
 * @file src/modules/limits-and-controls/entities/limit-control.entity.ts
 * @module limits-and-controls
 * @description Limit and control configuration for broker operational risk gates
 * @author BharatERP
 * @created 2026-02-17
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('limit_controls')
export class LimitControlEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 64 })
  controlType!: string;

  @Column({ type: 'varchar', length: 64 })
  scopeType!: string;

  @Column({ type: 'varchar', length: 128 })
  scopeValue!: string;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  threshold!: string;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
