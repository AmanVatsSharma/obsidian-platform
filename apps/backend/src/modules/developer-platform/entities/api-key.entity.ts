/**
 * @file src/modules/developer-platform/entities/api-key.entity.ts
 * @module developer-platform
 * @description API key entity for developer authentication
 * @author BharatERP
 * @created 2026-02-19
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('developer_api_keys')
export class ApiKeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid' })
  appId!: string;

  @Column({ type: 'varchar', length: 64 })
  keyPrefix!: string;

  @Column({ type: 'varchar', length: 32, default: 'ACTIVE' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ type: 'jsonb', default: '[]' })
  scopes!: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
