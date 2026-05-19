/**
 * File:        apps/backend/src/modules/lp-routing/entities/lp-provider.entity.ts
 * Module:      lp-routing
 * Purpose:     LP (Liquidity Provider) provider entity — routing configuration per tenant
 *
 * Exports:
 *   - LpProviderEntity — LP provider record
 *
 * Depends on:
 *   - none
 *
 * Side-effects:  none
 *
 * Key invariants:
 *   - lower priority number = higher precedence
 *
 * Read order:
 *   1. LpProviderEntity — data shape
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-16
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('lp_providers')
export class LpProviderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 64 })
  type!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  apiEndpoint!: string | null;

  @Column({ type: 'boolean', default: true })
  isEnabled!: boolean;

  @Column({ type: 'int', default: 100 })
  priority!: number;

  @Column({ type: 'jsonb', nullable: true })
  config!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}