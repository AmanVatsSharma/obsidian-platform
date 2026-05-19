/**
 * File:        apps/backend/src/modules/tenancy/entities/tenant-brand-config.entity.ts
 * Module:      tenancy
 * Purpose:     Stores per-tenant white-label brand configuration served to the
 *              frontend (colors, logo, domain, feature flags).
 *
 * Exports:
 *   - TenantBrandConfigEntity   — TypeORM entity for `tenant_brand_configs` table
 *
 * Depends on:
 *   - typeorm — ORM decorators
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - One row per tenant (unique constraint on tenantId)
 *   - tenantId references tenants.id (UUID), not the slug — resolved by TenancyService
 *   - features JSONB: {[flagKey: string]: boolean} — read by frontend for feature gating
 *
 * Read order:
 *   1. TenantBrandConfigEntity — all fields self-explanatory by name
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('tenant_brand_configs')
export class TenantBrandConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  tenantId!: string;

  @Column({ name: 'primary_color', type: 'varchar', length: 32, nullable: true })
  primaryColor?: string | null;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl?: string | null;

  @Column({ name: 'favicon_url', type: 'text', nullable: true })
  faviconUrl?: string | null;

  @Column({ name: 'app_name', type: 'varchar', length: 128, nullable: true })
  appName?: string | null;

  @Column({ name: 'tagline', type: 'varchar', length: 255, nullable: true })
  tagline?: string | null;

  @Column({ name: 'custom_domain', type: 'varchar', length: 255, nullable: true })
  customDomain?: string | null;

  @Column({ name: 'support_email', type: 'varchar', length: 255, nullable: true })
  supportEmail?: string | null;

  @Column({ name: 'support_phone', type: 'varchar', length: 64, nullable: true })
  supportPhone?: string | null;

  @Column({ type: 'jsonb', default: {} })
  features!: Record<string, boolean>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
