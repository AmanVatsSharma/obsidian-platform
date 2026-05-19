/**
 * File:        apps/backend/src/modules/tenancy/entities/tenant-domain.entity.ts
 * Module:      tenancy
 * Purpose:     Manages custom domains registered against each tenant. Supports
 *              multiple domains per tenant, primary designation, DNS verification
 *              status, and SSL activation tracking.
 *
 * Exports:
 *   - TenantDomainEntity   — TypeORM entity for `tenant_domains` table
 *
 * Depends on:
 *   - typeorm — ORM decorators
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - (tenantId, domain) is unique — prevents duplicate domain registration.
 *   - Only one domain per tenant can be isPrimary=true at any time.
 *   - DNS verification and SSL activation are separate concerns — a domain
 *     may be DNS-verified without SSL being active (and vice versa).
 *
 * Read order:
 *   1. TenantDomainEntity — all fields self-explanatory by name
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-19
 */

import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('tenant_domains')
@Index(['tenantId', 'domain'], { unique: true })
export class TenantDomainEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  domain!: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'ssl_active', type: 'boolean', default: false })
  sslActive!: boolean;

  @Column({ name: 'dns_verified_at', type: 'timestamptz', nullable: true })
  dnsVerifiedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}