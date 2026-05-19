/**
 * File:        apps/backend/src/modules/pamm/entities/pamm-master.entity.ts
 * Module:      pamm
 * Purpose:     PAMM (Percentage Allocation Management Module) master strategy entity
 *
 * Exports:
 *   - PamMMasterEntity — PAMM strategy master record
 *
 * Depends on:
 *   - none
 *
 * Side-effects:  none
 *
 * Key invariants:
 *   - minAllocation <= performanceFee (validation in DTO)
 *
 * Read order:
 *   1. PamMMasterEntity — data shape
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-16
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pamm_masters')
export class PamMMasterEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  strategyDescription!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minAllocation!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  performanceFee!: string;

  @Column({ type: 'varchar', length: 32, default: 'ACTIVE' })
  status!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}