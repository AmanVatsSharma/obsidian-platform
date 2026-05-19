/**
 * File:        apps/backend/src/modules/pamm/entities/pamm-slave.entity.ts
 * Module:      pamm
 * Purpose:     PAMM slave (follower) allocation record linking a user to a PAMM master
 *
 * Exports:
 *   - PamMSlaveEntity — PAMM slave allocation
 *
 * Depends on:
 *   - none
 *
 * Side-effects:  none
 *
 * Key invariants:
 *   - allocationPct is 0–100
 *
 * Read order:
 *   1. PamMSlaveEntity — data shape
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-16
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('pamm_slaves')
export class PamMSlaveEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  masterId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  allocationPct!: string;

  @Column({ type: 'varchar', length: 32, default: 'ACTIVE' })
  status!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}