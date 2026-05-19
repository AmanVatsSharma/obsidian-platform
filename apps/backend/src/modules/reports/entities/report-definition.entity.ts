/**
 * File:        apps/backend/src/modules/reports/entities/report-definition.entity.ts
 * Module:      reports
 * Purpose:     Report definition entity — parameterized report templates per tenant
 *
 * Exports:
 *   - ReportDefinitionEntity — report definition record
 *
 * Depends on:
 *   - none
 *
 * Side-effects:  none
 *
 * Key invariants:
 *   - columns and filters stored as JSON — schema enforced by the report builder UI
 *
 * Read order:
 *   1. ReportDefinitionEntity — data shape
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-16
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('report_definitions')
export class ReportDefinitionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 64 })
  type!: string;

  @Column({ type: 'jsonb', default: [] })
  columns!: string[];

  @Column({ type: 'jsonb', default: {} })
  filters!: Record<string, unknown>;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastRunAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}