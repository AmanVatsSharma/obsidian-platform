/**
 * @file src/modules/corporate-actions/entities/corporate-action.entity.ts
 * @module corporate-actions
 * @description Corporate action event entity for dividends/splits/mergers
 * @author BharatERP
 * @created 2026-02-17
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('corporate_actions')
export class CorporateActionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 64 })
  actionType!: string;

  @Column({ type: 'varchar', length: 64 })
  instrumentId!: string;

  @Column({ type: 'date' })
  effectiveDate!: string;

  @Column({ type: 'jsonb', default: {} })
  payload!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 32, default: 'ANNOUNCED' })
  status!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
