/**
 * File:        apps/backend/src/modules/rbac/entities/role.entity.ts
 * Module:      rbac
 * Purpose:     Role entity (tenant-scoped)
 *
 * Exports:
 *   - RoleEntity  — DB entity (managed by RbacService)
 *
 * Depends on:
 *   - none
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - none
 *
 * Read order:
 *   1. RoleEntity — data shape
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-21
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('roles')
@Unique(['tenantId', 'name'])
@Index('idx_roles_tenant_name', ['tenantId', 'name'])
export class RoleEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId!: string;

  @Column({ name: 'name', type: 'varchar', length: 64 })
  name!: string;

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
